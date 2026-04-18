import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Only use React Native AsyncStorage on native runtimes. Avoid importing
// @react-native-async-storage/async-storage at module top-level because it
// may reference `window` and throw during web bundling or Node environments.
let nativeStorage: any | undefined;
try {
  if (
    typeof navigator !== "undefined" &&
    (navigator as any).product === "ReactNative"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    nativeStorage =
      require("@react-native-async-storage/async-storage").default;
  }
} catch (e) {
  nativeStorage = undefined;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Only set storage when running in a native environment that provides
        // AsyncStorage. In web browsers, Supabase will default to `localStorage`.
        ...(nativeStorage ? { storage: nativeStorage } : {}),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function getSupabaseConfigError() {
  if (isSupabaseConfigured) return null;

  return "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your Expo environment.";
}
