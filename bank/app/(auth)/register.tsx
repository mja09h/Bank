import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import React, { useContext, useState, useEffect, useRef } from "react";
import UserInfo from "../../types/userInfo";
import { useMutation } from "@tanstack/react-query";
import { register } from "../../api/auth";
import * as ImagePicker from "expo-image-picker";
import { Redirect, useRouter } from "expo-router";
import AuthContext from "../../context/authContext";
import { storeToken } from "../../api/storage";
import { MaterialIcons } from "@expo/vector-icons";
import CustomAlert from "../../components/CustomAlert";
import { Formik } from "formik";
import * as Yup from "yup";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Validation schema
const registerSchema = Yup.object().shape({
  username: Yup.string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  image: Yup.string()
    .required("Profile image is required"),
});

const Register = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)/(home)" />;
  }
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

  const { mutate: registerMutation, isPending } = useMutation({
    mutationKey: ["register"],
    mutationFn: (userInfo: UserInfo) => register(userInfo),
    onSuccess: async (data) => {
      await storeToken(data.token);
      setIsAuthenticated(true);
      router.replace("/(protected)/(tabs)/(home)");
    },
    onError: (error: any) => {
      console.log(error);
      setAlertTitle("Registration Failed");
      setAlertMessage(error?.response?.data?.message || "An error occurred during registration. Please try again.");
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

  const pickImage = async (setFieldValue: (field: string, value: string) => void) => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log("result in pickImage", result);

    if (!result.canceled) {
      setFieldValue("image", result.assets[0].uri);
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
          <Image 
            source={require("../../assets/orbit-logo-24.png")} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us and start banking</Text>
        </View>

        {/* Form Card */}
        <Formik
          initialValues={{ username: "", password: "", image: "" }}
          validationSchema={registerSchema}
          onSubmit={(values) => {
            registerMutation({ username: values.username, password: values.password, image: values.image });
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
            <View style={styles.formCard}>
              {/* Username Input */}
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  errors.username && touched.username && styles.inputContainerError
                ]}>
                  <MaterialIcons name="person" size={20} color={errors.username && touched.username ? "#FF3B30" : "#8E8E93"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#8E8E93"
                    value={values.username}
                    onChangeText={handleChange("username")}
                    onBlur={handleBlur("username")}
                    autoCapitalize="none"
                  />
                </View>
                {errors.username && touched.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  errors.password && touched.password && styles.inputContainerError
                ]}>
                  <MaterialIcons name="lock" size={20} color={errors.password && touched.password ? "#FF3B30" : "#8E8E93"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#8E8E93"
                    value={values.password}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
                {errors.password && touched.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Profile Image Picker */}
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity 
                  onPress={() => pickImage(setFieldValue)} 
                  activeOpacity={0.8} 
                  style={styles.imagePickerButton}
                >
                  {values.image ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: values.image }} style={styles.imagePreview} />
                      <View style={styles.imageEditBadge}>
                        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialIcons name="add-a-photo" size={64} color="#007AFF" />
                      <Text style={styles.imagePlaceholderText}>Upload Profile Image</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {errors.image && touched.image && (
                  <Text style={styles.errorText}>{errors.image}</Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, isPending && styles.registerButtonDisabled]}
                onPress={() => handleSubmit()}
                disabled={isPending}
                activeOpacity={0.8}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Register</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                style={styles.loginLink}
                activeOpacity={0.8}
              >
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkBold}>Login here</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
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

export default Register;

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
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
    borderRadius: 150,
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
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainerError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
    fontWeight: "500",
  },
  imagePickerContainer: {
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreviewContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreview: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: "#007AFF",
    backgroundColor: "#0A0E27",
  },
  imageEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A1F3A",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  imagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  imagePlaceholderText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  imagePlaceholderSubtext: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 4,
  },
  registerButton: {
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
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  loginLinkText: {
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "500",
  },
  loginLinkBold: {
    color: "#007AFF",
    fontWeight: "700",
  },
});
