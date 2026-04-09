import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

const TAB_HEIGHT = 66;

export default function BottomNav() {
  const pathname = usePathname() || "/";
  const navigatingRef = React.useRef(false);

  const goReplace = (to: string) => {
    // Prevent rapid consecutive navigations while an animation is running
    if (navigatingRef.current) return;
    if ((pathname === "/" && to === "/") || pathname === to) return;
    navigatingRef.current = true;
    // Use replace to avoid stacking routes when switching tabs
    // cast to any because expo-router's strict route union types
    // don't accept dynamic strings here
    router.replace(to as any);
    // unlock after animation/window period
    setTimeout(() => (navigatingRef.current = false), 550);
  };
  // Hide bottom nav on workout pages (those should stack and be isolated)
  if (pathname.startsWith("/workout")) return null;

  return (
    <View style={styles.container}>
      <NavItem
        icon="home-outline"
        label="Home"
        active={pathname === "/" || pathname === ""}
        onPress={() => goReplace("/")}
      />

      <NavItem
        icon="calendar-outline"
        label="Calendar"
        active={pathname.startsWith("/calendar")}
        onPress={() => goReplace("/calendar")}
      />

      <NavItem
        icon="person-outline"
        label="Profile"
        active={pathname.startsWith("/profile")}
        onPress={() => goReplace("/profile")}
      />
    </View>
  );
}

function NavItem({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const activeWrapperStyle: ViewStyle = active
    ? styles.activeWrapper
    : ({} as ViewStyle);
  const pressingRef = React.useRef(false);

  const handlePress = () => {
    if (active) return; // ignore presses on already-selected tab
    if (pressingRef.current) return; // debounce rapid presses
    pressingRef.current = true;
    try {
      onPress();
    } finally {
      setTimeout(() => (pressingRef.current = false), 600);
    }
  };

  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={active}
    >
      <View style={[styles.iconWrapper, activeWrapperStyle]}>
        <Ionicons
          name={icon as any}
          size={22}
          color={active ? "#FFF" : "#E5E7EB"}
        />
      </View>
      <Text style={[styles.label, active ? styles.labelActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: TAB_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#020817",
  },
  item: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  activeWrapper: {
    backgroundColor: "rgba(255,105,0,0.95)",
    shadowColor: "#FF6900",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 4,
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
