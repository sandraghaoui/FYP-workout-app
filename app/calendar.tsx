import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
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
  const WIDTH = Dimensions.get("window").width;
  const translateX = React.useRef(new Animated.Value(0)).current; // single-panel: start at 0

  // memoized month grids to avoid recalculation on every render
  const monthDays = React.useCallback((y: number, m: number) => {
    // Return array of 42 slots (6 rows x 7 cols) with Date for month-days and null for empty slots
    const first = new Date(y, m, 1);
    const start = first.getDay();
    const total = new Date(y, m + 1, 0).getDate();
    const arr: Array<Date | null> = [];
    for (let i = 0; i < start; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(new Date(y, m, d));
    while (arr.length < 42) arr.push(null);
    return arr;
  }, []);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dy) < 30,
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        // single-panel: drag moves between -WIDTH..+WIDTH
        translateX.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        const { dx, vx } = gesture;
        const SWIPE_THRESHOLD = WIDTH * 0.22;
        const FLING_VELOCITY = 0.4;

        if (dx < -SWIPE_THRESHOLD || (dx < 0 && vx < -FLING_VELOCITY)) {
          // animate to show void to the left then advance month
          setCover(true);
          Animated.timing(translateX, {
            toValue: -WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrent((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
            translateX.setValue(0);
            // small timeout to avoid visual jump
            setTimeout(() => setCover(false), 80);
          });
        } else if (dx > SWIPE_THRESHOLD || (dx > 0 && vx > FLING_VELOCITY)) {
          // animate to show void to the right then go to previous month
          setCover(true);
          Animated.timing(translateX, {
            toValue: WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrent((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
            translateX.setValue(0);
            setTimeout(() => setCover(false), 80);
          });
        } else {
          // snap back to center
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;
  // Single-panel: compute current month's grid
  const curDays = monthDays(current.getFullYear(), current.getMonth());
  const selectedISO = isoDateString(selected);
  const events = SAMPLE_EVENTS[selectedISO] ?? [];
  const [cover, setCover] = React.useState(false);

  const addMonths = (d: Date, n: number) =>
    new Date(d.getFullYear(), d.getMonth() + n, 1);

  const goPrev = () => {
    Animated.timing(translateX, {
      toValue: WIDTH,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setCurrent((c) => addMonths(c, -1));
      translateX.setValue(0);
    });
  };

  const goNext = () => {
    setCover(true);
    Animated.timing(translateX, {
      toValue: -WIDTH,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setCurrent((c) => addMonths(c, 1));
      translateX.setValue(0);
      setTimeout(() => setCover(false), 80);
    });
  };

  // renderDayCell inside component so it can compare against current for styling
  const renderDayCell = (d: Date | null, idx: number) => {
    const isToday = d ? isoDateString(d) === isoDateString(new Date()) : false;
    const isSelected = d ? isoDateString(d) === isoDateString(selected) : false;
    const isOtherMonth = d ? d.getMonth() !== current.getMonth() : false;
    const keyId = `cell-${idx}`; // position-based stable key
    return (
      <TouchableOpacity
        key={keyId}
        style={[styles.cell, isSelected ? styles.cellSelected : null]}
        onPress={() => d && setSelected(d)}
        activeOpacity={d ? 0.7 : 1}
      >
        <Text
          style={[
            styles.cellText,
            isToday ? styles.cellTodayText : null,
            isSelected ? styles.cellTextSelected : null,
            isOtherMonth ? styles.cellFaded : null,
          ]}
        >
          {d ? d.getDate() : ""}
        </Text>
        {d && SAMPLE_EVENTS[isoDateString(d)] ? (
          <View style={styles.dot} />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={goPrev} style={styles.chev}>
            <Text style={styles.chevText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {current.toLocaleString(undefined, { month: "long" })}{" "}
            {current.getFullYear()}
          </Text>
          <TouchableOpacity onPress={goNext} style={styles.chev}>
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

      <View {...panResponder.panHandlers} style={{ overflow: "hidden" }}>
        <Animated.View style={{ width: WIDTH, transform: [{ translateX }] }}>
          <View style={{ width: WIDTH }}>
            <View style={styles.grid}>
              {curDays.map((d, i) => renderDayCell(d, i))}
            </View>
          </View>
        </Animated.View>
        {cover ? <View pointerEvents="none" style={styles.cover} /> : null}
      </View>

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

// small renderer for a day cell to avoid repeating code
function renderDayCell(
  d: Date | null,
  panel: string,
  idx: number,
  selected: Date,
  setSelected: (d: Date) => void,
) {
  const isToday = d ? isoDateString(d) === isoDateString(new Date()) : false;
  const isSelected = d ? isoDateString(d) === isoDateString(selected) : false;
  const keyId = d ? `day-${isoDateString(d)}` : `${panel}-empty-${idx}`;
  return (
    <TouchableOpacity
      key={keyId}
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
  cellFaded: { color: "#6B7280" },
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
  cover: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#020817",
  },
});
