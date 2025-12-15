// app/workout/session/[id].tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { workouts, Workout, Exercise } from "../../../constants/workouts";

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

  const [wsConnected, setWsConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const [repCount, setRepCount] = useState<number | null>(null);
  const [stage, setStage] = useState<string>("");

  const WS_URL = useMemo(() => "wss://fyp-t6nc.onrender.com/ws/infer", []);

  useEffect(() => {
  let ws: WebSocket | null = null;
  let stopped = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (stopped) return;

    console.log("🔌 Trying WS connection...");
    ws = new WebSocket("wss://fyp-t6nc.onrender.com/ws/infer");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WS CONNECTED");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log("📩 WS MESSAGE:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (typeof data.rep_count === "number") setRepCount(data.rep_count);
        if (typeof data.stage === "string") setStage(data.stage);
      } catch {}
    };

    ws.onerror = (e) => {
      console.log("⚠️ WS ERROR", e);
    };

    ws.onclose = (e) => {
      console.log("❌ WS CLOSED", e.code);
      setWsConnected(false);
      wsRef.current = null;

      if (!stopped) {
        retryTimer = setTimeout(connect, 1500);
      }
    };
  };

  connect();

  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (ws) ws.close();
  };
}, []);


  const startStreaming = () => {
    if (streaming) return;
    if (!wsRef.current || wsRef.current.readyState !== 1) return;

    // Mobile only: we send frames using expo-camera
    if (Platform.OS !== "web" && !cameraRef.current) return;

    setStreaming(true);

    intervalRef.current = setInterval(async () => {
      if (busyRef.current) return;
      busyRef.current = true;

      try {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== 1) return;

        // WEB: show live camera only (no frame streaming yet)
        if (Platform.OS === "web") return;

        const cam = cameraRef.current;
        if (!cam) return;

        const photo = await cam.takePictureAsync({
          base64: true,
          quality: 0.35,
          skipProcessing: true,
        });

        const resized = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 320 } }],
          {
            compress: 0.5,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        if (!resized.base64) return;

        ws.send(
          JSON.stringify({
            frame_id: ++frameIdRef.current,
            ts: Date.now(),
            image_b64: resized.base64,
          })
        );
      } catch {
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
  // Workout lookup
  // -------------------------
  const workout: Workout | undefined = workouts.find(
    (w: Workout) => w.id === workoutId
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

  // To replace afterwards when backend done
  const currentIndex = 0;
  const currentExercise: Exercise = workout.exercises[currentIndex];
  const totalExercises = workout.exercises.length;

  // keep your original dummy fallback if backend not sending yet
  const doneReps = repCount ?? 9;
  const totalReps = 15; // dummy
  const remainingReps = Math.max(totalReps - doneReps, 0);
  const completion = 20; // dummy % complete

  const nextExercise: Exercise | undefined =
    workout.exercises[currentIndex + 1];

  // Handle camera permission states (native)
  if (Platform.OS !== "web") {
    if (!permission) {
      return <View style={styles.screen} />;
    }
  }

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

    // WEB: use browser camera preview
    if (Platform.OS === "web") {
      return (
        <View style={{ position: "relative" }}>
          <WebCamera style={styles.cameraArea} />
          <View style={styles.cameraHud}>
            <Text style={styles.cameraHudText}>
              WS: {wsConnected ? "connected" : "disconnected"}
            </Text>
            <Text style={styles.cameraHudText}>Stage: {stage || "-"}</Text>
          </View>
        </View>
      );
    }

    // Native: show live camera preview
    return (
      <View style={{ position: "relative" }}>
        <CameraView ref={cameraRef} style={styles.cameraArea} facing="front" />
        <View style={styles.cameraHud}>
          <Text style={styles.cameraHudText}>
            WS: {wsConnected ? "connected" : "disconnected"}
          </Text>
          <Text style={styles.cameraHudText}>Stage: {stage || "-"}</Text>
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

          {/* Keep your red camera button, but make it start/stop streaming */}
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
                {doneReps}/{totalReps} reps
              </Text>
            </View>
            <View style={styles.remainingBlock}>
              <Text style={styles.remainingLabel}>Remaining</Text>
              <Text style={styles.remainingValue}>{remainingReps}</Text>
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
              {currentExercise.tips[0] || "Maintain proper form throughout."}
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
function WebCamera({ style }: { style: any }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
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
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
        ref={videoRef}
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
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    pointerEvents: "none",
  },
  cameraHudText: {
    color: "#FFFFFF",
    fontSize: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
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

  progressText: {
    color: "#9CA3AF",
    fontSize: 11,
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
