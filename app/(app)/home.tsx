import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Workout, workouts } from "../../constants/workouts";

const CARD_HEIGHT = 200;

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-[#020817]">
      <ScrollView
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View className="mb-6">
          <ImageBackground
            source={require("../../assets/images/image3.png")}
            className="h-[260px] w-full"
            imageStyle={{ borderRadius: 0 }}
          >
            <LinearGradient
              colors={
                [
                  "rgba(3,7,18,0.5)",
                  "rgba(3,7,18,0.8)",
                  "rgba(3,7,18,1)",
                ] as const
              }
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
            <View className="flex-1 justify-end px-[18px] pb-6 pt-[18px]">
              <View className="mb-[10px] self-start rounded-full bg-[rgba(15,23,42,0.85)] px-[14px] py-[6px]">
                <View className="flex-row items-center">
                  <Ionicons
                    name="flash-outline"
                    size={16}
                    color="#FFD580"
                    style={{ marginRight: 6 }}
                  />
                  <Text className="text-xs font-medium text-white">
                    AI-Powered Coaching
                  </Text>
                </View>
              </View>
              <Text className="mb-1 text-[22px] font-bold text-white">
                Choose Your Workout
              </Text>
              <Text className="text-[13px] leading-[18px] text-[#E5E7EB]">
                Personalized guidance with live camera feedback
              </Text>
            </View>
          </ImageBackground>

          <View className="mt-[14px] flex-row justify-between px-4">
            <StatCard borderColor="#FF6900" value={String(workouts.length)} label="Workouts" />
            <StatCard borderColor="#2B7FFF" value="10-30" label="Minutes" />
            <StatCard borderColor="#00C950" value="Live" label="Coaching" />
          </View>

          <View className="mt-4 px-4">
            <TouchableOpacity
              activeOpacity={0.9}
              className="items-center rounded-[18px] bg-[#FF6900] px-5 py-4"
              onPress={() =>
                router.push({
                  pathname: "/workout/session/[id]",
                  params: { id: "99" },
                })
              }
            >
              <Text className="text-[15px] font-bold text-white">
                Start Upper Body Test
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {workouts.map((w: Workout) => (
          <View key={w.id} className="mb-4 px-4">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/workout/[id]",
                  params: { id: String(w.id) },
                })
              }
            >
              <ImageBackground
                source={w.image}
                style={{
                  height: CARD_HEIGHT,
                  borderRadius: 24,
                  overflow: "hidden",
                }}
                imageStyle={{ borderRadius: 24 }}
              >
                <LinearGradient
                  colors={
                    [
                      "rgba(3,7,18,1)",
                      "rgba(3,7,18,0.6)",
                      "rgba(0,0,0,0)",
                    ] as const
                  }
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
                <LinearGradient
                  colors={w.colorGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    opacity: 0.3,
                  }}
                />

                <View className="flex-1 justify-start px-5 pb-[14px] pt-4">
                  <View className="mb-2 flex-row items-center justify-between">
                    <LinearGradient
                      colors={w.colorGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text className="text-[18px] font-bold text-white">
                        {w.id}
                      </Text>
                    </LinearGradient>

                    <View className="h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)]">
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 22,
                          marginTop: -1,
                        }}
                      >
                        ›
                      </Text>
                    </View>
                  </View>

                  <Text className="mb-1 text-[18px] font-semibold text-white">
                    {w.title}
                  </Text>
                  <Text className="mb-2 text-xs leading-4 text-[#E5E7EB]">
                    {w.description}
                  </Text>

                  <View className="mb-[10px] flex-row">
                    <View className="mr-2 flex-row items-center rounded-full bg-[rgba(255,255,255,0.10)] px-[14px] py-[6px]">
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text className="text-xs text-white">{w.duration}</Text>
                    </View>

                    <View className="flex-row items-center rounded-full bg-[rgba(255,255,255,0.10)] px-[14px] py-[6px]">
                      <MaterialCommunityIcons
                        name="target"
                        size={16}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text className="text-xs text-white">
                        {w.exercisesCountLabel}
                      </Text>
                    </View>
                  </View>

                  <LinearGradient
                    colors={w.colorGradient}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{
                      alignSelf: "flex-start",
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 999,
                    }}
                  >
                    <Text className="text-[11px] font-medium text-white">
                      {w.tag}
                    </Text>
                  </LinearGradient>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function StatCard({
  borderColor,
  label,
  value,
}: {
  borderColor: string;
  label: string;
  value: string;
}) {
  return (
    <View
      className="mx-1 flex-1 rounded-[18px] border bg-[rgba(255,255,255,0.12)] py-[14px]"
      style={{ borderColor }}
    >
      <Text className="mb-[2px] text-center text-[18px] font-semibold text-white">
        {value}
      </Text>
      <Text className="text-center text-[11px] text-[#E5E7EB]">{label}</Text>
    </View>
  );
}
