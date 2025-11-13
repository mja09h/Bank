import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transfer } from "../../../../api/transactions";
import { getUser, getAllUsers } from "../../../../api/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import CustomAlert from "../../../../components/CustomAlert";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * User Detail Screen Component
 * Displays user information and allows transferring money to this user
 * Styled with Orbit theme - dark space aesthetic matching the app
 */
const UserDetail = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("info");
  const [alertButtons, setAlertButtons] = useState<Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }>>([]);

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

  // Fetch current user balance
  const { data: currentUser } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  // Fetch all users to find the target user
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
  });

  // Find the target user from the users list
  const allUsers = usersData
    ? Array.isArray(usersData)
      ? usersData
      : usersData?.users || usersData?.data || []
    : [];

  const targetUser = allUsers.find(
    (u: any) => u.id === userId || u._id === userId || u.username === userId
  );

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: ({ amount, username }: { amount: number; username: string }) =>
      transfer(amount, username),
    onSuccess: () => {
      // Invalidate queries to refresh user balance and users list
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setAlertTitle("Success");
      setAlertMessage("Transfer completed successfully!");
      setAlertType("success");
      setAlertButtons([
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
      setAlertVisible(true);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message ||
        "Failed to transfer funds. Please try again.";
      setError(errorMessage);
      setAlertTitle("Transfer Failed");
      setAlertMessage(errorMessage);
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
  });

  const handleTransfer = () => {
    setError("");

    if (!targetUser) {
      setError("User not found");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (currentUser?.balance && amountNum > currentUser.balance) {
      setError("Insufficient balance");
      return;
    }

    transferMutation.mutate({
      amount: amountNum,
      username: targetUser.username,
    });
  };

  const isTransferPending = transferMutation.isPending;

  if (!targetUser) {
    return (
      <View style={styles.container}>
        {/* Animated Background - Stars and Moons */}
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Not Found</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </View>
    );
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer to User</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          {targetUser?.image && targetUser.image.trim() !== "" ? (
            <Image
              source={{
                uri:
                  "https://react-bank-project.eapi.joincoded.com/" +
                  targetUser.image,
              }}
              style={styles.userImage}
              onError={() => {
                // If image fails to load, it will fallback to placeholder
              }}
            />
          ) : (
            <View style={styles.userImagePlaceholder}>
              <Text style={styles.userImagePlaceholderText}>
                {targetUser.username?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>{targetUser.username}</Text>
          <Text style={styles.userBalance}>
            Balance: {targetUser.balance || 0} KD
          </Text>
        </View>

        {/* Balance Info */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {currentUser?.balance || 0} KD
          </Text>
        </View>

        {/* Amount Input Section */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionTitle}>Enter Amount</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#8E8E93"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              setError("");
            }}
            keyboardType="numeric"
            editable={!isTransferPending}
          />
          <Text style={styles.currencyLabel}>KD</Text>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountContainer}>
            {[50, 100, 200, 500].map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  currentUser?.balance &&
                    quickAmount > currentUser.balance &&
                    styles.quickAmountButtonDisabled,
                  amount === quickAmount.toString() &&
                    styles.quickAmountButtonActive,
                ]}
                onPress={() => {
                  if (
                    !currentUser?.balance ||
                    quickAmount <= currentUser.balance
                  ) {
                    setAmount(quickAmount.toString());
                    setError("");
                  }
                }}
                disabled={
                  isTransferPending ||
                  (currentUser?.balance && quickAmount > currentUser.balance)
                }
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    currentUser?.balance &&
                      quickAmount > currentUser.balance &&
                      styles.quickAmountTextDisabled,
                    amount === quickAmount.toString() &&
                      styles.quickAmountTextActive,
                  ]}
                >
                  {quickAmount} KD
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.transferButton,
              isTransferPending && styles.transferButtonDisabled,
            ]}
            onPress={handleTransfer}
            disabled={isTransferPending}
          >
            {isTransferPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.transferButtonText}>Transfer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Alert */}
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

export default UserDetail;

const styles = StyleSheet.create({
  // Main container with dark space theme background
  container: {
    flex: 1,
    backgroundColor: "#0A0E27", // Dark space background
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
  scrollView: {
    flex: 1,
    zIndex: 1,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1F3A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  // User info card
  userCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#007AFF",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  userImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  userImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  userImagePlaceholderText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  userBalance: {
    fontSize: 16,
    color: "#8E8E93",
  },
  // Balance card
  balanceCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#34C759",
    alignItems: "center",
    shadowColor: "#34C759",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#34C759",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#34C759",
    letterSpacing: 0.5,
  },
  // Amount section
  amountSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  amountInput: {
    backgroundColor: "#1A1F3A",
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#007AFF",
    textAlign: "center",
    marginBottom: 20,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  currencyLabel: {
    fontSize: 18,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 20,
  },
  quickAmountContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  quickAmountButton: {
    backgroundColor: "#1A1F3A",
    borderWidth: 1,
    borderColor: "#2A2F4A",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  quickAmountButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  quickAmountButtonDisabled: {
    opacity: 0.3,
  },
  quickAmountText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  quickAmountTextActive: {
    color: "#FFFFFF",
  },
  quickAmountTextDisabled: {
    color: "#8E8E93",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  transferButton: {
    backgroundColor: "#007AFF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  transferButtonDisabled: {
    opacity: 0.6,
  },
  transferButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    zIndex: 1,
  },
});
