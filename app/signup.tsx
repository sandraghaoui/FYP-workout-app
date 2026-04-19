import { router } from "expo-router";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthCard } from "@/src/components/AuthCard";
import { useAuth } from "@/src/context/AuthContext";
import { getSupabaseConfigError, isSupabaseConfigured } from "@/src/lib/supabase";
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="mail-open-outline" size={24} color="#86EFAC" />
            </View>
            <Text style={styles.modalTitle}>Verify your email</Text>
            <Text style={styles.modalText}>
              We sent a verification link to{" "}
              <Text style={styles.modalEmail}>{email.trim() || "your inbox"}</Text>.
              Please open it, verify your account, then log in.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setVerificationPromptVisible(false);
                router.replace("/login" as any);
              }}
            >
              <Text style={styles.modalButtonText}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 8, 23, 0.68)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 22,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(34, 197, 94, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 8,
  },
  modalText: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  modalEmail: {
    color: "#F8FAFC",
    fontWeight: "700",
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: palette.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
});
