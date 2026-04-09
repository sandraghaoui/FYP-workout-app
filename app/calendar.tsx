import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function isoDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

const SAMPLE_EVENTS: Record<string, Array<{ id: string; title: string }>> = {
  // sample items keyed by YYYY-MM-DD
  [new Date().toISOString().slice(0, 10)]: [
    { id: "1", title: "Legs - Squats" },
    { id: "2", title: "Core - Plank" },
  ],
  // example: tomorrow
  [new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)]: [
    { id: "3", title: "Upper body - Push" },
  ],
};

export default function CalendarScreen() {
  const router = useRouter();
  const [current, setCurrent] = React.useState(() => new Date());
  const [selected, setSelected] = React.useState<Date>(() => new Date());

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<Date | null> = [];
  // fill leading empty cells
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
  // pad to 42 cells (6 weeks)
  while (days.length < 42) days.push(null);

  const prevMonth = () =>
    setCurrent((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrent((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));

  const selectedISO = isoDateString(selected);
  const events = SAMPLE_EVENTS[selectedISO] ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={prevMonth} style={styles.chev}>
            <Text style={styles.chevText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {current.toLocaleString(undefined, { month: "long" })} {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.chev}>
            <Text style={styles.chevText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ width: 48 }} />
      </View>

      <View style={styles.weekdaysRow}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {days.map((d, i) => {
          const isToday = d
            ? isoDateString(d) === isoDateString(new Date())
            : false;
          const isSelected = d ? isoDateString(d) === selectedISO : false;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.cell, isSelected ? styles.cellSelected : null]}
              onPress={() => d && setSelected(d)}
              activeOpacity={d ? 0.7 : 1}
            >
              <Text
                style={[
                  styles.cellText,
                  isToday ? styles.cellTodayText : null,
                  isSelected ? styles.cellTextSelected : null,
                ]}
              >
                {d ? d.getDate() : ""}
              </Text>
              {d && SAMPLE_EVENTS[isoDateString(d)] ? (
                <View style={styles.dot} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.eventsPanel}>
        <Text style={styles.eventsTitle}>
          Planned for {selected.toDateString()}
        </Text>
        {events.length === 0 ? (
          <Text style={styles.noEvents}>No workouts planned for this day.</Text>
        ) : (
          events.map((e) => (
            <View key={e.id} style={styles.eventRow}>
              <Text style={styles.eventText}>{e.title}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020817",
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backText: { color: "#9CA3AF" },
  headerCenter: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 8,
  },
  chev: { paddingHorizontal: 6 },
  chevText: { color: "#FFFFFF", fontSize: 20 },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  weekday: { color: "#9CA3AF", width: 44, textAlign: "center", fontSize: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  cell: {
    width: "14.28%",
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: { color: "#E5E7EB" },
  cellTodayText: { color: "#FFCC99", fontWeight: "700" },
  cellSelected: { backgroundColor: "rgba(255,105,0,0.18)", borderRadius: 8 },
  cellTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF6900",
    marginTop: 6,
  },
  eventsPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  eventsTitle: { color: "#FFFFFF", fontWeight: "700", marginBottom: 8 },
  noEvents: { color: "#9CA3AF" },
  eventRow: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.02)",
  },
  eventText: { color: "#E5E7EB" },
});
