import { router } from "expo-router";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { AuthCard } from "@/src/components/AuthCard";
import { useAuth } from "@/src/context/AuthContext";
import {
  getSupabaseConfigError,
  isSupabaseConfigured,
} from "@/src/lib/supabase";
import { palette } from "@/src/theme/palette";
import { Ionicons } from "@expo/vector-icons";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [verificationPromptVisible, setVerificationPromptVisible] =
    React.useState(false);

  const handleSubmit = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError(getSupabaseConfigError());
      return;
    }

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signUp(email, password);
      setVerificationPromptVisible(true);
    } catch (signUpError) {
      const nextError =
        signUpError instanceof Error ? signUpError.message : "Unable to sign up.";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, [email, password, signUp]);

  return (
    <>
      <AuthCard
        alternateHref="/login"
        alternateLabel="Log in"
        alternateText="Already have an account?"
        buttonLabel="Create account"
        description="Create an account tied to your Supabase user ID so your profile and workout plans stay private and persistent."
        email={email}
        error={error}
        loading={loading}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        password={password}
        title="Create your training account"
      />

      <Modal
        visible={verificationPromptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVerificationPromptVisible(false)}
      >
        <View className="flex-1 justify-center bg-[rgba(2,8,23,0.68)] p-5">
          <View className="rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[#111C33] p-[22px]">
            <View className="mb-4 h-[52px] w-[52px] items-center justify-center rounded-full bg-[rgba(34,197,94,0.16)]">
              <Ionicons name="mail-open-outline" size={24} color="#86EFAC" />
            </View>

            <Text className="mb-2 text-[21px] font-extrabold text-[#F8FAFC]">
              Verify your email
            </Text>

            <Text className="text-[14px] leading-[21px] text-[#CBD5E1]">
              We sent a verification link to{" "}
              <Text className="font-bold text-[#F8FAFC]">
                {email.trim() || "your inbox"}
              </Text>
              . Please open it, verify your account, then log in.
            </Text>

            <TouchableOpacity
              className="mt-5 items-center justify-center rounded-[16px] bg-[#FF6900] py-[14px]"
              onPress={() => {
                setVerificationPromptVisible(false);
                router.replace("/login" as any);
              }}
            >
              <Text className="text-[14px] font-extrabold text-[#F8FAFC]">
                Back to login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}