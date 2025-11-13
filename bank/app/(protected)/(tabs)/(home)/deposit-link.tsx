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
import { getUser, getUserById } from "../../../../api/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import CustomAlert from "../../../../components/CustomAlert";
import RocketLoader from "../../../../components/RocketLoader";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DepositLink = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  
  // Extract query parameters
  const userId = params.userId 
    ? (Array.isArray(params.userId) ? params.userId[0] : params.userId)
    : undefined;
  const amountParam = params.amount
    ? (Array.isArray(params.amount) ? params.amount[0] : params.amount)
    : undefined;

  const [amount, setAmount] = useState(amountParam || "");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("info");
  const [alertButtons, setAlertButtons] = useState<Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }>>([]);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  // Get target user (link owner)
  const { data: targetUser, isLoading: targetUserLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId || ""),
    enabled: !!userId,
  });

  // Check if current user is the link creator
  const isCreator = currentUser && userId && (
    currentUser.id === userId || 
    currentUser._id === userId || 
    currentUser.username === userId
  );

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

  // Update amount when param changes
  useEffect(() => {
    if (amountParam) {
      setAmount(amountParam);
    }
  }, [amountParam]);

  const { mutate: transferMutation, isPending } = useMutation({
    mutationKey: ["transfer"],
    mutationFn: ({ amount, username }: { amount: number; username: string }) =>
      transfer(amount, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setAlertTitle("Transfer Successful");
      setAlertMessage(`Successfully transferred ${amount} KD to ${targetUser?.username || "user"}`);
      setAlertType("success");
      setAlertButtons([
        {
          text: "OK",
          onPress: () => {
            setAlertVisible(false);
            router.back();
          },
        },
      ]);
      setAlertVisible(true);
    },
    onError: (error: any) => {
      setAlertTitle("Transfer Failed");
      setAlertMessage(error?.response?.data?.message || "Failed to complete transfer. Please try again.");
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
  });

  const handleTransfer = () => {
    if (!amount || amount.trim() === "") {
      setAlertTitle("Missing Amount");
      setAlertMessage("Please enter an amount to transfer.");
      setAlertType("warning");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAlertTitle("Invalid Amount");
      setAlertMessage("Please enter a valid amount greater than 0.");
      setAlertType("warning");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
      return;
    }

    if (!targetUser?.username) {
      setAlertTitle("Error");
      setAlertMessage("Unable to find recipient. Please try again.");
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
      return;
    }

    transferMutation({ amount: numAmount, username: targetUser.username });
  };

  if (targetUserLoading) {
    return <RocketLoader message="Loading..." size="large" />;
  }

  if (!userId || !targetUser) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Invalid Link</Text>
          <Text style={styles.errorText}>This deposit link is invalid or expired.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
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

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isCreator ? "Edit Deposit Link" : "Deposit Link"}
          </Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Owner Card */}
        <View style={styles.ownerCard}>
          <Text style={styles.cardTitle}>Account Owner</Text>
          <View style={styles.ownerInfo}>
            {targetUser.image && targetUser.image.trim() !== "" ? (
              <Image
                source={{
                  uri: "https://react-bank-project.eapi.joincoded.com/" + targetUser.image,
                }}
                style={styles.ownerImage}
              />
            ) : (
              <View style={styles.ownerImagePlaceholder}>
                <Text style={styles.ownerImagePlaceholderText}>
                  {targetUser.username?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View style={styles.ownerDetails}>
              <Text style={styles.ownerUsername}>{targetUser.username || "Unknown"}</Text>
              <Text style={styles.ownerBalance}>Balance: {targetUser.balance || 0} KD</Text>
            </View>
          </View>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.cardTitle}>Amount</Text>
          {isCreator ? (
            <View style={styles.amountInputContainer}>
              <MaterialIcons name="attach-money" size={24} color="#007AFF" style={styles.inputIcon} />
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount"
                placeholderTextColor="#8E8E93"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
          ) : (
            <View style={styles.amountDisplayContainer}>
              <Text style={styles.amountDisplay}>{amount || "0"} KD</Text>
              <Text style={styles.amountSubtext}>Amount to transfer</Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        {!isCreator && (
          <TouchableOpacity
            style={[styles.transferButton, isPending && styles.transferButtonDisabled]}
            onPress={handleTransfer}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.transferButtonText}>Transfer {amount || "0"} KD</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isCreator && (
          <>
            <View style={styles.creatorInfoCard}>
              <MaterialIcons name="info-outline" size={24} color="#007AFF" />
              <Text style={styles.creatorInfoText}>
                You are the owner of this link. Edit the amount above and share the updated link with others to receive payments.
              </Text>
            </View>
            <View style={styles.howItWorksCard}>
              <Text style={styles.howItWorksTitle}>How it works:</Text>
              <View style={styles.stepContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Share this link with anyone who wants to send you money</Text>
              </View>
              <View style={styles.stepContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>They open the link and see the amount to transfer</Text>
              </View>
              <View style={styles.stepContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>They click "Transfer" and the money is sent to your account</Text>
              </View>
            </View>
          </>
        )}
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

export default DepositLink;

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
  moon: {
    position: "absolute",
    backgroundColor: "#F5F5DC",
    shadowColor: "#F5F5DC",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  ownerCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginRight: 16,
  },
  ownerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  ownerImagePlaceholderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  ownerDetails: {
    flex: 1,
  },
  ownerUsername: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  ownerBalance: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  amountCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
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
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0E27",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2F4A",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  amountDisplayContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 8,
  },
  amountSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  transferButton: {
    backgroundColor: "#007AFF",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  transferButtonDisabled: {
    opacity: 0.6,
  },
  transferButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  creatorInfoCard: {
    backgroundColor: "rgba(0, 122, 255, 0.15)",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  creatorInfoText: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  howItWorksCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
    fontWeight: "500",
  },
});

