import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deposit, withdraw, getMyTransactions } from "../../../../api/transactions";
import { getUser, getUserById } from "../../../../api/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, router } from "expo-router";
import CustomAlert from "../../../../components/CustomAlert";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Home Screen Component
 * Displays user balance and transaction options (Deposit, Withdraw, Transfer)
 * Styled with Orbit theme - dark space aesthetic matching the logo
 */

const index = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("info");
  const [alertButtons, setAlertButtons] = useState<Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }>>([]);

  // Generate star positions (memoized to prevent regeneration)
  const stars = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: 2 + Math.random() * 3,
      duration: 1000 + Math.random() * 2000,
    }))
  ).current;

  // Generate moon positions (memoized)
  const moons = useRef([
    { x: SCREEN_WIDTH * 0.1, y: SCREEN_HEIGHT * 0.15, size: 40 },
    { x: SCREEN_WIDTH * 0.85, y: SCREEN_HEIGHT * 0.25, size: 30 },
    { x: SCREEN_WIDTH * 0.5, y: SCREEN_HEIGHT * 0.1, size: 25 },
  ]).current;

  // Animation values for stars and moons
  const starAnimations = useRef(
    stars.map(() => new Animated.Value(Math.random()))
  ).current;
  const moonAnimations = useRef([
    new Animated.Value(0),
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

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  // Fetch transactions to get recent transfers
  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getMyTransactions(),
  });

  // Get recent transfer transactions (last 5 unique users)
  const recentTransferUserIds = useMemo(() => {
    if (!transactions) return [];
    
    // Filter transfer transactions and get unique "to" user IDs
    const transferTransactions = transactions
      .filter((t: any) => t.type === "transfer")
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Newest first
      });

    // Get unique user IDs (toUserId or to)
    const uniqueUserIds: string[] = [];
    const seenIds = new Set<string>();
    
    for (const transaction of transferTransactions) {
      const toUserId = (transaction as any).toUserId || (transaction as any).to;
      if (toUserId && !seenIds.has(String(toUserId))) {
        uniqueUserIds.push(String(toUserId));
        seenIds.add(String(toUserId));
        if (uniqueUserIds.length >= 5) break; // Limit to 5 recent users
      }
    }
    
    return uniqueUserIds;
  }, [transactions]);

  const { mutate: depositMutation, isPending: isDepositPending } = useMutation({
    mutationKey: ["deposit"],
    mutationFn: (amount: number) => deposit(amount),
    onSuccess: () => {
      setDepositModalVisible(false);
      setAmount("");
      setError("");
      // Invalidate queries to refresh data across the app
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setAlertTitle("Success");
      setAlertMessage("Funds deposited successfully!");
      setAlertType("success");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
    onError: (error: any) => {
      setAlertTitle("Deposit Failed");
      setAlertMessage(error.response?.data?.message || "Failed to deposit funds");
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
  });

  const { mutate: withdrawMutation, isPending: isWithdrawPending } =
    useMutation({
      mutationKey: ["withdraw"],
      mutationFn: (amount: number) => withdraw(amount),
      onSuccess: () => {
        setWithdrawModalVisible(false);
        setAmount("");
        setError("");
      // Invalidate queries to refresh data across the app
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setAlertTitle("Success");
      setAlertMessage("Funds withdrawn successfully!");
      setAlertType("success");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
    onError: (error: any) => {
      setAlertTitle("Withdraw Failed");
      setAlertMessage(error.response?.data?.message || "Failed to withdraw funds");
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
    });

  const validateAmount = (isWithdraw: boolean = false): boolean => {
    if (!amount || amount.trim() === "") {
      setError("Amount is required");
      return false;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setError("Please enter a valid number");
      return false;
    }

    if (numAmount <= 0) {
      setError("Amount must be greater than 0");
      return false;
    }

    if (isWithdraw && user?.balance !== undefined) {
      if (numAmount > user.balance) {
        setError("Insufficient balance");
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleDeposit = () => {
    if (validateAmount(false)) {
      depositMutation(parseFloat(amount));
    }
  };

  const handleWithdraw = () => {
    if (validateAmount(true)) {
      withdrawMutation(parseFloat(amount));
    }
  };

  const handleCloseDepositModal = () => {
    setDepositModalVisible(false);
    setAmount("");
    setError("");
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawModalVisible(false);
    setAmount("");
    setError("");
  };

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
      >
        {/* Header Section with Orbit Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../../assets/orbit-logo-23.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeText}>Welcome Back</Text>
        </View>

        {/* Balance Card - Dark themed card displaying user balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceAmount}>{user?.balance || 0} KD</Text>
          <View style={styles.balanceUnderline} />
        </View>

        {/* Action Buttons Container - Stacked vertically with 360-degree style */}
        <View style={styles.actionsContainer}>
          {/* Deposit Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.depositButton]}
            onPress={() => setDepositModalVisible(true)}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View
                style={[styles.circularIconContainer, styles.depositIconBg]}
              >
                <MaterialIcons
                  name="account-balance-wallet"
                  size={32}
                  color="#34C759"
                />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.actionButtonText}>Deposit</Text>
                <Text style={styles.actionButtonSubtext}>
                  Add funds to your account
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Withdraw Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => setWithdrawModalVisible(true)}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View
                style={[styles.circularIconContainer, styles.withdrawIconBg]}
              >
                <MaterialIcons
                  name="account-balance"
                  size={32}
                  color="#FF3B30"
                />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.actionButtonText}>Withdraw</Text>
                <Text style={styles.actionButtonSubtext}>
                  Take money from your account
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Transfer Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.transferButton]}
            onPress={() => {
              console.log("Transfer button clicked");
              router.push("/(protected)/(tabs)/(home)/transfer");
            }}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View
                style={[styles.circularIconContainer, styles.transferIconBg]}
              >
                <MaterialIcons name="send" size={32} color="#007AFF" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.actionButtonText}>Transfer</Text>
                <Text style={styles.actionButtonSubtext}>
                  Send money to another user
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Transfers Section */}
        {recentTransferUserIds.length > 0 && (
          <View style={styles.recentTransfersContainer}>
            <Text style={styles.recentTransfersTitle}>Recent Transfers</Text>
            <Text style={styles.recentTransfersSubtitle}>
              Users you recently transferred to
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentTransfersScroll}
            >
              {recentTransferUserIds.map((userId) => (
                <RecentTransferUser key={userId} userId={userId} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Deposit Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={depositModalVisible}
          onRequestClose={handleCloseDepositModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Deposit Funds</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor="#8E8E93"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  setError("");
                }}
                keyboardType="numeric"
                editable={!isDepositPending}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCloseDepositModal}
                  disabled={isDepositPending}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.depositButtonModal,
                    isDepositPending && styles.buttonDisabled,
                  ]}
                  onPress={handleDeposit}
                  disabled={isDepositPending}
                >
                  {isDepositPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Deposit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Withdraw Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={withdrawModalVisible}
          onRequestClose={handleCloseWithdrawModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor="#8E8E93"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  setError("");
                }}
                keyboardType="numeric"
                editable={!isWithdrawPending}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCloseWithdrawModal}
                  disabled={isWithdrawPending}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.withdrawButtonModal,
                    isWithdrawPending && styles.buttonDisabled,
                  ]}
                  onPress={handleWithdraw}
                  disabled={isWithdrawPending}
                >
                  {isWithdrawPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Withdraw</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Custom Alert - Outside ScrollView for proper overlay */}
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

// Recent Transfer User Component
const RecentTransferUser = ({ userId }: { userId: string }) => {
  const router = useRouter();
  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <View style={styles.recentUserCard}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <TouchableOpacity
      style={styles.recentUserCard}
      onPress={() => router.push(`/(protected)/(tabs)/(users)/${userId}`)}
      activeOpacity={0.8}
    >
      {user.image && user.image.trim() !== "" ? (
        <Image
          source={{
            uri: "https://react-bank-project.eapi.joincoded.com/" + user.image,
          }}
          style={styles.recentUserImage}
          onError={() => {
            // If image fails to load, it will fallback to placeholder
          }}
        />
      ) : (
        <View style={styles.recentUserImagePlaceholder}>
          <Text style={styles.recentUserImagePlaceholderText}>
            {user.username?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
      )}
      <Text style={styles.recentUserName} numberOfLines={1}>
        {user.username || "Unknown"}
      </Text>
    </TouchableOpacity>
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
    paddingBottom: 30,
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
  // Header section with logo
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  // Balance card - dark themed card with shadow
  balanceCard: {
    backgroundColor: "#1A1F3A", // Dark card background
    marginHorizontal: 20,
    marginBottom: 30,
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
  balanceLabel: {
    fontSize: 14,
    color: "#8E8E93", // Gray text
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
    backgroundColor: "#007AFF", // Blue accent
    borderRadius: 2,
  },
  // Action buttons container - stacked vertically
  actionsContainer: {
    flexDirection: "column",
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  // Base action button style - 360-degree circular design
  actionButton: {
    width: "100%",
    backgroundColor: "#1A1F3A", // Dark card background
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
  // Circular icon container - 360-degree style
  circularIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35, // Perfect circle
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    marginRight: 15,
  },
  // Icon background colors with circular design
  depositIconBg: {
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
  withdrawIconBg: {
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
  transferIconBg: {
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
  // Color-coded button borders with 360-degree circular style
  depositButton: {
    borderColor: "#34C759", // Green for deposit
    shadowColor: "#34C759",
  },
  withdrawButton: {
    borderColor: "#FF3B30", // Red for withdraw
    shadowColor: "#FF3B30",
  },
  transferButton: {
    borderColor: "#007AFF", // Blue for transfer
    shadowColor: "#007AFF",
  },
  // Modal styles - dark theme
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Dark overlay
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1F3A", // Dark modal background
    borderRadius: 20,
    padding: 25,
    width: "85%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2A2F4A",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: "#0A0E27", // Dark input background
    color: "#FFFFFF",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#8E8E93",
  },
  depositButtonModal: {
    backgroundColor: "#007AFF",
  },
  withdrawButtonModal: {
    backgroundColor: "#FF3B30",
  },
  transferButtonModal: {
    backgroundColor: "#34C759",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Recent Transfers Section
  recentTransfersContainer: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  recentTransfersTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  recentTransfersSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 16,
    fontWeight: "500",
  },
  recentTransfersScroll: {
    gap: 12,
    paddingRight: 20,
  },
  recentUserCard: {
    backgroundColor: "#1A1F3A",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    minWidth: 100,
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
  recentUserImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginBottom: 8,
  },
  recentUserImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  recentUserImagePlaceholderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  recentUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
});
