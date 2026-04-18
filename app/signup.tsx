import React from "react";
import { AuthCard } from "@/src/components/AuthCard";
import { useAuth } from "@/src/context/AuthContext";
import { getSupabaseConfigError, isSupabaseConfigured } from "@/src/lib/supabase";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      setError(
        "Account created. If email confirmation is enabled in Supabase, confirm your email before logging in.",
      );
    } catch (signUpError) {
      const nextError =
        signUpError instanceof Error ? signUpError.message : "Unable to sign up.";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, [email, password, signUp]);

  return (
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
  );
}
