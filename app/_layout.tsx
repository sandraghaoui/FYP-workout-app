import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "./components/BottomNav";
import { FullScreenLoader } from "@/src/components/FullScreenLoader";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { palette } from "@/src/theme/palette";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutContent() {
  const pathname = usePathname();
  const { initialized, session } = useAuth();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  React.useEffect(() => {
    if (!initialized) return;

    if (!session && !isAuthRoute) {
      router.replace("/login" as any);
      return;
    }

    if (session && isAuthRoute) {
      router.replace("/" as any);
    }
  }, [initialized, isAuthRoute, pathname, session]);

  if (!initialized) {
    return (
      <>
        <StatusBar style="light" />
        <FullScreenLoader
          title="Restoring session"
          subtitle="Checking Supabase auth so we can open the right side of the app."
        />
      </>
    );
  }

  if ((!session && !isAuthRoute) || (session && isAuthRoute)) {
    return (
      <>
        <StatusBar style="light" />
        <FullScreenLoader
          title="Opening your workspace"
          subtitle="Routing you to the correct screen based on your auth state."
        />
      </>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style="light" />

      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ gestureEnabled: false }} />
          <Stack.Screen name="signup" options={{ gestureEnabled: false }} />
        </Stack>
      </View>

      <BottomNav />
    </SafeAreaView>
  );
}
