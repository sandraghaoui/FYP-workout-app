import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { gradients, palette } from "@/src/theme/palette";

export function FullScreenLoader({
  subtitle,
  title,
}: {
  subtitle: string;
  title: string;
}) {
  return (
    <View className="flex-1 justify-center bg-[#020817] p-5">
      <LinearGradient
        colors={gradients.hero}
        style={{
          borderRadius: 28,
          padding: 28,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={palette.accent} size="large" />

        <Text className="mb-2 mt-[18px] text-[24px] font-extrabold text-[#F8FAFC]">
          {title}
        </Text>

        <Text className="text-center text-[14px] leading-[21px] text-[#CBD5E1]">
          {subtitle}
        </Text>
      </LinearGradient>
    </View>
  );
}