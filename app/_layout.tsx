import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "./components/BottomNav";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#020817" }}>
        <StatusBar style="light" />

        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>

        <BottomNav />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
