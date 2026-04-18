import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { gradients, palette } from "@/src/theme/palette";

export function FullScreenLoader({
  subtitle,
  title,
}: {
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.screen}>
      <LinearGradient colors={gradients.hero} style={styles.card}>
        <ActivityIndicator color={palette.accent} size="large" />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  title: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 8,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});
