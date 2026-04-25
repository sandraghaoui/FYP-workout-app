import { FullScreenLoader } from "@/src/components/FullScreenLoader";
import { useAuth } from "@/src/context/AuthContext";
import { palette } from "@/src/theme/palette";
import { Redirect, Stack } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import BottomNav from "../components/BottomNav";

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
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        alignItems: Platform.OS === "web" ? "center" : "stretch",
      }}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: Platform.OS === "web" ? 430 : undefined,
          backgroundColor: palette.background,
          overflow: "hidden",
          borderLeftWidth: Platform.OS === "web" ? 1 : 0,
          borderRightWidth: Platform.OS === "web" ? 1 : 0,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
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
    </View>
  );
}