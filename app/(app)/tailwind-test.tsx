import { Link } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const chips = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-fuchsia-500",
] as const;

export default function TailwindTestScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerClassName="px-5 pb-12 pt-6">
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-semibold uppercase tracking-[2px] text-cyan-300">
            NativeWind Check
          </Text>
          <Text className="mt-2 text-3xl font-black text-white">
            Tailwind Test Page
          </Text>
          <Text className="mt-2 max-w-[300px] text-sm leading-6 text-slate-300">
            If this screen shows spacing, colors, rounded cards, and pill badges, NativeWind is working.
          </Text>
        </View>

        <Link href="./home" asChild>
          <Pressable className="rounded-full border border-white/15 bg-white/10 px-4 py-2 active:bg-white/20">
            <Text className="text-sm font-semibold text-white">Back</Text>
          </Pressable>
        </Link>
      </View>

      <View className="mb-6 rounded-[28px] border border-cyan-400/30 bg-cyan-400/10 p-5">
        <Text className="text-lg font-bold text-white">Visual checklist</Text>
        <Text className="mt-3 text-sm leading-6 text-slate-200">
          You should see a dark background, bright cyan border, large rounded corners, and consistent padding from Tailwind classes.
        </Text>
      </View>

      <View className="mb-6 flex-row flex-wrap gap-3">
        {chips.map((chipClass, index) => (
          <View
            key={chipClass}
            className={`rounded-full px-4 py-2 ${chipClass}`}
          >
            <Text className="text-sm font-bold text-white">
              Chip {index + 1}
            </Text>
          </View>
        ))}
      </View>

      <View className="gap-4">
        <View className="rounded-[24px] bg-white p-5 shadow-sm">
          <Text className="text-base font-extrabold text-slate-900">
            Light card
          </Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600">
            This card confirms background, text color, spacing, and border radius utilities.
          </Text>
        </View>

        <View className="rounded-[24px] border border-emerald-400/30 bg-emerald-400/10 p-5">
          <Text className="text-base font-extrabold text-emerald-200">
            Accent card
          </Text>
          <Text className="mt-2 text-sm leading-6 text-emerald-50">
            This one checks transparent colors, border opacity, and typography classes.
          </Text>
        </View>
      </View>

      <Link href="./home" asChild>
        <Pressable className="mt-8 items-center rounded-2xl bg-cyan-400 px-5 py-4 active:bg-cyan-300">
          <Text className="text-base font-extrabold text-slate-950">
            Tailwind is working if this button looks styled
          </Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}
