import { useAuth } from "@/src/context/AuthContext";
import {
  getSupabaseConfigError,
  isSupabaseConfigured,
} from "@/src/lib/supabase";
import {
  ensureProfileExists,
  getProfile,
  ProfileRecord,
  TrainingLevel,
  upsertProfile,
} from "@/src/services/profile-service";
import { gradients, palette } from "@/src/theme/palette";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const trainingLevels: TrainingLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

function createEmptyProfile(
  userId: string,
  email: string | null,
): ProfileRecord {
  return {
    id: userId,
    full_name: "",
    email,
    age: null,
    height_cm: null,
    weight_kg: null,
    fitness_goal: "",
    training_level: "Intermediate",
    weekly_target: 3,
    updated_at: null,
  };
}

function formatLastUpdated(value: string | null) {
  if (!value) return "Not synced yet";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toNumberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function getExampleHint(
  field:
    | "firstName"
    | "lastName"
    | "goal"
    | "age"
    | "height"
    | "weight"
    | "weeklyTarget",
) {
  switch (field) {
    case "firstName":
      return "Ex: Bryan";
    case "lastName":
      return "Ex: Haddad";
    case "goal":
      return "Ex: Build strength and improve conditioning";
    case "age":
      return "Ex: 24";
    case "height":
      return "Ex: 178";
    case "weight":
      return "Ex: 73";
    case "weeklyTarget":
      return "Ex: 4";
  }
}

export default function ProfileScreen() {
  const { signOut, user } = useAuth();
  const [profile, setProfile] = React.useState<ProfileRecord>(() =>
    createEmptyProfile(user?.id ?? "", user?.email ?? null),
  );
  const [loading, setLoading] = React.useState(Boolean(user));
  const [saving, setSaving] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [logoutPromptVisible, setLogoutPromptVisible] = React.useState(false);

  const nameParts = React.useMemo(
    () => splitFullName(profile.full_name),
    [profile.full_name],
  );

  const loadProfile = React.useCallback(async () => {
    if (!user) {
      setProfile(createEmptyProfile("", null));
      setMessage(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const data = await getProfile(user.id);

      if (data) {
        setProfile({
          ...createEmptyProfile(user.id, user.email ?? null),
          ...data,
        });
        setMessage("Profile loaded from Database.");
      } else {
        const createdProfile = await ensureProfileExists(user);
        setProfile(createdProfile);
        setMessage("Profile created for your new account.");
      }
    } catch (loadError) {
      const nextError =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load profile.";
      setError(nextError);
      setProfile(createEmptyProfile(user.id, user.email ?? null));
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = React.useCallback(async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const saved = await upsertProfile({
        ...profile,
        id: user.id,
        full_name: profile.full_name.trim(),
        email: user.email ?? profile.email?.trim() ?? null,
        fitness_goal: profile.fitness_goal?.trim() || null,
      });

      setProfile(saved);
      setMessage("Profile saved successfully.");
    } catch (saveError) {
      const nextError =
        saveError instanceof Error
          ? saveError.message
          : "Unable to save profile.";
      setError(nextError);
    } finally {
      setSaving(false);
    }
  }, [profile, user]);

  const handleSignOut = React.useCallback(async () => {
    setSigningOut(true);
    setError(null);

    try {
      await signOut();
    } catch (signOutError) {
      const nextError =
        signOutError instanceof Error
          ? signOutError.message
          : "Unable to sign out.";
      setError(nextError);
    } finally {
      setSigningOut(false);
      setLogoutPromptVisible(false);
    }
  }, [signOut]);

  const statCards = [
    {
      label: "Weekly target",
      value: `${profile.weekly_target ?? 0} sessions`,
      icon: "barbell-outline" as const,
    },
    {
      label: "Training level",
      value: profile.training_level ?? "Set your level",
      icon: "flash-outline" as const,
    },
    {
      label: "Last sync",
      value: formatLastUpdated(profile.updated_at),
      icon: "cloud-done-outline" as const,
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-[#020817]"
      contentContainerClassName="p-4 pb-9"
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={gradients.hero}
        style={{
          borderRadius: 28,
          padding: 20,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          marginBottom: 16,
        }}
      >
        <View className="mb-[14px] self-start rounded-full bg-[rgba(255,255,255,0.08)] px-3 py-1.5">
          <View className="flex-row items-center">
            <Ionicons name="sparkles-outline" size={14} color="#FFD9B8" />
            <Text className="ml-[6px] text-[12px] font-bold uppercase tracking-[0.6px] text-[#FFD9B8]">
              Profile hub
            </Text>
          </View>
        </View>

        <Text className="mb-[10px] text-[28px] font-extrabold leading-[34px] text-[#F8FAFC]">
          Build a profile that powers your plan
        </Text>

        <Text className="text-[14px] leading-[21px] text-[#CBD5E1]">
          Save your athlete details and reuse the same profile in the workout
          calendar.
        </Text>

        <View className="mt-[18px]">
          <View
            className="self-start rounded-full border px-3 py-2"
            style={{
              backgroundColor: isSupabaseConfigured
                ? "rgba(34, 197, 94, 0.12)"
                : "rgba(245, 158, 11, 0.12)",
              borderColor: isSupabaseConfigured
                ? "rgba(34, 197, 94, 0.25)"
                : "rgba(245, 158, 11, 0.24)",
            }}
          >
            <View className="flex-row items-center">
              <View
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: isSupabaseConfigured
                    ? palette.success
                    : palette.warning,
                }}
              />
              <Text className="ml-2 text-[13px] font-semibold text-[#F8FAFC]">
                {isSupabaseConfigured
                  ? "Supabase connected"
                  : "Supabase setup needed"}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {!isSupabaseConfigured ? (
        <View className="mb-4 rounded-[22px] border border-[rgba(245,158,11,0.24)] bg-[rgba(245,158,11,0.12)] p-4">
          <Text className="mb-[6px] text-[16px] font-bold text-[#FDE68A]">
            Finish setup
          </Text>
          <Text className="text-[13px] leading-5 text-[#CBD5E1]">
            {getSupabaseConfigError()}
          </Text>
          <Text className="text-[13px] leading-5 text-[#CBD5E1]">
            Use `.env.example` and run the SQL in `supabase/schema.sql`.
          </Text>
        </View>
      ) : null}

      <View className="mb-4 rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.84)] p-[18px]">
        <View className="mb-[14px] flex-row items-center justify-between">
          <Text className="text-[18px] font-bold text-[#F8FAFC]">
            Account identity
          </Text>
          <Text className="text-[12px] text-[#94A3B8]">
            Managed by Supabase Auth
          </Text>
        </View>

        <View className="mb-3 rounded-[18px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] p-[14px]">
          <Text className="mb-[6px] text-[12px] text-[#94A3B8]">Full name</Text>
          <Text
            className={`text-[14px] font-bold ${
              !profile.full_name.trim()
                ? "italic text-[#94A3B8]"
                : "text-[#F8FAFC]"
            }`}
          >
            {profile.full_name.trim() || "Not added yet"}
          </Text>
        </View>

        <View className="rounded-[18px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] p-[14px]">
          <Text className="mb-[6px] text-[12px] text-[#94A3B8]">Email</Text>
          <Text className="text-[14px] font-bold text-[#F8FAFC]">
            {user?.email ?? "No email"}
          </Text>
        </View>
      </View>

      <View className="mb-4 flex-row flex-wrap gap-3">
        {statCards.map((card) => (
          <View
            key={card.label}
            className="min-w-[30%] flex-grow rounded-[22px] border border-[rgba(148,163,184,0.18)] bg-[rgba(17,28,51,0.94)] p-4"
          >
            <Ionicons name={card.icon} size={18} color={palette.accent} />
            <Text className="mb-[6px] mt-3 text-[12px] text-[#94A3B8]">
              {card.label}
            </Text>
            <Text className="text-[15px] font-bold text-[#F8FAFC]">
              {card.value}
            </Text>
          </View>
        ))}
      </View>

      <View className="mb-4 rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.84)] p-[18px]">
        <View className="mb-[14px] flex-row items-center justify-between">
          <Text className="text-[18px] font-bold text-[#F8FAFC]">
            Athlete details
          </Text>
          {loading ? <ActivityIndicator color={palette.accent} /> : null}
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
              First name
            </Text>
            <TextInput
              value={nameParts.firstName}
              onChangeText={(value) =>
                setProfile((current) => ({
                  ...current,
                  full_name:
                    `${value.trim()} ${splitFullName(current.full_name).lastName}`.trim(),
                }))
              }
              placeholder={getExampleHint("firstName")}
              placeholderTextColor={palette.textMuted}
              className="mb-[14px] rounded-[16px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
            />
          </View>

          <View className="flex-1">
            <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
              Last name
            </Text>
            <TextInput
              value={nameParts.lastName}
              onChangeText={(value) =>
                setProfile((current) => ({
                  ...current,
                  full_name:
                    `${splitFullName(current.full_name).firstName} ${value.trim()}`.trim(),
                }))
              }
              placeholder={getExampleHint("lastName")}
              placeholderTextColor={palette.textMuted}
              className="mb-[14px] rounded-[16px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
            />
          </View>
        </View>

        <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
          Email
        </Text>
        <TextInput
          value={user?.email ?? profile.email ?? ""}
          editable={false}
          placeholder="name@example.com"
          placeholderTextColor={palette.textMuted}
          className="mb-[14px] rounded-[16px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
          style={{ opacity: 0.78 }}
        />

        <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
          Fitness goal
        </Text>
        <TextInput
          value={profile.fitness_goal ?? ""}
          onChangeText={(value) =>
            setProfile((current) => ({ ...current, fitness_goal: value }))
          }
          placeholder={getExampleHint("goal")}
          placeholderTextColor={palette.textMuted}
          multiline
          className="mb-[14px] min-h-[92px] rounded-[16px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
          style={{ textAlignVertical: "top" }}
        />

        <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
          Training level
        </Text>
        <View className="mb-[14px] flex-row gap-2">
          {trainingLevels.map((level) => {
            const active = profile.training_level === level;

            return (
              <TouchableOpacity
                key={level}
                className={`flex-1 items-center rounded-[16px] border py-3 ${
                  active
                    ? "border-[rgba(255,105,0,0.4)] bg-[rgba(255,105,0,0.16)]"
                    : "border-[rgba(148,163,184,0.18)] bg-[#0B1120]"
                }`}
                onPress={() =>
                  setProfile((current) => ({
                    ...current,
                    training_level: level,
                  }))
                }
              >
                <Text
                  className={`text-[13px] font-semibold ${
                    active ? "text-[#F8FAFC]" : "text-[#CBD5E1]"
                  }`}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
              Age
            </Text>
            <TextInput
              value={profile.age?.toString() ?? ""}
              onChangeText={(value) =>
                setProfile((current) => ({
                  ...current,
                  age: toNumberOrNull(value),
                }))
              }
              placeholder={getExampleHint("age")}
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              className="mb-[14px] rounded-[16px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
            />
          </View>

          <View className="flex-1">
            <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
              Height (cm)
            </Text>
            <TextInput
              value={profile.height_cm?.toString() ?? ""}
              onChangeText={(value) =>
                setProfile((current) => ({
                  ...current,
                  height_cm: toNumberOrNull(value),
                }))
              }
              placeholder={getExampleHint("height")}
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              className="mb-[14px] rounded-[16px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
              Weight (kg)
            </Text>
            <TextInput
              value={profile.weight_kg?.toString() ?? ""}
              onChangeText={(value) =>
                setProfile((current) => ({
                  ...current,
                  weight_kg: toNumberOrNull(value),
                }))
              }
              placeholder={getExampleHint("weight")}
              placeholderTextColor={palette.textMuted}
              keyboardType="decimal-pad"
              className="mb-[14px] rounded-[16px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
            />
          </View>

          <View className="flex-1">
            <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
              Weekly target
            </Text>
            <TextInput
              value={profile.weekly_target?.toString() ?? ""}
              onChangeText={(value) =>
                setProfile((current) => ({
                  ...current,
                  weekly_target: toNumberOrNull(value),
                }))
              }
              placeholder={getExampleHint("weeklyTarget")}
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              className="mb-[14px] rounded-[16px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
            />
          </View>
        </View>
      </View>

      {message ? (
        <Text className="mb-2 mx-1 text-[13px] text-[#86EFAC]">{message}</Text>
      ) : null}

      {error ? (
        <Text className="mb-2 mx-1 text-[13px] text-[#FDBA74]">{error}</Text>
      ) : null}

      <TouchableOpacity
        className="flex-row items-center justify-center rounded-2xl bg-[#FF6900] py-4"
        style={saving ? { opacity: 0.6 } : undefined}
        onPress={handleSave}
        disabled={saving || !isSupabaseConfigured}
      >
        {saving ? (
          <ActivityIndicator color={palette.textPrimary} />
        ) : (
          <>
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color={palette.textPrimary}
            />
            <Text className="ml-[10px] text-[15px] font-extrabold text-[#F8FAFC]">
              Save profile to Supabase
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-3 flex-row items-center justify-center rounded-2xl border border-[rgba(56,189,248,0.24)] bg-[rgba(56,189,248,0.12)] py-4"
        style={signingOut ? { opacity: 0.6 } : undefined}
        onPress={() => setLogoutPromptVisible(true)}
        disabled={signingOut}
      >
        {signingOut ? (
          <ActivityIndicator color={palette.textPrimary} />
        ) : (
          <>
            <Ionicons
              name="log-out-outline"
              size={18}
              color={palette.textPrimary}
            />
            <Text className="ml-[10px] text-[15px] font-extrabold text-white">
              Log out
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={logoutPromptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!signingOut) setLogoutPromptVisible(false);
        }}
      >
        <View className="flex-1 justify-center bg-[rgba(2,8,23,0.68)] p-5">
          <View className="rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[#111C33] p-[22px]">
            <View className="mb-4 h-[46px] w-[46px] items-center justify-center rounded-full bg-[rgba(56,189,248,0.14)]">
              <Ionicons name="log-out-outline" size={22} color="#93C5FD" />
            </View>

            <Text className="mb-2 text-[20px] font-extrabold text-[#F8FAFC]">
              Log out now?
            </Text>

            <Text className="text-[14px] leading-[21px] text-[#CBD5E1]">
              You’ll return to the login screen and need to sign back in to
              manage your profile and workout plans.
            </Text>

            <View className="mt-5 flex-row gap-[10px]">
              <TouchableOpacity
                className="flex-1 items-center rounded-[16px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] py-[14px]"
                onPress={() => setLogoutPromptVisible(false)}
                disabled={signingOut}
              >
                <Text className="text-[14px] font-bold text-[#F8FAFC]">
                  Stay signed in
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 items-center justify-center rounded-[16px] py-[14px]"
                style={{
                  backgroundColor: palette.sky,
                  opacity: signingOut ? 0.6 : 1,
                }}
                onPress={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? (
                  <ActivityIndicator color={palette.textPrimary} />
                ) : (
                  <Text className="text-[14px] font-extrabold text-[#F8FAFC]">
                    Log out
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
