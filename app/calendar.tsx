import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { isSupabaseConfigured } from "@/src/lib/supabase";
import {
  createWorkoutPlan,
  deleteWorkoutPlan,
  listWorkoutPlans,
  listWorkoutPlanSummary,
  updateWorkoutPlan,
  WorkoutPlanRecord,
} from "@/src/services/workout-plans-service";
import { gradients, palette } from "@/src/theme/palette";

const WORKOUT_CATEGORIES = [
  "Workout",
  "Strength",
  "Cardio",
  "Mobility",
  "Recovery",
  "Conditioning",
  "Personal",
] as const;

function isoDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthGrid(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = [];

  for (let index = 0; index < startOffset; index += 1) days.push(null);
  for (let day = 1; day <= totalDays; day += 1) days.push(new Date(year, month, day));
  while (days.length < 42) days.push(null);

  return days;
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: isoDateString(start),
    end: isoDateString(end),
  };
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const monthTransition = React.useRef(new Animated.Value(0)).current;
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const [plans, setPlans] = React.useState<WorkoutPlanRecord[]>([]);
  const [planSummary, setPlanSummary] = React.useState<Record<string, number>>({});
  const [loadingPlans, setLoadingPlans] = React.useState(false);
  const [savingPlan, setSavingPlan] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftCategory, setDraftCategory] = React.useState("Workout");
  const [draftNotes, setDraftNotes] = React.useState("");
  const [categoryMenuOpen, setCategoryMenuOpen] = React.useState(false);
  const [pendingDeletePlan, setPendingDeletePlan] =
    React.useState<WorkoutPlanRecord | null>(null);
  const [deletingPlan, setDeletingPlan] = React.useState(false);
  const [isMonthTransitioning, setIsMonthTransitioning] = React.useState(false);

  const monthDays = React.useMemo(() => getMonthGrid(currentMonth), [currentMonth]);
  const selectedIso = isoDateString(selectedDate);

  const reloadSelectedDay = React.useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setPlans([]);
      return;
    }

    setLoadingPlans(true);
    setError(null);

    try {
      const data = await listWorkoutPlans(user.id, selectedIso);
      setPlans(data);
    } catch (loadError) {
      const nextError =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your workouts for this day.";
      setError(nextError);
    } finally {
      setLoadingPlans(false);
    }
  }, [selectedIso, user]);

  const reloadMonthSummary = React.useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setPlanSummary({});
      return;
    }

    try {
      const range = getMonthRange(currentMonth);
      const items = await listWorkoutPlanSummary(user.id, range.start, range.end);
      const summary = items.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.workout_date] = (accumulator[item.workout_date] ?? 0) + 1;
        return accumulator;
      }, {});

      setPlanSummary(summary);
    } catch (loadError) {
      const nextError =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load monthly plan summary.";
      setError(nextError);
    }
  }, [currentMonth, user]);

  React.useEffect(() => {
    void reloadSelectedDay();
  }, [reloadSelectedDay]);

  React.useEffect(() => {
    void reloadMonthSummary();
  }, [reloadMonthSummary]);

  const changeMonth = React.useCallback(
    (direction: "previous" | "next") => {
      if (isMonthTransitioning) return;

      const outgoingOffset = direction === "next" ? -26 : 26;
      const incomingOffset = direction === "next" ? 26 : -26;

      setIsMonthTransitioning(true);
      Animated.timing(monthTransition, {
        toValue: outgoingOffset,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setCurrentMonth((current) => {
          const nextMonth = new Date(
            current.getFullYear(),
            current.getMonth() + (direction === "next" ? 1 : -1),
            1,
          );

          if (
            selectedDate.getFullYear() === current.getFullYear() &&
            selectedDate.getMonth() === current.getMonth()
          ) {
            const clampedDate = new Date(
              nextMonth.getFullYear(),
              nextMonth.getMonth(),
              Math.min(
                selectedDate.getDate(),
                new Date(
                  nextMonth.getFullYear(),
                  nextMonth.getMonth() + 1,
                  0,
                ).getDate(),
              ),
            );
            setSelectedDate(clampedDate);
          }

          return nextMonth;
        });

        monthTransition.setValue(incomingOffset);
        Animated.timing(monthTransition, {
          toValue: 0,
          duration: 170,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setIsMonthTransitioning(false);
        });
      });
    },
    [isMonthTransitioning, monthTransition, selectedDate],
  );

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 30,
      onPanResponderRelease: (_, gesture) => {
        const swipeThreshold = 44;

        if (gesture.dx < -swipeThreshold) {
          changeMonth("next");
          return;
        }

        if (gesture.dx > swipeThreshold) {
          changeMonth("previous");
        }
      },
    }),
  ).current;

  const handleCreatePlan = React.useCallback(async () => {
    if (!user) {
      Alert.alert("Login needed", "Sign in to create workout plans.");
      return;
    }

    if (!draftTitle.trim()) {
      Alert.alert("Title required", "Add a workout or task title first.");
      return;
    }

    setSavingPlan(true);
    setError(null);

    try {
      await createWorkoutPlan({
        user_id: user.id,
        workout_date: selectedIso,
        title: draftTitle.trim(),
        category: draftCategory.trim() || "Workout",
        notes: draftNotes.trim() || null,
        status: "planned",
      });

      setDraftTitle("");
      setDraftCategory("Workout");
      setDraftNotes("");
      setCategoryMenuOpen(false);
      await Promise.all([reloadSelectedDay(), reloadMonthSummary()]);
    } catch (createError) {
      const nextError =
        createError instanceof Error
          ? createError.message
          : "Unable to save this workout plan.";
      setError(nextError);
    } finally {
      setSavingPlan(false);
    }
  }, [
    draftCategory,
    draftNotes,
    draftTitle,
    reloadMonthSummary,
    reloadSelectedDay,
    selectedIso,
    user,
  ]);

  const handleToggleStatus = React.useCallback(
    async (plan: WorkoutPlanRecord) => {
      try {
        await updateWorkoutPlan(plan.id, {
          status: plan.status === "done" ? "planned" : "done",
        });
        await Promise.all([reloadSelectedDay(), reloadMonthSummary()]);
      } catch (updateError) {
        const nextError =
          updateError instanceof Error
            ? updateError.message
            : "Unable to update this workout plan.";
        setError(nextError);
      }
    },
    [reloadMonthSummary, reloadSelectedDay],
  );

  const handleDeletePlan = React.useCallback(
    async (planId: string) => {
      try {
        await deleteWorkoutPlan(planId);
        await Promise.all([reloadSelectedDay(), reloadMonthSummary()]);
      } catch (deleteError) {
        const nextError =
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to delete this workout plan.";
        setError(nextError);
      }
    },
    [reloadMonthSummary, reloadSelectedDay],
  );

  const confirmDeletePlan = React.useCallback(async () => {
    if (!pendingDeletePlan) return;

    setDeletingPlan(true);
    try {
      await handleDeletePlan(pendingDeletePlan.id);
      setPendingDeletePlan(null);
    } finally {
      setDeletingPlan(false);
    }
  }, [handleDeletePlan, pendingDeletePlan]);

  const completedCount = plans.filter((item) => item.status === "done").length;
  const calendarAnimatedStyle = {
    opacity: monthTransition.interpolate({
      inputRange: [-26, 0, 26],
      outputRange: [0.6, 1, 0.6],
    }),
    transform: [{ translateX: monthTransition }],
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={gradients.hero} style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>Workout planner</Text>
            <Text style={styles.heroTitle}>Train with structure, not guesswork</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="calendar-outline" size={18} color={palette.textPrimary} />
          </View>
        </View>

        <Text style={styles.heroSubtitle}>
          Pick a day, add workouts or tasks, and track what is already done.
        </Text>

        <View style={styles.heroMetricsRow}>
          <MetricCard label="Selected day" value={selectedDate.toDateString()} featured />
          <MetricCard label="Completed" value={`${completedCount}/${plans.length}`} />
        </View>
      </LinearGradient>

      {!isSupabaseConfigured ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Supabase setup needed</Text>
          <Text style={styles.warningText}>
            Add the Expo public env vars first, then this planner will persist
            workouts instead of staying empty.
          </Text>
        </View>
      ) : null}

      <View style={styles.calendarShell}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => changeMonth("previous")}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-back" size={18} color={palette.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleString(undefined, { month: "long" })}{" "}
            {currentMonth.getFullYear()}
          </Text>

          <TouchableOpacity
            onPress={() => changeMonth("next")}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-forward" size={18} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdaysRow}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
            <Text key={weekday} style={styles.weekday}>
              {weekday}
            </Text>
          ))}
        </View>

        <View {...panResponder.panHandlers} style={styles.calendarGestureArea}>
          <Animated.View style={calendarAnimatedStyle}>
            <View style={styles.grid}>
            {monthDays.map((date, index) => {
              const iso = date ? isoDateString(date) : null;
              const isSelected = iso === selectedIso;
              const isToday = iso === isoDateString(new Date());
              const planCount = iso ? planSummary[iso] ?? 0 : 0;

              return (
                <TouchableOpacity
                  key={iso ?? `empty-${index}`}
                  style={[
                    styles.dayCell,
                    isSelected ? styles.dayCellSelected : null,
                  ]}
                  onPress={() => date && setSelectedDate(date)}
                  disabled={!date}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday ? styles.todayText : null,
                      isSelected ? styles.dayTextSelected : null,
                      !date ? styles.dayTextEmpty : null,
                    ]}
                  >
                    {date ? date.getDate() : ""}
                  </Text>
                  {planCount > 0 ? (
                    <View style={styles.planCountPill}>
                      <Text style={styles.planCountText}>{planCount}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
            </View>
          </Animated.View>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Plan for {selectedDate.toDateString()}</Text>
            <Text style={styles.panelSubtitle}>
              Add workouts, recovery work, or simple training tasks.
            </Text>
          </View>
          {loadingPlans ? <ActivityIndicator color={palette.accent} /> : null}
        </View>

        <Text style={styles.inputLabel}>Task or workout title</Text>
        <TextInput
          value={draftTitle}
          onChangeText={setDraftTitle}
          placeholder="Leg day, mobility flow, long walk..."
          placeholderTextColor={palette.textMuted}
          style={styles.input}
        />

        <Text style={styles.inputLabel}>Category</Text>
        <View style={styles.dropdownWrap}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setCategoryMenuOpen((current) => !current)}
            activeOpacity={0.85}
          >
            <Text style={styles.dropdownButtonText}>{draftCategory}</Text>
            <Ionicons
              name={categoryMenuOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={palette.textSecondary}
            />
          </TouchableOpacity>

          {categoryMenuOpen ? (
            <View style={styles.dropdownMenu}>
              {WORKOUT_CATEGORIES.map((category) => {
                const active = draftCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.dropdownItem,
                      active ? styles.dropdownItemActive : null,
                    ]}
                    onPress={() => {
                      setDraftCategory(category);
                      setCategoryMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        active ? styles.dropdownItemTextActive : null,
                      ]}
                    >
                      {category}
                    </Text>
                    {active ? (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={palette.accent}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>

        <Text style={styles.inputLabel}>Notes</Text>
        <TextInput
          value={draftNotes}
          onChangeText={setDraftNotes}
          placeholder="Focus points, intensity, sets, recovery reminders..."
          placeholderTextColor={palette.textMuted}
          style={[styles.input, styles.notesInput]}
          multiline
        />

        <TouchableOpacity
          style={[styles.primaryButton, savingPlan ? styles.primaryButtonDisabled : null]}
          onPress={handleCreatePlan}
          disabled={savingPlan || !isSupabaseConfigured || !user}
        >
          {savingPlan ? (
            <ActivityIndicator color={palette.textPrimary} />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={18} color={palette.textPrimary} />
              <Text style={styles.primaryButtonText}>Add to selected day</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Scheduled items</Text>
            <Text style={styles.panelSubtitle}>
              Tap complete when you finish, or remove a plan you no longer need.
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="moon-outline" size={28} color={palette.textMuted} />
            <Text style={styles.emptyTitle}>Nothing scheduled yet</Text>
            <Text style={styles.emptyText}>
              This day is clear. Add a workout or recovery task to start building
              the plan.
            </Text>
          </View>
        ) : (
          plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planTopRow}>
                <View style={styles.planMeta}>
                  <Text style={styles.planCategory}>{plan.category || "Workout"}</Text>
                  <Text
                    style={[
                      styles.planStatus,
                      plan.status === "done" ? styles.planStatusDone : null,
                    ]}
                  >
                    {plan.status === "done" ? "Completed" : "Planned"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => setPendingDeletePlan(plan)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FDBA74" />
                </TouchableOpacity>
              </View>

              <Text style={styles.planTitle}>{plan.title}</Text>
              {plan.notes ? <Text style={styles.planNotes}>{plan.notes}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  plan.status === "done" ? styles.statusButtonDone : null,
                ]}
                onPress={() => handleToggleStatus(plan)}
              >
                <Ionicons
                  name={plan.status === "done" ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={palette.textPrimary}
                />
                <Text style={styles.statusButtonText}>
                  {plan.status === "done" ? "Mark as planned" : "Mark as done"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <Modal
        visible={Boolean(pendingDeletePlan)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingPlan) setPendingDeletePlan(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="trash-outline" size={22} color="#FDBA74" />
            </View>
            <Text style={styles.modalTitle}>Delete this event?</Text>
            <Text style={styles.modalText}>
              {pendingDeletePlan
                ? `Remove "${pendingDeletePlan.title}" from ${selectedDate.toDateString()}?`
                : "This will remove the selected event from your calendar."}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setPendingDeletePlan(null)}
                disabled={deletingPlan}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  deletingPlan ? styles.primaryButtonDisabled : null,
                ]}
                onPress={confirmDeletePlan}
                disabled={deletingPlan}
              >
                {deletingPlan ? (
                  <ActivityIndicator color={palette.textPrimary} />
                ) : (
                  <Text style={styles.modalPrimaryText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  featured = false,
}: {
  label: string;
  value: string;
  featured?: boolean;
}) {
  return (
    <View style={[styles.metricCard, featured ? styles.metricCardFeatured : null]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[styles.metricValue, featured ? styles.metricValueFeatured : null]}
        numberOfLines={featured ? 2 : 1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroEyebrow: {
    color: "#FDBA74",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  heroTitle: {
    color: palette.textPrimary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    maxWidth: 260,
  },
  heroSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  heroBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroMetricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 12,
  },
  metricCardFeatured: {
    flex: 1.35,
  },
  metricLabel: {
    color: palette.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  metricValue: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  metricValueFeatured: {
    fontSize: 15,
    lineHeight: 21,
  },
  warningCard: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.24)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  warningTitle: {
    color: "#FDE68A",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  warningText: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  calendarShell: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekday: {
    width: "14.28%",
    textAlign: "center",
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  calendarGestureArea: {
    overflow: "hidden",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginBottom: 6,
  },
  dayCellSelected: {
    backgroundColor: palette.accentSoft,
  },
  dayText: {
    color: palette.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  dayTextSelected: {
    color: palette.textPrimary,
  },
  todayText: {
    color: "#FFD580",
  },
  dayTextEmpty: {
    color: "transparent",
  },
  planCountPill: {
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginTop: 6,
  },
  planCountText: {
    color: palette.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },
  panel: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 18,
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  panelTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  panelSubtitle: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 270,
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
  dropdownWrap: {
    marginBottom: 14,
  },
  dropdownButton: {
    backgroundColor: palette.backgroundElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownButtonText: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  dropdownMenu: {
    backgroundColor: palette.surfaceStrong,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    marginTop: 8,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.08)",
  },
  dropdownItemActive: {
    backgroundColor: palette.accentSoft,
  },
  dropdownItemText: {
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  dropdownItemTextActive: {
    color: palette.textPrimary,
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: "top",
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
  errorText: {
    color: "#FDBA74",
    fontSize: 13,
    marginBottom: 12,
  },
  emptyState: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(2, 8, 23, 0.5)",
    alignItems: "center",
  },
  emptyTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  planCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(17, 28, 51, 0.94)",
    borderWidth: 1,
    borderColor: palette.cardBorder,
    marginBottom: 12,
  },
  planTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  planMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planCategory: {
    color: "#FDBA74",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  planStatus: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  planStatusDone: {
    color: "#86EFAC",
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  planTitle: {
    color: palette.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  planNotes: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  statusButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "rgba(56, 189, 248, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.28)",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusButtonDone: {
    backgroundColor: "rgba(34, 197, 94, 0.16)",
    borderColor: "rgba(34, 197, 94, 0.28)",
  },
  statusButtonText: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "700",
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
    backgroundColor: "rgba(249, 115, 22, 0.14)",
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
    backgroundColor: palette.danger,
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
