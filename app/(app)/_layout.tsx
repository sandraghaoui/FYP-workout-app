import { Redirect, Slot } from "expo-router";
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
        <Slot />
      </View>
      <BottomNav />
    </View>
  );
}
