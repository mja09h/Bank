import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import RocketLoader from "../../../../components/RocketLoader";
import React, { useContext, useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUser } from "../../../../api/auth";
import { getMyTransactions } from "../../../../api/transactions";
import { removeToken } from "../../../../api/storage";
import AuthContext from "../../../../context/authContext";
import { MaterialIcons } from "@expo/vector-icons";
import CustomAlert from "../../../../components/CustomAlert";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Profile Screen Component
 * Displays user profile information, statistics, and account actions
 * Styled with Orbit theme - dark space aesthetic matching the app
 */

const index = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("warning");
  const [alertButtons, setAlertButtons] = useState<Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }>>([]);
  
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getMyTransactions(),
  });

  // Generate star positions (memoized to prevent regeneration)
  const stars = useRef(
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: 2 + Math.random() * 3,
      duration: 1000 + Math.random() * 2000,
    }))
  ).current;

  // Generate moon positions (memoized)
  const moons = useRef([
    { x: SCREEN_WIDTH * 0.15, y: SCREEN_HEIGHT * 0.2, size: 35 },
    { x: SCREEN_WIDTH * 0.8, y: SCREEN_HEIGHT * 0.3, size: 28 },
  ]).current;

  // Animation values for stars and moons
  const starAnimations = useRef(
    stars.map(() => new Animated.Value(Math.random()))
  ).current;
  const moonAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Animate stars twinkling
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

  // Animate moons floating
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

  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationKey: ["logout"],
    mutationFn: async () => {
      await removeToken();
      setIsAuthenticated(false);
      router.replace("/(auth)/login");
    },
    onSuccess: () => {
      console.log("Logged out");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleLogout = () => {
    setAlertTitle("Logout");
    setAlertMessage("Are you sure you want to logout?");
    setAlertType("warning");
    setAlertButtons([
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => setAlertVisible(false),
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          setAlertVisible(false);
          logout();
        },
      },
    ]);
    setAlertVisible(true);
  };

  // Calculate statistics
  const totalTransactions = transactions?.length || 0;
  const depositCount = transactions?.filter((t: any) => t.type === "deposit").length || 0;
  const withdrawCount = transactions?.filter((t: any) => t.type === "withdraw").length || 0;
  const transferCount = transactions?.filter((t: any) => t.type === "transfer").length || 0;

  if (userLoading) {
    return <RocketLoader message="Loading profile..." size="large" />;
  }

  return (
    <View style={styles.container}>
      {/* Animated Background - Stars and Moons */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {/* Animated Stars */}
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

        {/* Animated Moons */}
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
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: user?.image
                  ? "https://react-bank-project.eapi.joincoded.com/" + user.image
                  : undefined,
              }}
              style={styles.profileImage}
            />
            {!user?.image && (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {user?.username?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View style={styles.profileImageBorder} />
          </View>
          <Text style={styles.username}>{user?.username || "User"}</Text>
          <Text style={styles.userEmail}>@{user?.username || "user"}</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Account Balance</Text>
          <Text style={styles.balanceAmount}>{user?.balance || 0} KD</Text>
          <View style={styles.balanceUnderline} />
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconDeposit]}>
              <MaterialIcons name="trending-up" size={24} color="#34C759" />
            </View>
            <Text style={styles.statValue}>{depositCount}</Text>
            <Text style={styles.statLabel}>Deposits</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconWithdraw]}>
              <MaterialIcons name="trending-down" size={24} color="#FF3B30" />
            </View>
            <Text style={styles.statValue}>{withdrawCount}</Text>
            <Text style={styles.statLabel}>Withdrawals</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconTransfer]}>
              <MaterialIcons name="swap-horiz" size={24} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>{transferCount}</Text>
            <Text style={styles.statLabel}>Transfers</Text>
          </View>
        </View>

        {/* Total Transactions Card */}
        <View style={styles.totalTransactionsCard}>
          <View style={styles.totalTransactionsContent}>
            <MaterialIcons name="history" size={28} color="#007AFF" />
            <View style={styles.totalTransactionsText}>
              <Text style={styles.totalTransactionsLabel}>Total Transactions</Text>
              <Text style={styles.totalTransactionsValue}>{totalTransactions}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Edit Profile Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => router.push("/(protected)/(tabs)/(profile)/edit")}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View style={[styles.circularIconContainer, styles.editIconBg]}>
                <MaterialIcons name="edit" size={24} color="#007AFF" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.actionButtonText}>Edit Profile</Text>
                <Text style={styles.actionButtonSubtext}>
                  Update your profile picture
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* View Transactions Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.transactionsButton]}
            onPress={() => router.push("/(protected)/(tabs)/(transactions)")}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View style={[styles.circularIconContainer, styles.transactionsIconBg]}>
                <MaterialIcons name="receipt" size={24} color="#34C759" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.actionButtonText}>View Transactions</Text>
                <Text style={styles.actionButtonSubtext}>
                  See your transaction history
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
            activeOpacity={0.9}
            disabled={isLoggingOut}
          >
            <View style={styles.buttonContent}>
              <View style={[styles.circularIconContainer, styles.logoutIconBg]}>
                <MaterialIcons name="logout" size={24} color="#FF3B30" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.actionButtonText}>
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Text>
                <Text style={styles.actionButtonSubtext}>
                  Sign out of your account
                </Text>
              </View>
              {isLoggingOut && (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 10 }} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        buttons={alertButtons}
        onDismiss={() => setAlertVisible(false)}
      />
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  // Main container with dark space theme background
  container: {
    flex: 1,
    backgroundColor: "#0A0E27", // Deep space dark blue
  },
  // Background container for animated elements
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  // Scroll view for content
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Center container for loading
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  // Animated star style
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    shadowColor: "#FFFFFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  // Animated moon style
  moon: {
    position: "absolute",
    backgroundColor: "#F5F5DC", // Moon color
    shadowColor: "#F5F5DC",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  // Header section
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  // Profile card
  profileCard: {
    backgroundColor: "#1A1F3A", // Dark card background
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#2A2F4A", // Subtle border
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileImageBorder: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: "#007AFF",
    top: -5,
    left: -5,
    opacity: 0.3,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  // Balance card
  balanceCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
    letterSpacing: 1,
  },
  balanceUnderline: {
    width: 60,
    height: 3,
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  // Statistics container
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A1F3A",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2F4A",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
  },
  statIconDeposit: {
    borderColor: "#34C759",
    backgroundColor: "rgba(52, 199, 89, 0.15)",
  },
  statIconWithdraw: {
    borderColor: "#FF3B30",
    backgroundColor: "rgba(255, 59, 48, 0.15)",
  },
  statIconTransfer: {
    borderColor: "#007AFF",
    backgroundColor: "rgba(0, 122, 255, 0.15)",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  // Total transactions card
  totalTransactionsCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  totalTransactionsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalTransactionsText: {
    marginLeft: 16,
    flex: 1,
  },
  totalTransactionsLabel: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
    marginBottom: 4,
  },
  totalTransactionsValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  // Action buttons container
  actionsContainer: {
    flexDirection: "column",
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  // Base action button style
  actionButton: {
    width: "100%",
    backgroundColor: "#1A1F3A",
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: "#2A2F4A",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Button content layout
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Circular icon container
  circularIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    marginRight: 15,
  },
  // Icon background colors
  editIconBg: {
    borderColor: "#007AFF",
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  transactionsIconBg: {
    borderColor: "#34C759",
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    shadowColor: "#34C759",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutIconBg: {
    borderColor: "#FF3B30",
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    shadowColor: "#FF3B30",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  // Text container
  buttonTextContainer: {
    flex: 1,
    flexDirection: "column",
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  // Arrow container
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0A0E27",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2A2F4A",
  },
  // Color-coded button borders
  editButton: {
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
  },
  transactionsButton: {
    borderColor: "#34C759",
    shadowColor: "#34C759",
  },
  logoutButton: {
    borderColor: "#FF3B30",
    shadowColor: "#FF3B30",
  },
});
