import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getDepositCodes, DepositCode } from "../../../../api/storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DepositCodesList = () => {
  const router = useRouter();
  const [codes, setCodes] = useState<DepositCode[]>([]);
  const [loading, setLoading] = useState(true);

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

  const moons = useRef([
    { x: SCREEN_WIDTH * 0.15, y: SCREEN_HEIGHT * 0.2, size: 35 },
    { x: SCREEN_WIDTH * 0.8, y: SCREEN_HEIGHT * 0.3, size: 28 },
  ]).current;

  const starAnimations = useRef(
    stars.map(() => new Animated.Value(Math.random()))
  ).current;
  const moonAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

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

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    const allCodes = await getDepositCodes();
    // Check expiry and update status
    const now = new Date();
    const updatedCodes = allCodes.map((code) => {
      const expiryDate = new Date(code.expiryDate);
      if (expiryDate < now && code.status === "pending") {
        return { ...code, status: "expired" as const };
      }
      return code;
    });
    // Sort by newest first
    updatedCodes.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setCodes(updatedCodes);
    setLoading(false);
  };

  const getStatusColor = (status: DepositCode["status"]) => {
    switch (status) {
      case "success":
        return "#34C759";
      case "failed":
        return "#FF3B30";
      case "expired":
        return "#8E8E93";
      case "pending":
        return "#FF9500";
      default:
        return "#8E8E93";
    }
  };

  const getStatusIcon = (status: DepositCode["status"]) => {
    switch (status) {
      case "success":
        return "check-circle";
      case "failed":
        return "error";
      case "expired":
        return "schedule";
      case "pending":
        return "pending";
      default:
        return "help";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
          <Text style={styles.headerTitle}>My Deposit Codes</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadCodes}
            activeOpacity={0.7}
          >
            <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Codes List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : codes.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialIcons name="qr-code-2" size={64} color="#8E8E93" />
            <Text style={styles.emptyText}>No deposit codes yet</Text>
            <Text style={styles.emptySubtext}>Generate a code to get started</Text>
          </View>
        ) : (
          <View style={styles.codesContainer}>
            {codes.map((code) => (
              <View key={code.id} style={styles.codeCard}>
                <View style={styles.codeHeader}>
                  <View style={styles.codeInfo}>
                    <Text style={styles.codeValue}>{code.code}</Text>
                    <Text style={styles.codeAmount}>{code.amount} KD</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(code.status) + "20", borderColor: getStatusColor(code.status) },
                    ]}
                  >
                    <MaterialIcons
                      name={getStatusIcon(code.status) as any}
                      size={16}
                      color={getStatusColor(code.status)}
                    />
                    <Text
                      style={[styles.statusText, { color: getStatusColor(code.status) }]}
                    >
                      {code.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.codeDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons
                      name={code.type === "get" ? "arrow-downward" : "arrow-upward"}
                      size={16}
                      color={code.type === "get" ? "#34C759" : "#FF9500"}
                    />
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>
                      {code.type === "get" ? "To Get (Receive)" : "To Send"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialIcons name="calendar-today" size={16} color="#8E8E93" />
                    <Text style={styles.detailLabel}>Expires:</Text>
                    <Text style={styles.detailValue}>{formatDate(code.expiryDate)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialIcons name="access-time" size={16} color="#8E8E93" />
                    <Text style={styles.detailLabel}>Created:</Text>
                    <Text style={styles.detailValue}>{formatDate(code.createdAt)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default DepositCodesList;

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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1F3A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  codesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  codeCard: {
    backgroundColor: "#1A1F3A",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2A2F4A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  codeInfo: {
    flex: 1,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#007AFF",
    letterSpacing: 2,
    marginBottom: 4,
  },
  codeAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  codeDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

