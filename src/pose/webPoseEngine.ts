// src/pose/webPoseEngine.ts
import * as posedetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";

let detector: posedetection.PoseDetector | null = null;
let backendReady = false;

export type WebPoseKeypoint = {
  name?: string;
  x: number;
  y: number;
  score?: number;
};

export type WebPoseFrame = {
  keypoints: WebPoseKeypoint[];
  score?: number;
};

export async function initWebPoseEngine() {
  if (!backendReady) {
    await tf.setBackend("webgl");
    await tf.ready();
    backendReady = true;
  }

  if (!detector) {
    detector = await posedetection.createDetector(
      posedetection.SupportedModels.MoveNet,
      {
        modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      }
    );
  }
}

export async function estimateWebPose(videoEl: HTMLVideoElement): Promise<WebPoseFrame | null> {
  if (!detector) throw new Error("Web pose engine not initialized. Call initWebPoseEngine() first.");

  if (videoEl.readyState < 2) return null; // not enough data

  const poses = await detector.estimatePoses(videoEl, {
    maxPoses: 1,
    flipHorizontal: true, // selfie-like
  });

  const pose = poses?.[0];
  if (!pose?.keypoints?.length) return null;

  return {
    keypoints: pose.keypoints.map((k) => ({
      name: k.name,
      x: k.x,
      y: k.y,
      score: k.score,
    })),
    score: pose.score,
  };
}

export function disposeWebPoseEngine() {
  detector?.dispose();
  detector = null;
  backendReady = false;
}
