// app/workout/[id].tsx

import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Exercise, Workout, workouts } from "../../../constants/workouts";

export default function WorkoutExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const workout: Workout | undefined = workouts.find(
    (w: Workout) => w.id === workoutId,
  );

  if (!workout || workout.exercises.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>Workout not found.</Text>
      </View>
    );
  }

  const exercise: Exercise = workout.exercises[0];
  const totalExercises = workout.exercises.length;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerMeta}>
              Exercise 1 of {totalExercises}
            </Text>
            <Text style={styles.headerTitle}>{exercise.name}</Text>
          </View>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Image card */}
        <View style={styles.imageCardWrapper}>
          <ImageBackground
            source={exercise.image}
            style={styles.imageCard}
            imageStyle={styles.imageCardRadius}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"] as const}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.imageOverlay}
            />
            <View style={styles.repsPill}>
              <Text style={styles.repsText}>{exercise.reps}</Text>
            </View>
          </ImageBackground>
        </View>

        {/* How to perform */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to perform</Text>
          <Text style={styles.sectionBody}>{exercise.howTo}</Text>
        </View>

        {/* Form Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Form Tips</Text>
          {exercise.tips.map((tip: string, index: number) => (
            <View key={index} style={styles.tipRow}>
              <View style={styles.tipNumberPill}>
                <Text style={styles.tipNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: "/workout/session/[id]",
              params: { id: String(workout.id) },
            })
          }
        >
          <Text style={styles.playIcon}>▶</Text>
          <Text style={styles.primaryButtonText}>Got it! Start Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.skipText}>Skip Demo</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerMeta: {
    color: "#9CA3AF",
    fontSize: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 2,
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 20,
  },
  imageCardWrapper: {
    marginBottom: 24,
  },
  imageCard: {
    width: "100%",
    height: 220,
    borderRadius: 24,
    overflow: "hidden",
  },
  imageCardRadius: {
    borderRadius: 24,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  repsPill: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FF6900",
  },
  repsText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  sectionBody: {
    color: "#D1D5DB",
    fontSize: 12,
    lineHeight: 18,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  tipNumberPill: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#FF6900",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 1,
  },
  tipNumberText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  tipText: {
    flex: 1,
    color: "#D1D5DB",
    fontSize: 12,
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(148,163,253,0.12)",
    backgroundColor: "#020817",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6900",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
  },
  playIcon: {
    color: "#FFFFFF",
    fontSize: 14,
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  skipText: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
