// src/pose/WebPoseView.tsx
import React, { useEffect, useRef, useState } from "react";
import { initWebPoseEngine, estimateWebPose, disposeWebPoseEngine, WebPoseFrame } from "./webPoseEngine";

type Props = {
  onPose?: (frame: WebPoseFrame) => void;
  fps?: number; // inference FPS cap
};

export default function WebPoseView({ onPose, fps = 20 }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<string>("Initializing...");
  const [lastScore, setLastScore] = useState<number>(0);

  useEffect(() => {
    let alive = true;

    const start = async () => {
      try {
        setStatus("Loading TFJS + MoveNet...");
        await initWebPoseEngine();

        setStatus("Requesting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;

        if (!alive) return;

        const video = videoRef.current;
        if (!video) throw new Error("Video element missing.");

        video.srcObject = stream;
        await video.play();

        setStatus("Tracking...");

        const minDt = 1000 / Math.max(1, fps);
        let lastT = performance.now();

        const loop = async () => {
          if (!alive) return;

          const now = performance.now();
          const dt = now - lastT;

          if (dt >= minDt && videoRef.current) {
            lastT = now;
            const frame = await estimateWebPose(videoRef.current);
            if (frame) {
              const score = frame.score ?? 0;
              setLastScore(score);
              onPose?.(frame);
            }
          }

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (e: any) {
        setStatus(`Error: ${e?.message ?? String(e)}`);
      }
    };

    start();

    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
      }
      streamRef.current = null;

      disposeWebPoseEngine();
    };
  }, [fps, onPose]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontFamily: "system-ui", fontSize: 14 }}>
        <div><b>Status:</b> {status}</div>
        <div><b>Pose score:</b> {lastScore.toFixed(3)}</div>
      </div>

      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          width: "100%",
          maxWidth: 720,
          borderRadius: 12,
          background: "#111",
        }}
      />
    </div>
  );
}
