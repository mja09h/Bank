import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import React, { useContext, useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { login as loginUser } from "../../api/auth";
import UserInfo from "../../types/userInfo";
import { storeToken } from "../../api/storage";
import { Redirect, useRouter } from "expo-router";
import AuthContext from "../../context/authContext";
import { MaterialIcons } from "@expo/vector-icons";
import CustomAlert from "../../components/CustomAlert";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const login = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)/(home)" />
  }
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("error");
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

  const { mutate: loginMutation, isPending } = useMutation({
    mutationKey: ["login"],
    mutationFn: (userInfo: UserInfo) => loginUser(userInfo),
    onSuccess: async (data) => {
      await storeToken(data.token);
      setIsAuthenticated(true);
      router.replace("/(protected)/(tabs)/(home)");
    },
    onError: (error: any) => {
      setAlertTitle("Login Failed");
      setAlertMessage(error?.response?.data?.message || "Invalid username or password. Please try again.");
      setAlertType("error");
      setAlertButtons([
        {
          text: "OK",
          onPress: () => setAlertVisible(false),
        },
      ]);
      setAlertVisible(true);
    },
  });

  const handleLogin = () => {
    if (username && password) {
      loginMutation({ username, password });
    } else {
      setAlertTitle("Missing Information");
      setAlertMessage("Please enter both username and password.");
      setAlertType("warning");
      setAlertButtons([
        {
          text: "OK",
          onPress: () => setAlertVisible(false),
        },
      ]);
      setAlertVisible(true);
    }
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#8E8E93"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8E8E93"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isPending && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Login</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            style={styles.registerLink}
            activeOpacity={0.8}
          >
            <Text style={styles.registerLinkText}>
              Don't have an account? <Text style={styles.registerLinkBold}>Register here</Text>
            </Text>
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

export default login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E27", // Deep space dark blue
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
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
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
  header: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  formCard: {
    backgroundColor: "#1A1F3A", // Dark card background
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0E27",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2F4A",
    marginBottom: 16,
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
  loginButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  registerLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  registerLinkText: {
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "500",
  },
  registerLinkBold: {
    color: "#007AFF",
    fontWeight: "700",
  },
});
