import React from "react";
import { Alert } from "react-native";
import { AuthCard } from "@/src/components/AuthCard";
import { useAuth } from "@/src/context/AuthContext";
import { getSupabaseConfigError, isSupabaseConfigured } from "@/src/lib/supabase";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError(getSupabaseConfigError());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
    } catch (signInError) {
      const nextError =
        signInError instanceof Error ? signInError.message : "Unable to sign in.";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, [email, password, signIn]);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      Alert.alert("Supabase setup needed", getSupabaseConfigError() ?? "");
    }
  }, []);

  return (
    <AuthCard
      alternateHref="/signup"
      alternateLabel="Create one"
      alternateText="Need an account?"
      buttonLabel="Log in"
      description="Sign in with your Supabase email/password account and resume your saved profile and workout calendar."
      email={email}
      error={error}
      loading={loading}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      password={password}
      title="Welcome back"
    />
  );
}
