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
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const [isMonthGestureActive, setIsMonthGestureActive] = React.useState(false);

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
          return new Date(
            current.getFullYear(),
            current.getMonth() + (direction === "next" ? 1 : -1),
            1,
          );
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
    [isMonthTransitioning, monthTransition],
  );

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.15,
      onPanResponderGrant: () => {
        setIsMonthGestureActive(true);
      },
      onPanResponderRelease: (_, gesture) => {
        const swipeThreshold = 44;

        if (gesture.dx < -swipeThreshold) {
          changeMonth("next");
          setIsMonthGestureActive(false);
          return;
        }

        if (gesture.dx > swipeThreshold) {
          changeMonth("previous");
        }

        setIsMonthGestureActive(false);
      },
      onPanResponderTerminate: () => {
        setIsMonthGestureActive(false);
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
      className="flex-1 bg-[#020817]"
      contentContainerClassName="p-4 pb-8"
      showsVerticalScrollIndicator={false}
      scrollEnabled={!isMonthGestureActive}
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
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="mb-[10px] text-xs font-extrabold uppercase tracking-[0.8px] text-[#FDBA74]">
              Workout planner
            </Text>
            <Text className="max-w-[260px] text-[28px] font-extrabold leading-[34px] text-[#F8FAFC]">
              Train with structure, not guesswork
            </Text>
          </View>

          <View className="h-[46px] w-[46px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)]">
            <Ionicons name="calendar-outline" size={18} color={palette.textPrimary} />
          </View>
        </View>

        <Text className="mt-[10px] text-sm leading-5 text-[#CBD5E1]">
          Pick a day, add workouts or tasks, and track what is already done.
        </Text>

        <View className="mt-[18px] flex-row gap-[10px]">
          <MetricCard label="Selected day" value={selectedDate.toDateString()} featured />
          <MetricCard label="Completed" value={`${completedCount}/${plans.length}`} />
        </View>
      </LinearGradient>

      {!isSupabaseConfigured ? (
        <View className="mb-4 rounded-[20px] border border-[rgba(245,158,11,0.24)] bg-[rgba(245,158,11,0.12)] p-4">
          <Text className="mb-[6px] text-[16px] font-bold text-[#FDE68A]">
            Supabase setup needed
          </Text>
          <Text className="text-[13px] leading-5 text-[#CBD5E1]">
            Add the Expo public env vars first, then this planner will persist
            workouts instead of staying empty.
          </Text>
        </View>
      ) : null}

      <View className="mb-4 rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.84)] p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => changeMonth("previous")}
            className="h-9 w-9 items-center justify-center rounded-full bg-[#0B1120]"
          >
            <Ionicons name="chevron-back" size={18} color={palette.textPrimary} />
          </TouchableOpacity>

          <Text className="text-[18px] font-bold text-[#F8FAFC]">
            {currentMonth.toLocaleString(undefined, { month: "long" })}{" "}
            {currentMonth.getFullYear()}
          </Text>

          <TouchableOpacity
            onPress={() => changeMonth("next")}
            className="h-9 w-9 items-center justify-center rounded-full bg-[#0B1120]"
          >
            <Ionicons name="chevron-forward" size={18} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>

        <View className="mb-[10px] flex-row justify-between">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
            <Text
              key={weekday}
              className="text-center text-[12px] font-semibold text-[#94A3B8]"
              style={{ width: "14.28%" }}
            >
              {weekday}
            </Text>
          ))}
        </View>

        <View {...panResponder.panHandlers} className="overflow-hidden">
          <Animated.View style={calendarAnimatedStyle}>
            <View className="flex-row flex-wrap">
              {monthDays.map((date, index) => {
                const iso = date ? isoDateString(date) : null;
                const isSelected = iso === selectedIso;
                const isToday = iso === isoDateString(new Date());
                const planCount = iso ? planSummary[iso] ?? 0 : 0;

                return (
                  <TouchableOpacity
                    key={iso ?? `empty-${index}`}
                    onPress={() => date && setSelectedDate(date)}
                    disabled={!date}
                    className={`mb-[6px] min-h-[64px] items-center justify-center overflow-hidden rounded-[16px] ${
                      isSelected ? "bg-[rgba(255,105,0,0.16)]" : ""
                    }`}
                    style={{ width: "14.28%" }}
                  >
                    <Text
                      className={`text-[15px] font-semibold ${
                        !date
                          ? "text-transparent"
                          : isSelected
                            ? "text-[#F8FAFC]"
                            : isToday
                              ? "text-[#FFD580]"
                              : "text-[#CBD5E1]"
                      }`}
                    >
                      {date ? date.getDate() : ""}
                    </Text>

                    {planCount > 0 ? (
                      <View className="mt-[6px] min-w-[18px] rounded-full bg-[#FF6900] px-[5px] py-[2px]">
                        <Text className="text-center text-[10px] font-extrabold text-[#F8FAFC]">
                          {planCount}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </View>

      <View className="mb-4 rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.84)] p-[18px]">
        <View className="mb-[14px] flex-row items-center justify-between">
          <View>
            <Text className="mb-1 text-[18px] font-bold text-[#F8FAFC]">
              Plan for {selectedDate.toDateString()}
            </Text>
            <Text className="max-w-[270px] text-[13px] leading-[19px] text-[#94A3B8]">
              Add workouts, recovery work, or simple training tasks.
            </Text>
          </View>
          {loadingPlans ? <ActivityIndicator color={palette.accent} /> : null}
        </View>

        <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
          Task or workout title
        </Text>
        <TextInput
          value={draftTitle}
          onChangeText={setDraftTitle}
          placeholder="Leg day, mobility flow, long walk..."
          placeholderTextColor={palette.textMuted}
          className="mb-[14px] rounded-2xl border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
        />

        <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">
          Category
        </Text>
        <View className="mb-[14px]">
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-2xl border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px]"
            onPress={() => setCategoryMenuOpen((current) => !current)}
            activeOpacity={0.85}
          >
            <Text className="text-[15px] font-semibold text-[#F8FAFC]">
              {draftCategory}
            </Text>
            <Ionicons
              name={categoryMenuOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={palette.textSecondary}
            />
          </TouchableOpacity>

          {categoryMenuOpen ? (
            <View className="mt-2 overflow-hidden rounded-[18px] border border-[rgba(148,163,184,0.18)] bg-[#111C33]">
              {WORKOUT_CATEGORIES.map((category, index) => {
                const active = draftCategory === category;
                const isLast = index === WORKOUT_CATEGORIES.length - 1;

                return (
                  <TouchableOpacity
                    key={category}
                    className={`flex-row items-center justify-between px-[14px] py-[13px] ${
                      active ? "bg-[rgba(255,105,0,0.16)]" : ""
                    } ${!isLast ? "border-b border-[rgba(148,163,184,0.08)]" : ""}`}
                    onPress={() => {
                      setDraftCategory(category);
                      setCategoryMenuOpen(false);
                    }}
                  >
                    <Text
                      className={`text-[14px] font-semibold ${
                        active ? "text-[#F8FAFC]" : "text-[#CBD5E1]"
                      }`}
                    >
                      {category}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={16} color={palette.accent} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>

        <Text className="mb-2 text-[13px] font-semibold text-[#CBD5E1]">Notes</Text>
        <TextInput
          value={draftNotes}
          onChangeText={setDraftNotes}
          placeholder="Focus points, intensity, sets, recovery reminders..."
          placeholderTextColor={palette.textMuted}
          className="mb-[14px] min-h-[88px] rounded-2xl border border-[rgba(148,163,184,0.18)] bg-[#0B1120] px-[14px] py-[13px] text-[15px] text-[#F8FAFC]"
          multiline
          style={{ textAlignVertical: "top" }}
        />

        <TouchableOpacity
          className="mt-1 flex-row items-center justify-center rounded-[18px] bg-[#FF6900] py-4"
          style={savingPlan ? { opacity: 0.6 } : undefined}
          onPress={handleCreatePlan}
          disabled={savingPlan || !isSupabaseConfigured || !user}
        >
          {savingPlan ? (
            <ActivityIndicator color={palette.textPrimary} />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={18} color={palette.textPrimary} />
              <Text className="ml-[10px] text-[15px] font-extrabold text-[#F8FAFC]">
                Add to selected day
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View className="mb-4 rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.84)] p-[18px]">
        <View className="mb-[14px] flex-row items-center justify-between">
          <View>
            <Text className="mb-1 text-[18px] font-bold text-[#F8FAFC]">
              Scheduled items
            </Text>
            <Text className="max-w-[270px] text-[13px] leading-[19px] text-[#94A3B8]">
              Tap complete when you finish, or remove a plan you no longer need.
            </Text>
          </View>
        </View>

        {error ? (
          <Text className="mb-3 text-[13px] text-[#FDBA74]">{error}</Text>
        ) : null}

        {plans.length === 0 ? (
          <View className="items-center rounded-[20px] border border-[rgba(148,163,184,0.18)] bg-[rgba(2,8,23,0.5)] p-[18px]">
            <Ionicons name="moon-outline" size={28} color={palette.textMuted} />
            <Text className="mb-[6px] mt-[10px] text-[16px] font-bold text-[#F8FAFC]">
              Nothing scheduled yet
            </Text>
            <Text className="text-center text-[13px] leading-5 text-[#94A3B8]">
              This day is clear. Add a workout or recovery task to start building
              the plan.
            </Text>
          </View>
        ) : (
          plans.map((plan) => (
            <View
              key={plan.id}
              className="mb-3 rounded-[20px] border border-[rgba(148,163,184,0.18)] bg-[rgba(17,28,51,0.94)] p-4"
            >
              <View className="mb-[10px] flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[12px] font-bold uppercase tracking-[0.6px] text-[#FDBA74]">
                    {plan.category || "Workout"}
                  </Text>
                  <Text
                    className={`text-[12px] font-semibold ${
                      plan.status === "done" ? "text-[#86EFAC]" : "text-[#94A3B8]"
                    }`}
                  >
                    {plan.status === "done" ? "Completed" : "Planned"}
                  </Text>
                </View>

                <TouchableOpacity
                  className="h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(249,115,22,0.12)]"
                  onPress={() => setPendingDeletePlan(plan)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FDBA74" />
                </TouchableOpacity>
              </View>

              <Text className="mb-[6px] text-[17px] font-bold text-[#F8FAFC]">
                {plan.title}
              </Text>
              {plan.notes ? (
                <Text className="mb-[14px] text-[14px] leading-5 text-[#CBD5E1]">
                  {plan.notes}
                </Text>
              ) : null}

              <TouchableOpacity
                className={`self-start rounded-full border px-3 py-[9px] ${
                  plan.status === "done"
                    ? "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.16)]"
                    : "border-[rgba(56,189,248,0.28)] bg-[rgba(56,189,248,0.14)]"
                }`}
                onPress={() => handleToggleStatus(plan)}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={plan.status === "done" ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    color={palette.textPrimary}
                  />
                  <Text className="ml-2 text-[13px] font-bold text-[#F8FAFC]">
                    {plan.status === "done" ? "Mark as planned" : "Mark as done"}
                  </Text>
                </View>
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
        <View className="flex-1 justify-center bg-[rgba(2,8,23,0.68)] p-5">
          <View className="rounded-[24px] border border-[rgba(148,163,184,0.18)] bg-[#111C33] p-[22px]">
            <View className="mb-4 h-[46px] w-[46px] items-center justify-center rounded-full bg-[rgba(249,115,22,0.14)]">
              <Ionicons name="trash-outline" size={22} color="#FDBA74" />
            </View>

            <Text className="mb-2 text-[20px] font-extrabold text-[#F8FAFC]">
              Delete this event?
            </Text>
            <Text className="text-[14px] leading-[21px] text-[#CBD5E1]">
              {pendingDeletePlan
                ? `Remove "${pendingDeletePlan.title}" from ${selectedDate.toDateString()}?`
                : "This will remove the selected event from your calendar."}
            </Text>

            <View className="mt-5 flex-row gap-[10px]">
              <TouchableOpacity
                className="flex-1 items-center rounded-[16px] border border-[rgba(148,163,184,0.18)] bg-[#0B1120] py-[14px]"
                onPress={() => setPendingDeletePlan(null)}
                disabled={deletingPlan}
              >
                <Text className="text-[14px] font-bold text-[#F8FAFC]">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 items-center justify-center rounded-[16px] bg-[#F97316] py-[14px]"
                style={deletingPlan ? { opacity: 0.6 } : undefined}
                onPress={confirmDeletePlan}
                disabled={deletingPlan}
              >
                {deletingPlan ? (
                  <ActivityIndicator color={palette.textPrimary} />
                ) : (
                  <Text className="text-[14px] font-extrabold text-[#F8FAFC]">
                    Delete
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
    <View
      className="rounded-[18px] bg-[rgba(255,255,255,0.08)] p-3"
      style={{ flex: featured ? 1.35 : 1 }}
    >
      <Text className="mb-[6px] text-[11px] text-[#94A3B8]">{label}</Text>
      <Text
        className={`font-bold text-[#F8FAFC] ${
          featured ? "text-[15px] leading-[21px]" : "text-[14px]"
        }`}
        numberOfLines={featured ? 2 : 1}
      >
        {value}
      </Text>
    </View>
  );
}