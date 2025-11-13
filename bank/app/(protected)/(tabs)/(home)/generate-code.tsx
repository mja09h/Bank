import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createDepositCode, DepositCode } from "../../../../api/depositCodes";
import { getUser } from "../../../../api/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import CustomAlert from "../../../../components/CustomAlert";
import * as Clipboard from "expo-clipboard";
import { getToken } from "../../../../api/storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const GenerateCode = () => {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"get" | "send">("get");
  const [expiryDays, setExpiryDays] = useState("7");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("info");
  const [alertButtons, setAlertButtons] = useState<Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }>>([]);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
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

  const { mutate: createCodeMutation, isPending } = useMutation({
    mutationKey: ["createDepositCode"],
    mutationFn: (data: { userId: string; amount: number; type: 'get' | 'send'; expiryDays: number; creatorToken?: string }) =>
      createDepositCode(data),
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      Clipboard.setStringAsync(data.code);
      setAlertTitle("Code Generated");
      setAlertMessage(`Your deposit code ${data.code} has been generated and copied to clipboard!`);
      setAlertType("success");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
    onError: (error: any) => {
      setAlertTitle("Error");
      setAlertMessage(error?.response?.data?.error || "Failed to generate code. Please try again.");
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
  });

  const handleGenerate = async () => {
    if (!amount || amount.trim() === "") {
      setAlertTitle("Missing Amount");
      setAlertMessage("Please enter an amount.");
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

    const days = parseInt(expiryDays);
    if (isNaN(days) || days <= 0) {
      setAlertTitle("Invalid Expiry");
      setAlertMessage("Please enter a valid number of days.");
      setAlertType("warning");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
      return;
    }

    const userId = user?.id || user?._id || user?.username;
    if (!userId) {
      setAlertTitle("Error");
      setAlertMessage("User information not available. Please try again.");
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
      return;
    }

    // For "send" type codes, we need to store the creator's token
    let creatorToken = undefined;
    if (type === "send") {
      creatorToken = await getToken();
      console.log("Retrieved token for send code:", creatorToken ? `${creatorToken.substring(0, 20)}...` : "null");
      if (!creatorToken) {
        setAlertTitle("Error");
        setAlertMessage("Authentication token not available. Please login again.");
        setAlertType("error");
        setAlertButtons([{ text: "OK" }]);
        setAlertVisible(true);
        return;
      }
    }

    const mutationData = {
      userId,
      amount: numAmount,
      type,
      expiryDays: days,
      ...(creatorToken && { creatorToken }), // Only include if token exists
    };
    
    console.log("Creating code with data:", { ...mutationData, creatorToken: creatorToken ? `${creatorToken.substring(0, 20)}...` : "none" });

    createCodeMutation(mutationData);
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
          <Text style={styles.headerTitle}>Generate Code</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (KD)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="attach-money" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor="#8E8E93"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, type === "get" && styles.typeButtonActive]}
                onPress={() => setType("get")}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="arrow-downward"
                  size={24}
                  color={type === "get" ? "#FFFFFF" : "#8E8E93"}
                />
                <Text style={[styles.typeButtonText, type === "get" && styles.typeButtonTextActive]}>
                  To Get (Receive)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === "send" && styles.typeButtonActive]}
                onPress={() => setType("send")}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="arrow-upward"
                  size={24}
                  color={type === "send" ? "#FFFFFF" : "#8E8E93"}
                />
                <Text style={[styles.typeButtonText, type === "send" && styles.typeButtonTextActive]}>
                  To Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Expiry Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expiry (Days)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="calendar-today" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter days (e.g., 7)"
                placeholderTextColor="#8E8E93"
                value={expiryDays}
                onChangeText={setExpiryDays}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, isPending && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="qr-code-2" size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generate Code</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Generated Code Display */}
          {generatedCode && (
            <View style={styles.codeDisplayCard}>
              <Text style={styles.codeLabel}>Generated Code</Text>
              <Text style={styles.codeValue}>{generatedCode}</Text>
              <Text style={styles.codeHint}>Code copied to clipboard</Text>
            </View>
          )}
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

export default GenerateCode;

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
  formCard: {
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
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
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  typeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: "#0A0E27",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2A2F4A",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  typeButtonTextActive: {
    color: "#FFFFFF",
  },
  generateButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  codeDisplayCard: {
    marginTop: 24,
    backgroundColor: "#0A0E27",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#007AFF",
    letterSpacing: 4,
    marginBottom: 8,
  },
  codeHint: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
});

