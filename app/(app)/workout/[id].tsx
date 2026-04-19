import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ImageBackground,
  ScrollView,
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
      <View className="flex-1 bg-[#020817]">
        <View className="px-4 pt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text className="mt-10 text-center text-sm text-white">
            Workout not found.
          </Text>
        </View>
      </View>
    );
  }

  const exercise: Exercise = workout.exercises[0];
  const totalExercises = workout.exercises.length;

  return (
    <View className="flex-1 bg-[#020817]">
      <ScrollView
        contentContainerClassName="px-4 pb-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-[#9CA3AF]">
              Exercise 1 of {totalExercises}
            </Text>
            <Text className="mt-1 text-[22px] font-semibold text-white">
              {exercise.name}
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <ImageBackground
            source={exercise.image}
            style={{
              width: "100%",
              height: 220,
              borderRadius: 24,
              overflow: "hidden",
            }}
            imageStyle={{ borderRadius: 24 }}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"] as const}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: "#FF6900",
              }}
            >
              <Text className="text-sm font-semibold text-white">
                {exercise.reps}
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View className="mb-[18px]">
          <Text className="mb-2 text-[17px] font-semibold text-white">
            How to perform
          </Text>
          <Text className="text-[15px] leading-6 text-[#D1D5DB]">
            {exercise.howTo}
          </Text>
        </View>

        <View className="mb-[18px]">
          <Text className="mb-2 text-[17px] font-semibold text-white">
            Form Tips
          </Text>
          {exercise.tips.map((tip: string, index: number) => (
            <View key={index} className="mb-3 flex-row items-start">
              <View className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-[#FF6900]">
                <Text className="text-xs font-semibold text-white">
                  {index + 1}
                </Text>
              </View>
              <Text className="flex-1 text-[15px] leading-6 text-[#D1D5DB]">
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 18,
          paddingTop: 8,
          borderTopWidth: 0.5,
          borderTopColor: "rgba(148,163,253,0.12)",
          backgroundColor: "#020817",
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          className="mb-[10px] flex-row items-center justify-center rounded-xl bg-[#FF6900] py-[14px]"
          onPress={() =>
            router.push({
              pathname: "/workout/session/[id]",
              params: { id: String(workout.id) },
            })
          }
        >
          <Ionicons
            name="play"
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text className="text-[15px] font-semibold text-white">
            Got it! Start Exercise
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-center text-sm text-[#9CA3AF]">Skip Demo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

