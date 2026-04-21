import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { useAuth } from "@/src/context/AuthContext";

const TAB_HEIGHT = 66;

export default function BottomNav() {
  const pathname = usePathname() || "/";
  const { session } = useAuth();
  const navigatingRef = React.useRef(false);

  const goReplace = (to: string) => {
    if (navigatingRef.current) return;
    if ((pathname === "/" && to === "/") || pathname === to) return;

    navigatingRef.current = true;
    router.replace(to as any);
    setTimeout(() => {
      navigatingRef.current = false;
    }, 550);
  };

  if (
    !session ||
    pathname.startsWith("/workout") ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return null;
  }

  return (
    <View
      className="flex-row items-center justify-around border-t bg-[#020817]"
      style={{
        height: TAB_HEIGHT,
        borderTopWidth: 0.5,
        borderTopColor: "rgba(255,255,255,0.06)",
      }}
    >
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
    ? {
        backgroundColor: "rgba(255,105,0,0.95)",
        shadowColor: "#FF6900",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
      }
    : {};

  const pressingRef = React.useRef(false);

  const handlePress = () => {
    if (active) return;
    if (pressingRef.current) return;

    pressingRef.current = true;
    try {
      onPress();
    } finally {
      setTimeout(() => {
        pressingRef.current = false;
      }, 600);
    }
  };

  return (
    <TouchableOpacity
      className="items-center justify-center"
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={active}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={activeWrapperStyle}
      >
        <Ionicons
          name={icon as any}
          size={22}
          color={active ? "#FFF" : "#E5E7EB"}
        />
      </View>

      <Text
        className={`mt-1 text-[11px] ${
          active ? "text-white" : "text-[#9CA3AF]"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}