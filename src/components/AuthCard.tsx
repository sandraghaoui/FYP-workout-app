import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { gradients, palette } from "@/src/theme/palette";

type AuthCardProps = {
  alternateHref: "/login" | "/signup";
  alternateLabel: string;
  alternateText: string;
  buttonLabel: string;
  description: string;
  email: string;
  error: string | null;
  info?: string | null;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  password: string;
  title: string;
};

export function AuthCard({
  alternateHref,
  alternateLabel,
  alternateText,
  buttonLabel,
  description,
  email,
  error,
  info,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  password,
  title,
}: AuthCardProps) {
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#020817]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="grow justify-center p-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.hero}
          style={{
            borderRadius: 28,
            padding: 22,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            marginBottom: 16,
          }}
        >
          <Text className="mb-[10px] text-xs font-extrabold uppercase tracking-[0.8px] text-[#FDBA74]">
            Supabase auth
          </Text>
          <Text className="mb-[10px] text-[28px] font-extrabold leading-[34px] text-[#F8FAFC]">
            {title}
          </Text>
          <Text className="text-sm leading-[21px] text-[#CBD5E1]">
            {description}
          </Text>
        </LinearGradient>

        <View className="rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.84)] p-[18px]">
          <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={onEmailChange}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="name@example.com"
            placeholderTextColor={palette.textMuted}
            className="mb-[14px] rounded-2xl border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
          />

          <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={onPasswordChange}
            secureTextEntry
            placeholder="Minimum 6 characters"
            placeholderTextColor={palette.textMuted}
            className="mb-[14px] rounded-2xl border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
          />

          {info ? (
            <Text className="mb-3 text-[13px] leading-[19px] text-[#93C5FD]">
              {info}
            </Text>
          ) : null}
          {error ? (
            <Text className="mb-3 text-[13px] text-[#FDBA74]">{error}</Text>
          ) : null}

          <TouchableOpacity
            className="mt-1 items-center justify-center rounded-[18px] bg-[#FF6900] py-4"
            style={loading ? { opacity: 0.65 } : undefined}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={palette.textPrimary} />
            ) : (
              <Text className="text-[15px] font-extrabold text-[#F8FAFC]">
                {buttonLabel}
              </Text>
            )}
          </TouchableOpacity>

          <View className="mt-[18px] flex-row items-center justify-center">
            <Text className="text-[13px] text-[#94A3B8]">{alternateText}</Text>
            <TouchableOpacity onPress={() => router.replace(alternateHref as any)}>
              <Text className="ml-[6px] text-[13px] font-bold text-[#FDBA74]">
                {alternateLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
