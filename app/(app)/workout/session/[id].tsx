// app/workout/session/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Exercise, Workout, workouts } from "../../../../constants/workouts";

/* ===================== TYPES ===================== */

type BackendMode = "squat" | "pushup" | "curl" | "crunch";

type FrameStatePayload = {
  tracking?: {
    status?: "ok" | "unstable" | "lost";
    lost_frames?: number;
    confidence?: number;
    reason?: string;
  };
  rep_state?: {
    reps?: number;
    count?: number;
    phase?: string;
    frame_id?: number;
  };
  rep_count?: number;
  frame_id?: number;
  feedback?: {
    cues?: string[];
    metrics?: Record<string, any>;
  };
};

type WSMessage =
  | { frame_id?: number; error: string }
  | { frame_id?: number; type: "frame_state"; payload: FrameStatePayload }
  | { frame_id?: number; rep_count?: number; stage?: string }; // legacy fallback

/* ===================== SCREEN ===================== */

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const [permission, requestPermission] = useCameraPermissions();

  // -------------------------
  // WebSocket + Streaming
  // -------------------------
  const cameraRef = useRef<CameraView | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);
  const frameIdRef = useRef(0);

  // WEB refs for streaming (use any to avoid DOM typings problems in RN TS)
  const webVideoRef = useRef<any>(null);
  const webCanvasRef = useRef<any>(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);

  // Backend-reflected state
  const [repCount, setRepCount] = useState<number | null>(null);
  const [stage, setStage] = useState<string>("-");
  const [trackingStatus, setTrackingStatus] = useState<
    "ok" | "unstable" | "lost"
  >("lost");
  const [trackingConf, setTrackingConf] = useState<number>(0);
  const [trackingReason, setTrackingReason] = useState<string>("-");
  const [lostFrames, setLostFrames] = useState<number>(0);
  const [cues, setCues] = useState<string[]>([]);
  const [feedbackLog, setFeedbackLog] = useState<string[]>([]);

  // Debug snippet (small)
  const [lastMsgType, setLastMsgType] = useState<string>("-");
  const [lastRawShort, setLastRawShort] = useState<string>("");
  const [lastParsedRep, setLastParsedRep] = useState<{
    v: number;
    frame?: number;
  } | null>(null);
  const [lastRttMs, setLastRttMs] = useState<number | null>(null);
  const [avgRttMs, setAvgRttMs] = useState<number | null>(null);
  const [responsesPerSecond, setResponsesPerSecond] = useState<number | null>(
    null,
  );

  // -------------------------
  // WS URL
  // -------------------------
  const WS_URL = useMemo(() => "wss://fypbacktest.onrender.com/ws/infer", []);

  // -------------------------
  // Workout lookup
  // -------------------------
  const workout: Workout | undefined = workouts.find(
    (w: Workout) => w.id === workoutId,
  );

  if (!workout || workout.exercises.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>Workout not found.</Text>
      </View>
    );
  }

  // MVP: first exercise
  const currentIndex = 0;
  const currentExercise: Exercise = workout.exercises[currentIndex];
  const totalExercises = workout.exercises.length;

  // Map workout exercise name -> backend mode
  const backendMode = useMemo<BackendMode>(() => {
    const name = (currentExercise?.name || "").toLowerCase();
    if (name.includes("squat")) return "squat";
    if (name.includes("push")) return "pushup";
    if (name.includes("curl")) return "curl";
    if (name.includes("crunch")) return "crunch";
    return "squat";
  }, [currentExercise?.name]);

  const totalReps = useMemo(() => {
    const match = currentExercise.reps.match(/\d+/);
    return match ? Number(match[0]) : null;
  }, [currentExercise.reps]);

  const doneReps = repCount ?? 0;
  const remainingReps =
    totalReps !== null ? Math.max(totalReps - doneReps, 0) : null;
  const completion =
    totalReps && totalReps > 0
      ? Math.min(100, Math.round((doneReps / totalReps) * 100))
      : 0;

  const nextExercise: Exercise | undefined =
    workout.exercises[currentIndex + 1];

  const primaryFeedback = useMemo(() => {
    if (cues.length > 0) return cues[0];
    if (trackingReason && trackingReason !== "-") return trackingReason;
    return "Keep your full body in frame for clearer coaching.";
  }, [cues, trackingReason]);

  // -------------------------
  // WS connect with auto-retry
  // -------------------------
  useEffect(() => {
    let ws: WebSocket | null = null;
    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (stopped) return;

      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);

      ws.onmessage = (event) => {
        const raw = String((event as any).data || "");
        // keep a longer preview for debugging rep updates
        setLastRawShort(raw.slice(0, 1000));

        try {
          const msg: WSMessage = JSON.parse(raw);
          if ((msg as any)?.error) {
            setLastMsgType("error");
            return;
          }

          // New format
          if ((msg as any)?.type === "frame_state" && (msg as any)?.payload) {
            setLastMsgType("frame_state");
            const p = (msg as any).payload as FrameStatePayload;

            // Robust rep parsing: accept numbers or numeric strings and
            // look in a couple of possible fields (payload.rep_state.reps,
            // payload.rep_count, or top-level msg.rep_count).
            const repsRaw =
              p?.rep_state?.reps ??
              p?.rep_state?.count ??
              (msg as any)?.rep_count ??
              p?.rep_count;
            if (repsRaw !== undefined && repsRaw !== null) {
              const parsed =
                typeof repsRaw === "number"
                  ? repsRaw
                  : parseInt(String(repsRaw), 10);
              if (!Number.isNaN(parsed)) {
                // Set the rep count directly (remove the "only update if greater" logic)
                setRepCount(parsed);

                // capture frame id if provided for debugging
                const frameId =
                  (msg as any)?.frame_id ?? p?.frame_id ?? undefined;
                setLastParsedRep({
                  v: parsed,
                  frame: typeof frameId === "number" ? frameId : undefined,
                });
                // mark debug label to show rep was parsed
                setLastMsgType(`frame_state(reps=${parsed})`);
              }
            }

            const phase = p?.rep_state?.phase ?? (msg as any)?.stage;
            if (typeof phase === "string") setStage(phase);

            const status = p?.tracking?.status;
            const conf = p?.tracking?.confidence;
            const reasonRaw = p?.tracking?.reason;
            const lf = p?.tracking?.lost_frames;
            const newCues = p?.feedback?.cues;

            if (status === "ok" || status === "unstable" || status === "lost")
              setTrackingStatus(status);
            if (typeof conf === "number") setTrackingConf(conf);
            // Normalize tracking reason: don't display bare 'ok' as a failure reason
            if (typeof reasonRaw === "string") {
              const r = reasonRaw.trim();
              if (r.length === 0 || r.toLowerCase() === "ok")
                setTrackingReason("-");
              else setTrackingReason(r);
            }
            if (typeof lf === "number") setLostFrames(lf);
            if (Array.isArray(newCues)) {
              setCues(newCues);
              setFeedbackLog((prev) => {
                const next = [...newCues, ...prev];
                return Array.from(new Set(next.map((item) => item.trim()).filter(Boolean))).slice(0, 10);
              });
            }
            if (typeof reasonRaw === "string") {
              const normalizedReason = reasonRaw.trim();
              if (
                normalizedReason &&
                normalizedReason.toLowerCase() !== "ok"
              ) {
                setFeedbackLog((prev) => {
                  const next = [normalizedReason, ...prev];
                  return Array.from(new Set(next)).slice(0, 10);
                });
              }
            }

            return;
          }

          // Legacy fallback
          if (
            typeof (msg as any)?.rep_count === "number" ||
            typeof (msg as any)?.stage === "string"
          ) {
            setLastMsgType("legacy(rep_count/stage)");
            const m: any = msg;

            if (typeof m.rep_count === "number") setRepCount(m.rep_count);
            if (typeof m.stage === "string") setStage(m.stage);

            setTrackingStatus("ok");
            setTrackingConf(1);
            setTrackingReason("legacy_backend_no_tracking_fields");
            setLostFrames(0);
            return;
          }

          setLastMsgType(
            (msg as any)?.type ? String((msg as any).type) : "unknown_json",
          );
        } catch {
          setLastMsgType("non_json");
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        setLastRttMs(null);
        setAvgRttMs(null);
        setResponsesPerSecond(null);
        stopStreaming();
        if (!stopped) retryTimer = setTimeout(connect, 1500);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (ws) ws.close();
    };
  }, [WS_URL]);

  // -------------------------
  // Frame send helpers
  // -------------------------
  const sendFrameToWS = (base64Jpeg: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return;
    // avoid lag
    if (ws.bufferedAmount > 1_000_000) return;

    ws.send(
      JSON.stringify({
        frame_id: ++frameIdRef.current,
        ts: Date.now(),
        mode: backendMode,
        // send as Data URL for maximum decode compatibility
        image_b64: base64Jpeg.startsWith("data:")
          ? base64Jpeg
          : `data:image/jpeg;base64,${base64Jpeg}`,
      }),
    );
  };

  // -------------------------
  // Start / Stop streaming
  // -------------------------
  const startStreaming = () => {
    if (streaming) return;
    if (!wsRef.current || wsRef.current.readyState !== 1) return;

    setStreaming(true);
    setFeedbackLog([]);
    setLastRttMs(null);
    setAvgRttMs(null);
    setResponsesPerSecond(null);

    intervalRef.current = setInterval(async () => {
      if (busyRef.current) return;
      busyRef.current = true;

      try {
        // WEB streaming: capture from <video> into <canvas>
        if (Platform.OS === "web") {
          const vid = webVideoRef.current;
          const canvas = webCanvasRef.current;
          if (!vid || !canvas) return;

          // wait for metadata
          if (!vid.videoWidth || !vid.videoHeight) return;

          const targetW = 480;
          const scale = targetW / vid.videoWidth;
          const targetH = Math.round(vid.videoHeight * scale);

          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext?.("2d");
          if (!ctx) return;

          // Mirror horizontally for "front camera" feel
          ctx.save();
          ctx.translate(targetW, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(vid, 0, 0, targetW, targetH);
          ctx.restore();

          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          sendFrameToWS(dataUrl);
          return;
        }

        // NATIVE streaming: takePictureAsync + resize
        const cam = cameraRef.current;
        if (!cam) return;

        const photo = await cam.takePictureAsync({
          base64: true,
          quality: 0.6,
          skipProcessing: false,
        });

        const resized = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 480 } }],
          {
            compress: 0.65,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          },
        );

        if (!resized.base64) return;
        sendFrameToWS(resized.base64);
      } finally {
        busyRef.current = false;
      }
    }, 180);
  };

  const stopStreaming = () => {
    setStreaming(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    busyRef.current = false;
  };

  useEffect(() => stopStreaming, []);

  // -------------------------
  // Camera permission states (native)
  // -------------------------
  if (Platform.OS !== "web") {
    if (!permission) return <View style={styles.screen} />;
  }

  const renderCameraOverlay = () => (
    <>
      <View style={styles.statusStrip} pointerEvents="none">
        <View style={styles.statusPill}>
          <Text style={styles.statusLabel}>Connection</Text>
          <Text style={styles.statusValue}>
            {wsConnected ? "Connected" : "Reconnecting"}
          </Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusLabel}>Tracking</Text>
          <Text style={styles.statusValue}>{trackingStatus.toUpperCase()}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusLabel}>Stage</Text>
          <Text style={styles.statusValue}>{stage || "-"}</Text>
        </View>
      </View>

      <View style={styles.liveRepBadge} pointerEvents="none">
        <Text style={styles.liveRepBadgeLabel}>Reps</Text>
        <Text style={styles.liveRepBadgeValue}>{repCount ?? 0}</Text>
      </View>

      <View style={styles.primaryFeedbackBox} pointerEvents="none">
        <Text style={styles.primaryFeedbackLabel}>Live Form Feedback</Text>
        <Text style={styles.primaryFeedbackText}>{primaryFeedback}</Text>
      </View>

      <View style={styles.feedbackPanel}>
        <View style={styles.feedbackPanelHeader}>
          <Text style={styles.feedbackPanelTitle}>Feedback Log</Text>
          <Text style={styles.feedbackPanelMeta}>
            {trackingConf > 0
              ? `${Math.round(trackingConf * 100)}% tracked`
              : "Waiting for stable tracking"}
          </Text>
        </View>

        <ScrollView
          style={styles.feedbackScroll}
          contentContainerStyle={styles.feedbackScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {feedbackLog.length > 0 ? (
            feedbackLog.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.feedbackItem}>
                <Text style={styles.feedbackBullet}>-</Text>
                <Text style={styles.feedbackItemText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.feedbackEmptyText}>
              Start the camera to see posture corrections here.
            </Text>
          )}
        </ScrollView>

        <Text style={styles.feedbackFooter} numberOfLines={1}>
          {lastMsgType} | RTT {lastRttMs !== null ? `${lastRttMs}ms` : "-"} |
          {" "}FPS {responsesPerSecond !== null ? responsesPerSecond : "-"} |
          {" "}Lost {lostFrames}
        </Text>
      </View>
    </>
  );

  const renderCameraArea = () => {
    // Native permission gate
    if (Platform.OS !== "web" && permission && !permission.granted) {
      return (
        <View style={[styles.cameraArea, styles.cameraPlaceholder]}>
          <Text style={styles.cameraPlaceholderText}>
            Camera access needed for live coaching.
          </Text>
          <TouchableOpacity
            style={styles.cameraPermissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.cameraPermissionText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // WEB: browser camera preview (with refs for capture)
    if (Platform.OS === "web") {
      return (
        <View style={{ position: "relative" }}>
          <WebCamera style={styles.cameraArea} videoRef={webVideoRef} />

          {/* hidden canvas for capture */}
          {/* @ts-ignore */}
          <canvas ref={webCanvasRef} style={{ display: "none" }} />
          {renderCameraOverlay()}

          <View style={styles.cameraHud}>
            <Text style={styles.cameraHudText}>
              WS: {wsConnected ? "connected" : "disconnected"}
            </Text>
            <Text style={styles.cameraHudText}>
              Track: {trackingStatus} ({trackingConf.toFixed(2)})
            </Text>
            <Text style={styles.cameraHudText}>
              RTT: {lastRttMs !== null ? `${lastRttMs}ms` : "-"} | Avg:{" "}
              {avgRttMs !== null ? `${avgRttMs}ms` : "-"}
            </Text>
            <Text style={styles.cameraHudText}>
              Effective FPS:{" "}
              {responsesPerSecond !== null ? responsesPerSecond : "-"}
            </Text>
            <Text style={styles.cameraHudText}>Reason: {trackingReason}</Text>
            <Text style={styles.cameraHudText}>Lost: {lostFrames}</Text>
            <Text style={styles.cameraHudText}>Stage: {stage || "-"}</Text>
          </View>

          {/* Rep counter badge (top-right) */}
          <View style={styles.repBadge} pointerEvents="none">
            <Text style={styles.repBadgeLabel}>Reps</Text>
            <Text style={styles.repBadgeValue}>{repCount ?? 0}</Text>
          </View>

          {/* Reason banner (center-top) */}
          {((cues && cues.length > 0) ||
            (trackingReason && trackingReason.length)) && (
            <View style={styles.reasonBox} pointerEvents="none">
              <Text
                style={styles.reasonText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {cues && cues.length > 0 ? cues[0] : trackingReason}
              </Text>
            </View>
          )}

          {cues.length > 0 && (
            <View style={styles.cuesBox}>
              {cues.slice(0, 2).map((c, i) => (
                <Text key={i} style={styles.cueText}>
                  • {c}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.debugBox}>
            <Text style={styles.debugText}>
              {lastMsgType} | {backendMode} | {streaming ? "streaming" : "idle"}
            </Text>
            <Text style={styles.debugText} numberOfLines={2}>
              {lastRawShort}
            </Text>
            {lastParsedRep ? (
              <Text style={styles.debugText} numberOfLines={1}>
                parsedRep: {lastParsedRep.v}
                {lastParsedRep.frame ? ` (frame:${lastParsedRep.frame})` : ""}
              </Text>
            ) : null}
          </View>
        </View>
      );
    }

    // Native: live camera preview
    return (
      <View style={{ position: "relative" }}>
        <CameraView ref={cameraRef} style={styles.cameraArea} facing="front" />
        {renderCameraOverlay()}

        <View style={styles.cameraHud}>
          <Text style={styles.cameraHudText}>
            WS: {wsConnected ? "connected" : "disconnected"}
          </Text>
          <Text style={styles.cameraHudText}>
            Track: {trackingStatus} ({trackingConf.toFixed(2)})
          </Text>
          <Text style={styles.cameraHudText}>
            RTT: {lastRttMs !== null ? `${lastRttMs}ms` : "-"} | Avg:{" "}
            {avgRttMs !== null ? `${avgRttMs}ms` : "-"}
          </Text>
          <Text style={styles.cameraHudText}>
            Effective FPS:{" "}
            {responsesPerSecond !== null ? responsesPerSecond : "-"}
          </Text>
          <Text style={styles.cameraHudText}>Reason: {trackingReason}</Text>
          <Text style={styles.cameraHudText}>Lost: {lostFrames}</Text>
          <Text style={styles.cameraHudText}>Stage: {stage || "-"}</Text>
        </View>

        {/* Rep counter badge (top-right) */}
        <View style={styles.repBadge} pointerEvents="none">
          <Text style={styles.repBadgeLabel}>Reps</Text>
          <Text style={styles.repBadgeValue}>{repCount ?? 0}</Text>
        </View>

        {/* Reason banner (center-top) */}
        {((cues && cues.length > 0) ||
          (trackingReason && trackingReason.length)) && (
          <View style={styles.reasonBox} pointerEvents="none">
            <Text
              style={styles.reasonText}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {cues && cues.length > 0 ? cues[0] : trackingReason}
            </Text>
          </View>
        )}

        {cues.length > 0 && (
          <View style={styles.cuesBox}>
            {cues.slice(0, 2).map((c, i) => (
              <Text key={i} style={styles.cueText}>
                • {c}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.debugBox}>
          <Text style={styles.debugText}>
            {lastMsgType} | {backendMode} | {streaming ? "streaming" : "idle"}
          </Text>
          <Text style={styles.debugText} numberOfLines={2}>
            {lastRawShort}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{workout.title}</Text>

          {/* Keep your red camera button */}
          <TouchableOpacity
            style={[styles.cameraButton, !wsConnected && { opacity: 0.5 }]}
            disabled={!wsConnected}
            onPress={() => (streaming ? stopStreaming() : startStreaming())}
          >
            <Ionicons
              name={streaming ? "stop-circle-outline" : "camera-outline"}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Camera area */}
        {renderCameraArea()}

        {/* Progress row */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Exercise {currentIndex + 1} of {totalExercises}
          </Text>
          <Text style={styles.progressText}>{completion}% Complete</Text>
        </View>

        {/* Exercise card */}
        <View style={styles.exerciseCard}>
          {/* Title + remaining */}
          <View style={styles.exerciseHeaderRow}>
            <View>
              <Text style={styles.exerciseName}>{currentExercise.name}</Text>
              <Text style={styles.exerciseSubText}>
                {doneReps}/{totalReps ?? currentExercise.reps} reps
              </Text>
            </View>
            <View style={styles.remainingBlock}>
              <Text style={styles.remainingLabel}>Remaining</Text>
              <Text style={styles.remainingValue}>{remainingReps ?? "-"}</Text>
            </View>
          </View>

          {/* Form Tip card */}
          <View style={styles.formTipCard}>
            <View style={styles.formTipHeaderRow}>
              <Ionicons
                name="bulb-outline"
                size={14}
                color="#FBBF24"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.formTipLabel}>Form Tip:</Text>
            </View>
            <Text style={styles.formTipText}>
              {cues[0] ||
                currentExercise.tips[0] ||
                "Maintain proper form throughout."}
            </Text>
          </View>

          {/* Motivational button (kept) */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.actionButton, styles.keepGoingButton]}
            onPress={() => {}}
          >
            <Text style={styles.actionButtonText}>
              🔥 Just 10 more! You got this!
            </Text>
          </TouchableOpacity>

          {/* Pause button (kept) */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.actionButton, styles.pauseButton]}
            onPress={() => {}}
          >
            <Text style={styles.actionButtonText}>⏸️ Pause Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Coming Up Next (kept) */}
        <View style={styles.nextSection}>
          <Text style={styles.nextLabel}>Coming Up Next:</Text>
          {nextExercise ? (
            <Text style={styles.nextText}>{nextExercise.name} - 10 reps</Text>
          ) : (
            <Text style={styles.nextText}>Finish Strong 💪</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ===================== WEB CAMERA COMPONENT ===================== */
function WebCamera({
  style,
  videoRef,
}: {
  style: any;
  videoRef: React.MutableRefObject<any>;
}) {
  const [error, setError] = useState("");

  useEffect(() => {
    let stream: any = null;

    const start = async () => {
      try {
        const nav: any = (globalThis as any)?.navigator;
        if (!nav?.mediaDevices?.getUserMedia) {
          setError("Camera not available in this browser context.");
          return;
        }

        stream = await nav.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e: any) {
        setError(e?.message || "Camera blocked (needs HTTPS or localhost)");
      }
    };

    start();

    return () => {
      if (stream?.getTracks) stream.getTracks().forEach((t: any) => t.stop());
    };
  }, [videoRef]);

  if (error) {
    return (
      <View style={[style, styles.cameraPlaceholder]}>
        <Text style={styles.cameraPlaceholderText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {/* @ts-ignore */}
      <video
        ref={(el) => {
          // IMPORTANT: must return void (not el) to satisfy React ref typing
          videoRef.current = el;
        }}
        playsInline
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020817",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cameraButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#FF3B3F",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraArea: {
    height: 540,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
    marginBottom: 24,
  },

  cameraHud: {
    display: "none",
  },
  cameraHudText: {
    display: "none",
  },

  statusStrip: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 6,
    pointerEvents: "none",
  },
  statusPill: {
    minWidth: 92,
    backgroundColor: "rgba(2,6,23,0.78)",
    borderColor: "rgba(148,163,184,0.22)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
  },
  statusLabel: {
    color: "#94A3B8",
    fontSize: 10,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  statusValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  cuesBox: {
    display: "none",
  },
  cueText: {
    display: "none",
  },

  debugBox: {
    display: "none",
  },
  debugText: {
    display: "none",
  },

  repBadge: {
    display: "none",
  },
  repBadgeLabel: {
    display: "none",
  },
  repBadgeValue: {
    display: "none",
  },
  liveRepBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(2,6,23,0.8)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  liveRepBadgeLabel: {
    color: "#94A3B8",
    fontSize: 10,
    textTransform: "uppercase",
  },
  liveRepBadgeValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  reasonBox: {
    display: "none",
  },
  reasonText: {
    display: "none",
  },
  primaryFeedbackBox: {
    position: "absolute",
    top: 88,
    left: 14,
    right: 14,
    backgroundColor: "rgba(15,23,42,0.82)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    pointerEvents: "none",
  },
  primaryFeedbackLabel: {
    color: "#FBBF24",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  primaryFeedbackText: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  feedbackPanel: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    height: 150,
    backgroundColor: "rgba(2,6,23,0.86)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    padding: 14,
  },
  feedbackPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  feedbackPanelTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  feedbackPanelMeta: {
    color: "#94A3B8",
    fontSize: 11,
    flexShrink: 1,
    textAlign: "right",
  },
  feedbackScroll: {
    flex: 1,
  },
  feedbackScrollContent: {
    paddingBottom: 6,
    gap: 8,
  },
  feedbackItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  feedbackBullet: {
    color: "#F97316",
    fontSize: 18,
    lineHeight: 22,
  },
  feedbackItemText: {
    flex: 1,
    color: "#E2E8F0",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  feedbackEmptyText: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackFooter: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 11,
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressText: {
    color: "#9CA3AF",
    fontSize: 11,
  },

  cameraPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPlaceholderText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
    paddingHorizontal: 14,
  },
  cameraPermissionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FF3B3F",
  },
  cameraPermissionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },

  exerciseCard: {
    backgroundColor: "#050B16",
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  exerciseHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  exerciseName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseSubText: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },
  remainingBlock: {
    alignItems: "flex-end",
  },
  remainingLabel: {
    color: "#9CA3AF",
    fontSize: 10,
  },
  remainingValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 2,
  },
  formTipCard: {
    backgroundColor: "#0B1220",
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
  },
  formTipHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  formTipLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
  },
  formTipText: {
    color: "#E5E7EB",
    fontSize: 11,
    lineHeight: 16,
  },
  actionButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  keepGoingButton: {
    backgroundColor: "#FF3B3F",
  },
  pauseButton: {
    backgroundColor: "#FF6B3F",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  nextSection: {
    alignItems: "center",
    marginTop: 4,
  },
  nextLabel: {
    color: "#6B7280",
    fontSize: 10,
    marginBottom: 2,
  },
  nextText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
