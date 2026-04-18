import { Session, User } from "@supabase/supabase-js";
import React from "react";
import { AppState } from "react-native";
import { ensureProfileExists } from "@/src/services/profile-service";
import { getSupabaseConfigError, isSupabaseConfigured, supabase } from "@/src/lib/supabase";

type AuthContextValue = {
  initialized: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue>({
  initialized: false,
  session: null,
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

function requireSupabase() {
  if (!supabase) {
    throw new Error(getSupabaseConfigError() ?? "Supabase is not configured.");
  }

  return supabase;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = React.useState(!isSupabaseConfigured);
  const [session, setSession] = React.useState<Session | null>(null);

  React.useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        client.auth.startAutoRefresh();
      } else {
        client.auth.stopAutoRefresh();
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user) {
        void ensureProfileExists(nextSession.user);
      }

      setInitialized(true);
    });

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;

        setSession(data.session);
        if (data.session?.user) {
          void ensureProfileExists(data.session.user);
        }
      })
      .catch(() => {
        setSession(null);
      })
      .finally(() => {
        setInitialized(true);
      });

    return () => {
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
  }, []);

  const signUp = React.useCallback(async (email: string, password: string) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    if (data.session?.user) {
      await ensureProfileExists(data.session.user);
    }
  }, []);

  const signOut = React.useCallback(async () => {
    const client = requireSupabase();
    const { error } = await client.auth.signOut();

    if (error) throw error;
  }, []);

  const value = React.useMemo(
    () => ({
      initialized,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [initialized, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
