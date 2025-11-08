// app/workout/session/[id].tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import {
  workouts,
  Workout,
  Exercise,
} from "../../../constants/workouts";

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);

  const [permission, requestPermission] = useCameraPermissions();

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

  const doneReps = 9;       // dummy
  const totalReps = 15;     // dummy
  const remainingReps = 6;  // dummy
  const completion = 20;    // dummy % complete

  const nextExercise: Exercise | undefined =
    workout.exercises[currentIndex + 1];

  // Handle camera permission states
  if (!permission) {
    // still loading permission state
    return <View style={styles.screen} />;
  }

  const renderCameraArea = () => {
    if (!permission.granted) {
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

    // Permission granted → show live camera preview
    return (
      <CameraView
        style={styles.cameraArea}
        facing="front" 
      />
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

          <View style={styles.cameraButton}>
            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
          </View>
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

          {/* Motivational button */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.actionButton, styles.keepGoingButton]}
            onPress={() => {
              // later: update reps / go next
            }}
          >
            <Text style={styles.actionButtonText}>
              🔥 Just 10 more! You got this!
            </Text>
          </TouchableOpacity>

          {/* Pause button */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.actionButton, styles.pauseButton]}
            onPress={() => {
              // later: pause logic
            }}
          >
            <Text style={styles.actionButtonText}>⏸️ Pause Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Coming Up Next */}
        <View style={styles.nextSection}>
          <Text style={styles.nextLabel}>Coming Up Next:</Text>
          {nextExercise ? (
            <Text style={styles.nextText}>
              {nextExercise.name} - 10 reps
            </Text>
          ) : (
            <Text style={styles.nextText}>Finish Strong 💪</Text>
          )}
        </View>
      </ScrollView>
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
    height: 260,           
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
    marginBottom: 24,      
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
