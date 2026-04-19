import { Redirect, Stack } from "expo-router";
import React from "react";
import { View } from "react-native";
import BottomNav from "../components/BottomNav";
import { FullScreenLoader } from "@/src/components/FullScreenLoader";
import { useAuth } from "@/src/context/AuthContext";
import { palette } from "@/src/theme/palette";

export default function AppLayout() {
  const { initialized, session } = useAuth();

  if (!initialized) {
    return (
      <FullScreenLoader
        title="Restoring session"
        subtitle="Checking Supabase auth so we can open the right side of the app."
      />
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="tailwind-test" />
          <Stack.Screen
            name="workout/[id]"
            options={{
              presentation: "card",
              animation: "default",
            }}
          />
          <Stack.Screen
            name="workout/session/[id]"
            options={{
              presentation: "card",
              animation: "default",
            }}
          />
        </Stack>
      </View>
      <BottomNav />
    </View>
  );
}
