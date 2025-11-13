import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getDepositCodeByCode, useDepositCode, DepositCode } from "../../../../api/depositCodes";
import { getUser } from "../../../../api/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transfer } from "../../../../api/transactions";
import CustomAlert from "../../../../components/CustomAlert";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const EnterCode = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [foundCode, setFoundCode] = useState<DepositCode | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("info");
  const [alertButtons, setAlertButtons] = useState<Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }>>([]);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  const { mutate: transferMutation, isPending } = useMutation({
    mutationKey: ["transfer"],
    mutationFn: ({ amount, username }: { amount: number; username: string }) =>
      transfer(amount, username),
    onSuccess: async () => {
      // Transfer successful - now mark the code as used
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      
      // Mark code as used in backend
      if (foundCode) {
        const userId = user?.id || user?._id || user?.username;
        if (userId) {
          useCodeMutation.mutate({ code: foundCode.code, userId });
        }
      }
    },
    onError: async (error: any) => {
      // Transfer failed - don't mark code as used
      setAlertTitle("Payment Failed");
      setAlertMessage(error?.response?.data?.message || "Failed to complete payment. Please try again.");
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
  });

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

  const searchCodeMutation = useMutation({
    mutationKey: ["searchDepositCode"],
    mutationFn: (code: string) => getDepositCodeByCode(code),
    onSuccess: (matchedCode) => {
      // Check status
      if (matchedCode.status !== "pending") {
        const statusMessage = matchedCode.status === "cancelled" 
          ? "This code has been cancelled by the creator."
          : `This code is ${matchedCode.status.toUpperCase()}.`;
        setAlertTitle("Code Not Available");
        setAlertMessage(statusMessage);
        setAlertType("warning");
        setAlertButtons([{ text: "OK" }]);
        setAlertVisible(true);
        setFoundCode(null);
        return;
      }

      setFoundCode(matchedCode);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || "Code not found. Please check and try again.";
      setAlertTitle("Code Not Found");
      setAlertMessage(errorMessage);
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
      setFoundCode(null);
    },
  });

  const handleSearch = () => {
    if (!code || code.trim() === "") {
      setAlertTitle("Missing Code");
      setAlertMessage("Please enter a deposit code.");
      setAlertType("warning");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
      return;
    }

    const searchCode = code.trim();
    searchCodeMutation.mutate(searchCode);
  };

  const useCodeMutation = useMutation({
    mutationKey: ["useDepositCode"],
    mutationFn: ({ code, userId, recipientUsername }: { code: string; userId: string; recipientUsername?: string }) => 
      useDepositCode(code, userId, recipientUsername),
    onSuccess: (data) => {
      console.log("✅ Use Code Response:", JSON.stringify(data, null, 2));
      
      // Check if transfer was successful (for "send" type codes)
      if (foundCode && foundCode.type === "send") {
        // Check transferSuccess - it could be true, "true", or the response might indicate success differently
        const transferSuccess = data.transferSuccess === true || data.transferSuccess === "true" || 
                                (data.transferSuccess !== false && data.transferSuccess !== "false" && 
                                 !data.transferError && data.code?.status === "success");
        
        console.log("Transfer Success Check:", {
          transferSuccess: data.transferSuccess,
          transferError: data.transferError,
          codeStatus: data.code?.status,
          finalResult: transferSuccess
        });
        
        if (transferSuccess) {
          // Transfer successful - refresh user data to see updated balance
          queryClient.invalidateQueries({ queryKey: ["user"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          
          setAlertTitle("Payment Successful");
          setAlertMessage(`Successfully received ${foundCode.amount} KD using code ${foundCode.code}! Your balance has been updated.`);
          setAlertType("success");
        } else {
          setAlertTitle("Transfer Failed");
          setAlertMessage(data.transferError || "The transfer could not be completed. Please contact support.");
          setAlertType("error");
        }
        setAlertButtons([
          {
            text: "OK",
            onPress: () => {
              setAlertVisible(false);
              setCode("");
              setFoundCode(null);
            },
          },
        ]);
        setAlertVisible(true);
      } else {
        // For "get" type codes, transfer was already handled
        setAlertTitle("Payment Successful");
        setAlertMessage(`Successfully transferred ${foundCode?.amount || 0} KD using code ${foundCode?.code}!`);
        setAlertType("success");
        setAlertButtons([
          {
            text: "OK",
            onPress: () => {
              setAlertVisible(false);
              setCode("");
              setFoundCode(null);
            },
          },
        ]);
        setAlertVisible(true);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || "Failed to mark code as used. Please try again.";
      setAlertTitle("Error");
      setAlertMessage(errorMessage);
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
  });

  const handlePay = () => {
    if (!foundCode || !user) return;

    const userId = user.id || user._id || user.username;
    if (!userId) {
      setAlertTitle("Error");
      setAlertMessage("User information not available. Please try again.");
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
      return;
    }

    if (!foundCode.recipientId) {
      setAlertTitle("Error");
      setAlertMessage("Cannot process code. Missing recipient information.");
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
      return;
    }

    // If code type is "get", the code creator wants to receive money
    // So current user sends money to the code creator
    // If code type is "send", the code creator wants to send money
    // So code creator sends money to current user (via backend)
    
    if (foundCode.type === "get") {
      // Process transfer FIRST, then mark code as used
      // This ensures the money is transferred before marking the code as used
      transferMutation({
        amount: foundCode.amount,
        username: foundCode.recipientId,
      });
    } else {
      // For "send" type, the code creator sends money to current user
      // First mark the code as used, then the backend will return transfer info
      const currentUsername = user?.username;
      if (!currentUsername) {
        setAlertTitle("Error");
        setAlertMessage("User information not available. Please try again.");
        setAlertType("error");
        setAlertButtons([{ text: "OK" }]);
        setAlertVisible(true);
        return;
      }
      
      // Use the code - backend will return transfer info for "send" type codes
      useCodeMutation.mutate({ 
        code: foundCode.code, 
        userId,
        recipientUsername: currentUsername 
      });
    }
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
          <Text style={styles.headerTitle}>Enter Code</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Code Input */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>Deposit Code</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="qr-code-2" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#8E8E93"
              value={code}
              onChangeText={setCode}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
          <TouchableOpacity
            style={[styles.searchButton, searchCodeMutation.isPending && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={searchCodeMutation.isPending}
            activeOpacity={0.8}
          >
            {searchCodeMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="search" size={20} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Search Code</Text>
              </>
            )}
          </TouchableOpacity>
          
        </View>

        {/* Code Details */}
        {foundCode && (
          <View style={styles.codeDetailsCard}>
            <Text style={styles.cardTitle}>Code Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Code:</Text>
              <Text style={styles.detailValue}>{foundCode.code}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>{foundCode.amount} KD</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>
                {foundCode.type === "get" ? "To Get (Receive)" : "To Send"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, { color: "#FF9500" }]}>
                {foundCode.status.toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.payButton, isPending && styles.payButtonDisabled]}
              onPress={handlePay}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="payment" size={20} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>
                    {foundCode.type === "get" ? "Receive" : "Send"} {foundCode.amount} KD
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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

export default EnterCode;

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
  inputCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2A2F4A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0E27",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2F4A",
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 2,
  },
  searchButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  codeDetailsCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  payButton: {
    backgroundColor: "#34C759",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  debugButton: {
    backgroundColor: "#8E8E93",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: "center",
  },
  debugButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

