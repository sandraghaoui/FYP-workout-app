import { Redirect, Slot } from "expo-router";
import React from "react";
import { FullScreenLoader } from "@/src/components/FullScreenLoader";
import { useAuth } from "@/src/context/AuthContext";

export default function AuthLayout() {
  const { initialized, session } = useAuth();

  if (!initialized) {
    return (
      <FullScreenLoader
        title="Restoring session"
        subtitle="Checking Supabase auth so we can open the right side of the app."
      />
    );
  }

  if (session) {
    return <Redirect href="/" />;
  }

  return <Slot />;
}
