import { User } from "@supabase/supabase-js";
import { getSupabaseConfigError, supabase } from "@/src/lib/supabase";

export type TrainingLevel = "Beginner" | "Intermediate" | "Advanced";

export type ProfileRecord = {
  id: string;
  full_name: string;
  email: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_goal: string | null;
  training_level: TrainingLevel | null;
  weekly_target: number | null;
  updated_at: string | null;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error(getSupabaseConfigError() ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function getProfile(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as ProfileRecord | null) ?? null;
}

export async function upsertProfile(profile: ProfileRecord) {
  const client = requireSupabase();
  const payload = {
    ...profile,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data as ProfileRecord;
}

export async function ensureProfileExists(user: User) {
  const currentProfile = await getProfile(user.id);
  if (currentProfile) return currentProfile;

  const fallbackName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "";

  return upsertProfile({
    id: user.id,
    full_name: fallbackName,
    email: user.email ?? null,
    age: null,
    height_cm: null,
    weight_kg: null,
    fitness_goal: "",
    training_level: "Intermediate",
    weekly_target: 3,
    updated_at: null,
  });
}
