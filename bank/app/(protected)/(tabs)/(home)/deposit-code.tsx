import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DepositCode = () => {
  const router = useRouter();

  // Generate star positions
  const stars = useRef(
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: 2 + Math.random() * 3,
      duration: 1000 + Math.random() * 2000,
    }))
  ).current;

  // Generate moon positions
  const moons = useRef([
    { x: SCREEN_WIDTH * 0.15, y: SCREEN_HEIGHT * 0.2, size: 35 },
    { x: SCREEN_WIDTH * 0.8, y: SCREEN_HEIGHT * 0.3, size: 28 },
  ]).current;

  // Animation values
  const starAnimations = useRef(
    stars.map(() => new Animated.Value(Math.random()))
  ).current;
  const moonAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Animate stars
  useEffect(() => {
    const starAnimationsArray = starAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: stars[index].duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: stars[index].duration,
            useNativeDriver: true,
          }),
        ])
      );
    });
    Animated.parallel(starAnimationsArray).start();
  }, []);

  // Animate moons
  useEffect(() => {
    const moonAnimationsArray = moonAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000 + index * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000 + index * 1000,
            useNativeDriver: true,
          }),
        ])
      );
    });
    Animated.parallel(moonAnimationsArray).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {stars.map((star, index) => {
          const opacity = starAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          });
          return (
            <Animated.View
              key={star.id}
              style={[
                styles.star,
                {
                  left: star.x,
                  top: star.y,
                  width: star.size,
                  height: star.size,
                  opacity,
                },
              ]}
            />
          );
        })}

        {moons.map((moon, index) => {
          const translateY = moonAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          });
          const opacity = moonAnimations[index].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.4, 0.7, 0.4],
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.moon,
                {
                  left: moon.x,
                  top: moon.y,
                  width: moon.size,
                  height: moon.size,
                  borderRadius: moon.size / 2,
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deposit Code</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          {/* Generate Code */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(protected)/(tabs)/(home)/generate-code")}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, styles.generateIcon]}>
              <MaterialIcons name="qr-code-2" size={32} color="#007AFF" />
            </View>
            <Text style={styles.actionTitle}>Generate Code</Text>
            <Text style={styles.actionSubtitle}>
              Create a new deposit code with amount, type, and expiry
            </Text>
          </TouchableOpacity>

          {/* View Codes */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(protected)/(tabs)/(home)/deposit-codes-list")}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, styles.viewIcon]}>
              <MaterialIcons name="list" size={32} color="#34C759" />
            </View>
            <Text style={styles.actionTitle}>My Codes</Text>
            <Text style={styles.actionSubtitle}>
              View all your deposit codes with status
            </Text>
          </TouchableOpacity>

          {/* Enter Code */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(protected)/(tabs)/(home)/enter-code")}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, styles.enterIcon]}>
              <MaterialIcons name="keyboard" size={32} color="#FF9500" />
            </View>
            <Text style={styles.actionTitle}>Enter Code</Text>
            <Text style={styles.actionSubtitle}>
              Enter a code to pay or send money
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default DepositCode;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E27",
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  moon: {
    position: "absolute",
    backgroundColor: "#F5F5DC",
    shadowColor: "#F5F5DC",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1F3A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  actionCard: {
    backgroundColor: "#1A1F3A",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2A2F4A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
  },
  generateIcon: {
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    borderColor: "#007AFF",
  },
  viewIcon: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    borderColor: "#34C759",
  },
  enterIcon: {
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    borderColor: "#FF9500",
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    fontWeight: "500",
  },
});

