// app/workout/session/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
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
  | { frame_id?: number; rep_count?: number; stage?: string };

/* ===================== SCREEN ===================== */

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);
  const frameIdRef = useRef(0);

  const webVideoRef = useRef<any>(null);
  const webCanvasRef = useRef<any>(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);

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

  const [lastMsgType, setLastMsgType] = useState<string>("-");
  const [lastRawShort, setLastRawShort] = useState<string>("");
  const [lastParsedRep, setLastParsedRep] = useState<{
    v: number;
    frame?: number;
  } | null>(null);
  const [lastRttMs, setLastRttMs] = useState<number | null>(null);
  const [avgRttMs, setAvgRttMs] = useState<number | null>(null);
  const [responsesPerSecond, setResponsesPerSecond] = useState<number | null>(
    null
  );

  const WS_URL = useMemo(() => "wss://fyp-t6nc.onrender.com/ws/infer", []);

  const workout: Workout | undefined = workouts.find(
    (w: Workout) => w.id === workoutId
  );

  if (!workout || workout.exercises.length === 0) {
    return (
      <View className="flex-1 bg-slate-950 px-4 pt-4">
        <View className="mb-3 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text className="mt-10 text-center text-sm text-white">
          Workout not found.
        </Text>
      </View>
    );
  }

  const currentIndex = 0;
  const currentExercise: Exercise | undefined =
    workout?.exercises[currentIndex];
  const totalExercises = workout?.exercises.length ?? 0;

  const backendMode = useMemo<BackendMode>(() => {
    const name = (currentExercise?.name || "").toLowerCase();
    if (name.includes("squat")) return "squat";
    if (name.includes("push")) return "pushup";
    if (name.includes("curl")) return "curl";
    if (name.includes("crunch")) return "crunch";
    return "squat";
  }, [currentExercise?.name]);

  const totalReps = useMemo(() => {
    const match = currentExercise?.reps?.match(/\d+/);
    return match ? Number(match[0]) : null;
  }, [currentExercise?.reps]);

  const doneReps = repCount ?? 0;
  const remainingReps =
    totalReps !== null ? Math.max(totalReps - doneReps, 0) : null;
  const completion =
    totalReps && totalReps > 0
      ? Math.min(100, Math.round((doneReps / totalReps) * 100))
      : 0;

  const nextExercise: Exercise | undefined =
    workout?.exercises[currentIndex + 1];

  const primaryFeedback = useMemo(() => {
    if (cues.length > 0) return cues[0];
    if (trackingReason && trackingReason !== "-") return trackingReason;
    return "Keep your full body in frame for clearer coaching.";
  }, [cues, trackingReason]);

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
        setLastRawShort(raw.slice(0, 1000));

        try {
          const msg: WSMessage = JSON.parse(raw);
          if ((msg as any)?.error) {
            setLastMsgType("error");
            return;
          }

          if ((msg as any)?.type === "frame_state" && (msg as any)?.payload) {
            setLastMsgType("frame_state");
            const p = (msg as any).payload as FrameStatePayload;

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
                setRepCount(parsed);

                const frameId =
                  (msg as any)?.frame_id ?? p?.frame_id ?? undefined;

                setLastParsedRep({
                  v: parsed,
                  frame: typeof frameId === "number" ? frameId : undefined,
                });

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

            if (status === "ok" || status === "unstable" || status === "lost") {
              setTrackingStatus(status);
            }
            if (typeof conf === "number") setTrackingConf(conf);

            if (typeof reasonRaw === "string") {
              const r = reasonRaw.trim();
              if (r.length === 0 || r.toLowerCase() === "ok") {
                setTrackingReason("-");
              } else {
                setTrackingReason(r);
              }
            }

            if (typeof lf === "number") setLostFrames(lf);

            if (Array.isArray(newCues)) {
              setCues(newCues);
              setFeedbackLog((prev) => {
                const next = [...newCues, ...prev];
                return Array.from(
                  new Set(next.map((item) => item.trim()).filter(Boolean))
                ).slice(0, 10);
              });
            }

            if (typeof reasonRaw === "string") {
              const normalizedReason = reasonRaw.trim();
              if (normalizedReason && normalizedReason.toLowerCase() !== "ok") {
                setFeedbackLog((prev) => {
                  const next = [normalizedReason, ...prev];
                  return Array.from(new Set(next)).slice(0, 10);
                });
              }
            }

            return;
          }

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
            (msg as any)?.type ? String((msg as any).type) : "unknown_json"
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

  const sendFrameToWS = (base64Jpeg: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return;
    if (ws.bufferedAmount > 1_000_000) return;

    ws.send(
      JSON.stringify({
        frame_id: ++frameIdRef.current,
        ts: Date.now(),
        mode: backendMode,
        image_b64: base64Jpeg.startsWith("data:")
          ? base64Jpeg
          : `data:image/jpeg;base64,${base64Jpeg}`,
      })
    );
  };

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
        if (Platform.OS === "web") {
          const vid = webVideoRef.current;
          const canvas = webCanvasRef.current;
          if (!vid || !canvas) return;
          if (!vid.videoWidth || !vid.videoHeight) return;

          const targetW = 480;
          const scale = targetW / vid.videoWidth;
          const targetH = Math.round(vid.videoHeight * scale);

          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext?.("2d");
          if (!ctx) return;

          ctx.save();
          ctx.translate(targetW, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(vid, 0, 0, targetW, targetH);
          ctx.restore();

          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          sendFrameToWS(dataUrl);
          return;
        }

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
          }
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

  if (Platform.OS !== "web") {
    if (!permission) return <View className="flex-1 bg-slate-950" />;
  }

  const renderCameraOverlay = () => (
    <>
      <View
        pointerEvents="none"
        className="absolute left-2.5 right-2.5 top-2.5 flex-row flex-wrap items-start gap-1.5"
      >
        <View className="min-w-[92px] rounded-2xl border border-slate-400/20 bg-slate-950/80 px-2.5 py-2">
          <Text className="mb-0.5 text-[10px] uppercase text-slate-400">
            Connection
          </Text>
          <Text className="text-[13px] font-bold text-white">
            {wsConnected ? "Connected" : "Reconnecting"}
          </Text>
        </View>

        <View className="min-w-[92px] rounded-2xl border border-slate-400/20 bg-slate-950/80 px-2.5 py-2">
          <Text className="mb-0.5 text-[10px] uppercase text-slate-400">
            Tracking
          </Text>
          <Text className="text-[13px] font-bold uppercase text-white">
            {trackingStatus}
          </Text>
        </View>

        <View className="min-w-[92px] rounded-2xl border border-slate-400/20 bg-slate-950/80 px-2.5 py-2">
          <Text className="mb-0.5 text-[10px] uppercase text-slate-400">
            Stage
          </Text>
          <Text className="text-[13px] font-bold text-white">
            {stage || "-"}
          </Text>
        </View>
      </View>

      <View
        pointerEvents="none"
        className="absolute right-2.5 top-2.5 items-center justify-center rounded-2xl border border-slate-400/20 bg-slate-950/80 px-3 py-2"
      >
        <Text className="text-[10px] uppercase text-slate-400">Reps</Text>
        <Text className="mt-0.5 text-[22px] font-bold text-white">
          {repCount ?? 0}
        </Text>
      </View>

      <View
        pointerEvents="none"
        className="absolute left-3.5 right-3.5 top-[88px] rounded-[18px] border border-amber-400/35 bg-slate-900/80 px-4 py-3.5"
      >
        <Text className="mb-1.5 text-[11px] font-bold uppercase text-amber-400">
          Live Form Feedback
        </Text>
        <Text className="text-[20px] font-bold leading-[26px] text-white">
          {primaryFeedback}
        </Text>
      </View>

      <View className="absolute bottom-3.5 left-3.5 right-3.5 h-[150px] rounded-[18px] border border-slate-400/20 bg-slate-950/85 p-3.5">
        <View className="mb-2.5 flex-row items-center justify-between gap-2.5">
          <Text className="text-sm font-bold text-white">Feedback Log</Text>
          <Text className="shrink text-right text-[11px] text-slate-400">
            {trackingConf > 0
              ? `${Math.round(trackingConf * 100)}% tracked`
              : "Waiting for stable tracking"}
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 6, gap: 8 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {feedbackLog.length > 0 ? (
            feedbackLog.map((item, index) => (
              <View
                key={`${item}-${index}`}
                className="flex-row items-start gap-2.5"
              >
                <Text className="text-[18px] leading-[22px] text-orange-500">
                  -
                </Text>
                <Text className="flex-1 text-[15px] font-semibold leading-[21px] text-slate-200">
                  {item}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-sm leading-5 text-slate-400">
              Start the camera to see posture corrections here.
            </Text>
          )}
        </ScrollView>

        <Text numberOfLines={1} className="mt-2.5 text-[11px] text-slate-500">
          {lastMsgType} | RTT {lastRttMs !== null ? `${lastRttMs}ms` : "-"} |
          FPS {responsesPerSecond !== null ? responsesPerSecond : "-"} | Lost{" "}
          {lostFrames}
        </Text>
      </View>
    </>
  );

  const renderCameraArea = () => {
    if (Platform.OS !== "web" && permission && !permission.granted) {
      return (
        <View className="mb-6 h-[540px] items-center justify-center rounded-2xl bg-black">
          <Text className="mb-2 px-4 text-center text-xs text-slate-400">
            Camera access needed for live coaching.
          </Text>
          <TouchableOpacity
            className="rounded-full bg-rose-500 px-4 py-2"
            onPress={requestPermission}
          >
            <Text className="text-xs font-medium text-white">
              Enable Camera
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (Platform.OS === "web") {
      return (
        <View className="relative">
          <WebCamera
            className="mb-6 h-[540px] rounded-2xl bg-black"
            videoRef={webVideoRef}
          />

          {/* @ts-ignore */}
          <canvas ref={webCanvasRef} style={{ display: "none" }} />
          {renderCameraOverlay()}
        </View>
      );
    }

    return (
      <View className="relative">
        <CameraView
          ref={cameraRef}
          style={{
            height: 540,
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 24,
          }}
          facing="front"
        />
        {renderCameraOverlay()}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-base font-semibold text-white">
            {workout.title}
          </Text>

          <TouchableOpacity
            className="h-8 w-8 items-center justify-center rounded-full bg-rose-500"
            style={!wsConnected ? { opacity: 0.5 } : undefined}
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

        {renderCameraArea()}

        <View className="mb-3 flex-row justify-between">
          <Text className="text-[11px] text-gray-400">
            Exercise {currentIndex + 1} of {totalExercises}
          </Text>
          <Text className="text-[11px] text-gray-400">
            {completion}% Complete
          </Text>
        </View>

        <View className="mb-[18px] rounded-[22px] bg-[#050B16] p-4">
          <View className="mb-3.5 flex-row items-start justify-between">
            <View>
              <Text className="text-base font-semibold text-white">
                {currentExercise.name}
              </Text>
              <Text className="mt-0.5 text-[11px] text-gray-400">
                {doneReps}/{totalReps ?? currentExercise.reps} reps
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-[10px] text-gray-400">Remaining</Text>
              <Text className="mt-0.5 text-[18px] font-semibold text-white">
                {remainingReps ?? "-"}
              </Text>
            </View>
          </View>

          <View className="mb-3.5 rounded-2xl bg-slate-900 px-2.5 py-2.5">
            <View className="mb-1 flex-row items-center">
              <Ionicons
                name="bulb-outline"
                size={14}
                color="#FBBF24"
                style={{ marginRight: 4 }}
              />
              <Text className="text-[10px] font-medium text-gray-400">
                Form Tip:
              </Text>
            </View>

            <Text className="text-[11px] leading-4 text-gray-200">
              {cues[0] ||
                currentExercise!.tips[0] ||
                "Maintain proper form throughout."}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            className="mb-2 items-center rounded-2xl bg-rose-500 py-3"
            onPress={() => {}}
          >
            <Text className="text-[13px] font-semibold text-white">
              🔥 Just 10 more! You got this!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            className="mb-2 items-center rounded-2xl bg-orange-500 py-3"
            onPress={() => {}}
          >
            <Text className="text-[13px] font-semibold text-white">
              ⏸️ Pause Workout
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-1 items-center">
          <Text className="mb-0.5 text-[10px] text-gray-500">
            Coming Up Next:
          </Text>
          {nextExercise ? (
            <Text className="text-xs text-white">
              {nextExercise.name} - 10 reps
            </Text>
          ) : (
            <Text className="text-xs text-white">Finish Strong 💪</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
function WebCamera({
  className,
  videoRef,
}: {
  className?: string;
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
      <View className={`items-center justify-center ${className ?? ""}`}>
        <Text className="mb-2 px-4 text-center text-xs text-slate-400">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View className={`overflow-hidden ${className ?? ""}`}>
      {/* @ts-ignore */}
      <video
        ref={(el) => {
          videoRef.current = el;
        }}
        playsInline
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </View>
  );
}
