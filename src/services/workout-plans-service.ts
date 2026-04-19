import { getSupabaseConfigError, supabase } from "@/src/lib/supabase";

export type WorkoutStatus = "planned" | "done";

export type WorkoutPlanRecord = {
  id: string;
  user_id: string;
  workout_date: string;
  title: string;
  category: string | null;
  notes: string | null;
  status: WorkoutStatus;
  created_at: string | null;
};

export type WorkoutPlanSummary = Pick<
  WorkoutPlanRecord,
  "id" | "workout_date" | "status"
>;

function requireSupabase() {
  if (!supabase) {
    throw new Error(getSupabaseConfigError() ?? "Supabase is not configured.");
  }

  return supabase;
}

export async function listWorkoutPlans(userId: string, workoutDate: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("workout_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_date", workoutDate)
    .order("created_at", { ascending: true })
    .returns<WorkoutPlanRecord[]>();

  if (error) throw error;
  return data ?? [];
}

export async function listWorkoutPlanSummary(
  userId: string,
  dateFrom: string,
  dateTo: string,
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("workout_plans")
    .select("id, workout_date, status")
    .eq("user_id", userId)
    .gte("workout_date", dateFrom)
    .lte("workout_date", dateTo)
    .returns<WorkoutPlanSummary[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createWorkoutPlan(
  workout: Omit<WorkoutPlanRecord, "id" | "created_at">,
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("workout_plans")
    .insert(workout)
    .select()
    .single();

  if (error) throw error;
  return data as WorkoutPlanRecord;
}

export async function updateWorkoutPlan(
  id: string,
  updates: Partial<Pick<WorkoutPlanRecord, "title" | "category" | "notes" | "status">>,
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("workout_plans")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as WorkoutPlanRecord;
}

export async function deleteWorkoutPlan(id: string) {
  const client = requireSupabase();
  const { error } = await client.from("workout_plans").delete().eq("id", id);

  if (error) throw error;
}
