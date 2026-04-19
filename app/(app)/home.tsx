import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { workouts, Workout } from "../../constants/workouts";

const CARD_HEIGHT = 200;

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* HERO */}
        <View style={styles.heroWrapper}>
          <ImageBackground
            source={require("../../assets/images/image3.png")}
            style={styles.heroImage}
            imageStyle={styles.heroImageRadius}
          >
            <LinearGradient
              colors={
                [
                  "rgba(3,7,18,0.5)",
                  "rgba(3,7,18,0.8)",
                  "rgba(3,7,18,1)",
                ] as const
              }
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.heroOverlay}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Ionicons
                  name="flash-outline"
                  size={16}
                  color="#FFD580"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.heroBadgeText}>AI-Powered Coaching</Text>
              </View>
              <Text style={styles.heroTitle}>Choose Your Workout</Text>
              <Text style={styles.heroSubtitle}>
                Personalized guidance with live camera feedback
              </Text>
            </View>
          </ImageBackground>

          <View style={styles.heroStatsRow}>
            <View style={[styles.heroStatCard, { borderColor: "#FF6900" }]}>
              <Text style={styles.heroStatNumber}>6</Text>
              <Text style={styles.heroStatLabel}>Workouts</Text>
            </View>
            <View style={[styles.heroStatCard, { borderColor: "#2B7FFF" }]}>
              <Text style={styles.heroStatNumber}>10-30</Text>
              <Text style={styles.heroStatLabel}>Minutes</Text>
            </View>
            <View style={[styles.heroStatCard, { borderColor: "#00C950" }]}>
              <Text style={styles.heroStatNumber}>Live</Text>
              <Text style={styles.heroStatLabel}>Coaching</Text>
            </View>
          </View>
        </View>

        {/* WORKOUT CARDS */}
        {workouts.map((w: Workout) => (
          <View key={w.id} style={styles.cardWrapper}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/workout/[id]",
                  params: { id: String(w.id) },
                })
              }
            >
              <ImageBackground
                source={w.image}
                style={styles.card}
                imageStyle={styles.cardImage}
              >
                <LinearGradient
                  colors={
                    [
                      "rgba(3,7,18,1)",
                      "rgba(3,7,18,0.6)",
                      "rgba(0,0,0,0)",
                    ] as const
                  }
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.blackOverlay}
                />
                <LinearGradient
                  colors={w.colorGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.colorOverlay}
                />

                <View style={styles.content}>
                  <View style={styles.topRow}>
                    <LinearGradient
                      colors={w.colorGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.numberPill}
                    >
                      <Text style={styles.numberText}>{w.id}</Text>
                    </LinearGradient>

                    <View style={styles.arrowPill}>
                      <Text style={styles.arrowText}>›</Text>
                    </View>
                  </View>

                  <Text style={styles.title}>{w.title}</Text>
                  <Text style={styles.description}>{w.description}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color="#FFFFFF"
                        style={styles.metaIcon}
                      />
                      <Text style={styles.metaPillText}>{w.duration}</Text>
                    </View>

                    <View style={styles.metaPill}>
                      <MaterialCommunityIcons
                        name="target"
                        size={16}
                        color="#FFFFFF"
                        style={styles.metaIcon}
                      />
                      <Text style={styles.metaPillText}>
                        {w.exercisesCountLabel}
                      </Text>
                    </View>
                  </View>

                  <LinearGradient
                    colors={w.colorGradient}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.tagPill}
                  >
                    <Text style={styles.tagText}>{w.tag}</Text>
                  </LinearGradient>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}



const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020817",
  },
  scrollContent: {
    paddingBottom: 24,
  },

  /* HERO */
  heroWrapper: {
    marginBottom: 24,
  },
  heroImage: {
    width: "100%",
    height: 260,
  },
  heroImageRadius: {
    borderRadius: 0,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    justifyContent: "flex-end",
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.85)",
    marginBottom: 10,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "#E5E7EB",
    fontSize: 13,
    lineHeight: 18,
  },
  heroStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 16,
  },
  heroStatCard: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
  },
  heroStatNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  heroStatLabel: {
    color: "#E5E7EB",
    fontSize: 11,
    textAlign: "center",
  },

  /* CARDS */
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
  },
  cardImage: {
    borderRadius: 24,
  },
  blackOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  colorOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    justifyContent: "flex-start",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  numberPill: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  arrowPill: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowText: {
    color: "#FFFFFF",
    fontSize: 22,
    marginTop: -1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    color: "#E5E7EB",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginRight: 8,
  },
  metaIcon: {
    marginRight: 6,
  },
  metaPillText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  tagPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "500",
  },
});
