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
  StyleSheet,
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

function getExampleHint(field: "firstName" | "lastName" | "goal" | "age" | "height" | "weight" | "weeklyTarget") {
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
    if (!user) {
      return;
    }

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
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={gradients.hero} style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles-outline" size={14} color="#FFD9B8" />
          <Text style={styles.heroBadgeText}>Profile hub</Text>
        </View>

        <Text style={styles.heroTitle}>
          Build a profile that powers your plan
        </Text>
        <Text style={styles.heroSubtitle}>
          Save your athlete details and reuse the same profile in the
          workout calendar.
        </Text>

        <View style={styles.connectionRow}>
          <View
            style={[
              styles.connectionPill,
              isSupabaseConfigured
                ? styles.connectionLive
                : styles.connectionOffline,
            ]}
          >
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor: isSupabaseConfigured
                    ? palette.success
                    : palette.warning,
                },
              ]}
            />
            <Text style={styles.connectionText}>
              {isSupabaseConfigured
                ? "Supabase connected"
                : "Supabase setup needed"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {!isSupabaseConfigured ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Finish setup</Text>
          <Text style={styles.noticeText}>{getSupabaseConfigError()}</Text>
          <Text style={styles.noticeText}>
            Use `.env.example` and run the SQL in `supabase/schema.sql`.
          </Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account identity</Text>
          <Text style={styles.sectionMeta}>Managed by Supabase Auth</Text>
        </View>

        <View style={styles.identityCard}>
          <Text style={styles.identityLabel}>Full name</Text>
          <Text
            style={[
              styles.identityValue,
              !profile.full_name.trim() ? styles.identityValueMuted : null,
            ]}
          >
            {profile.full_name.trim() || "Not added yet"}
          </Text>
        </View>

        <View style={styles.identityCard}>
          <Text style={styles.identityLabel}>Email</Text>
          <Text style={styles.identityValue}>{user?.email ?? "No email"}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {statCards.map((card) => (
          <View key={card.label} style={styles.statCard}>
            <Ionicons name={card.icon} size={18} color={palette.accent} />
            <Text style={styles.statLabel}>{card.label}</Text>
            <Text style={styles.statValue}>{card.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Athlete details</Text>
          {loading ? <ActivityIndicator color={palette.accent} /> : null}
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.inputLabel}>First name</Text>
            <TextInput
              value={nameParts.firstName}
              onChangeText={(value) =>
                setProfile((current) => ({
                  ...current,
                  full_name: `${value.trim()} ${splitFullName(current.full_name).lastName}`.trim(),
                }))
              }
              placeholder={getExampleHint("firstName")}
              placeholderTextColor={palette.textMuted}
              style={styles.input}
            />
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.inputLabel}>Last name</Text>
            <TextInput
              value={nameParts.lastName}
              onChangeText={(value) =>
                setProfile((current) => ({
                  ...current,
                  full_name: `${splitFullName(current.full_name).firstName} ${value.trim()}`.trim(),
                }))
              }
              placeholder={getExampleHint("lastName")}
              placeholderTextColor={palette.textMuted}
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          value={user?.email ?? profile.email ?? ""}
          editable={false}
          placeholder="name@example.com"
          placeholderTextColor={palette.textMuted}
          style={[styles.input, styles.readonlyInput]}
        />

        <Text style={styles.inputLabel}>Fitness goal</Text>
        <TextInput
          value={profile.fitness_goal ?? ""}
          onChangeText={(value) =>
            setProfile((current) => ({ ...current, fitness_goal: value }))
          }
          placeholder={getExampleHint("goal")}
          placeholderTextColor={palette.textMuted}
          style={[styles.input, styles.multilineInput]}
          multiline
        />

        <Text style={styles.inputLabel}>Training level</Text>
        <View style={styles.levelRow}>
          {trainingLevels.map((level) => {
            const active = profile.training_level === level;
            return (
              <TouchableOpacity
                key={level}
                style={[
                  styles.levelChip,
                  active ? styles.levelChipActive : null,
                ]}
                onPress={() =>
                  setProfile((current) => ({
                    ...current,
                    training_level: level,
                  }))
                }
              >
                <Text
                  style={[
                    styles.levelChipText,
                    active ? styles.levelChipTextActive : null,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.inputLabel}>Age</Text>
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
              style={styles.input}
            />
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
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
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
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
              style={styles.input}
            />
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.inputLabel}>Weekly target</Text>
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
              style={styles.input}
            />
          </View>
        </View>
      </View>

      {message ? <Text style={styles.successText}>{message}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          saving ? styles.primaryButtonDisabled : null,
        ]}
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
            <Text style={styles.primaryButtonText}>
              Save profile to Supabase
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.secondaryActionButton,
          signingOut ? styles.primaryButtonDisabled : null,
        ]}
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
            <Text style={styles.secondaryActionText}>Log out</Text>
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={22} color="#93C5FD" />
            </View>
            <Text style={styles.modalTitle}>Log out now?</Text>
            <Text style={styles.modalText}>
              You’ll return to the login screen and need to sign back in to
              manage your profile and workout plans.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setLogoutPromptVisible(false)}
                disabled={signingOut}
              >
                <Text style={styles.modalSecondaryText}>Stay signed in</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  signingOut ? styles.primaryButtonDisabled : null,
                ]}
                onPress={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? (
                  <ActivityIndicator color={palette.textPrimary} />
                ) : (
                  <Text style={styles.modalPrimaryText}>Log out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  heroBadgeText: {
    color: "#FFD9B8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: palette.textPrimary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    marginBottom: 10,
  },
  heroSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  connectionRow: {
    marginTop: 18,
  },
  connectionPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  connectionLive: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderColor: "rgba(34, 197, 94, 0.25)",
  },
  connectionOffline: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.24)",
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  connectionText: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  noticeCard: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.24)",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  noticeTitle: {
    color: "#FDE68A",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  noticeText: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  panel: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  sectionMeta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  identityCard: {
    backgroundColor: palette.backgroundElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 14,
    marginBottom: 12,
  },
  identityLabel: {
    color: palette.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  identityValue: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  identityValueMuted: {
    color: palette.textMuted,
    fontStyle: "italic",
  },
  inputLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: palette.backgroundElevated,
    color: palette.textPrimary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 14,
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  readonlyInput: {
    opacity: 0.78,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flexGrow: 1,
    minWidth: "30%",
    backgroundColor: "rgba(17, 28, 51, 0.94)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 16,
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  statValue: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  levelChip: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: palette.backgroundElevated,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingVertical: 12,
    alignItems: "center",
  },
  levelChipActive: {
    backgroundColor: palette.accentSoft,
    borderColor: "rgba(255, 105, 0, 0.4)",
  },
  levelChipText: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  levelChipTextActive: {
    color: palette.textPrimary,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCol: {
    flex: 1,
  },
  successText: {
    color: "#86EFAC",
    fontSize: 13,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  errorText: {
    color: "#FDBA74",
    fontSize: 13,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: palette.accent,
    borderRadius: 18,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryActionButton: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.24)",
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  secondaryActionText: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(56, 189, 248, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  modalText: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: palette.backgroundElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSecondaryText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  modalPrimaryButton: {
    flex: 1,
    backgroundColor: palette.sky,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
});
