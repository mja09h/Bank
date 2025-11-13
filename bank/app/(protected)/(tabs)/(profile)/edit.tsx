import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUser, updateProfile } from "../../../../api/auth";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import CustomAlert from "../../../../components/CustomAlert";
import RocketLoader from "../../../../components/RocketLoader";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Edit Profile Screen Component
 * Allows users to update their profile picture
 * Styled with Orbit theme - dark space aesthetic matching the app
 */

const edit = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info" | "warning">("info");
  const [alertButtons, setAlertButtons] = useState<Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }>>([]);

  const { mutate: updateProfileMutation, isPending } = useMutation({
    mutationKey: ["updateProfile"],
    mutationFn: (imageUri: string) => updateProfile(imageUri),
    onSuccess: () => {
      // Invalidate and refetch user data to get updated image
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setAlertTitle("Success");
      setAlertMessage("Profile image updated successfully!");
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
      console.log(error);
      setAlertTitle("Error");
      setAlertMessage(error?.response?.data?.message || "Failed to update profile image");
      setAlertType("error");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    },
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

  const pickImage = async () => {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setAlertTitle("Permission Required");
      setAlertMessage("Please grant permission to access your photos");
      setAlertType("warning");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile images
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleUpdate = () => {
    if (selectedImage) {
      updateProfileMutation(selectedImage);
    } else {
      setAlertTitle("No Image Selected");
      setAlertMessage("Please select an image to update");
      setAlertType("warning");
      setAlertButtons([{ text: "OK" }]);
      setAlertVisible(true);
    }
  };

  const displayImage =
    selectedImage ||
    (user?.image
      ? "https://react-bank-project.eapi.joincoded.com/" + user.image
      : null);

  if (userLoading) {
    return <RocketLoader message="Loading..." size="large" />;
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
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Profile Image Card */}
        <View style={styles.imageCard}>
          <Text style={styles.cardTitle}>Profile Picture</Text>
          <Text style={styles.cardSubtitle}>
            Update your profile picture to personalize your account
          </Text>

          <View style={styles.imageContainer}>
            {displayImage ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: displayImage }} style={styles.image} />
                <View style={styles.imageBorder} />
                {selectedImage && (
                  <View style={styles.newImageBadge}>
                    <MaterialIcons name="check-circle" size={20} color="#34C759" />
                    <Text style={styles.newImageText}>New</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>
                  {user?.username?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>

          {/* Select Image Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.selectImageButton]}
            onPress={pickImage}
            disabled={isPending}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View style={[styles.circularIconContainer, styles.selectIconBg]}>
                <MaterialIcons
                  name={selectedImage ? "photo-library" : "add-photo-alternate"}
                  size={24}
                  color="#007AFF"
                />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.actionButtonText}>
                  {selectedImage ? "Change Image" : "Select Image"}
                </Text>
                <Text style={styles.actionButtonSubtext}>
                  {selectedImage
                    ? "Choose a different photo"
                    : "Pick a photo from your gallery"}
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Update Button - Only show when image is selected */}
          {selectedImage && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.updateButton,
                isPending && styles.buttonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={isPending}
              activeOpacity={0.9}
            >
              <View style={styles.buttonContent}>
                <View style={[styles.circularIconContainer, styles.updateIconBg]}>
                  {isPending ? (
                    <ActivityIndicator size="small" color="#34C759" />
                  ) : (
                    <MaterialIcons name="save" size={24} color="#34C759" />
                  )}
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.actionButtonText}>
                    {isPending ? "Updating..." : "Save Changes"}
                  </Text>
                  <Text style={styles.actionButtonSubtext}>
                    {isPending
                      ? "Please wait..."
                      : "Update your profile picture"}
                  </Text>
                </View>
                {!isPending && (
                  <View style={styles.arrowContainer}>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => router.back()}
            disabled={isPending}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View style={[styles.circularIconContainer, styles.cancelIconBg]}>
                <MaterialIcons name="close" size={24} color="#8E8E93" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
                <Text style={styles.actionButtonSubtext}>
                  Go back without saving
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
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

export default edit;

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
    paddingBottom: 40,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
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
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  // Image card
  imageCard: {
    backgroundColor: "#1A1F3A", // Dark card background
    marginHorizontal: 20,
    marginTop: 20,
    padding: 30,
    borderRadius: 20,
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
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 30,
    lineHeight: 20,
  },
  // Image container
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: "#007AFF",
  },
  imageBorder: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: "#007AFF",
    top: -5,
    left: -5,
    opacity: 0.3,
  },
  placeholderImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#007AFF",
  },
  placeholderText: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  newImageBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#1A1F3A",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#34C759",
  },
  newImageText: {
    color: "#34C759",
    fontSize: 12,
    fontWeight: "600",
  },
  // Action buttons container
  actionsContainer: {
    flexDirection: "column",
    gap: 15,
    marginTop: 20,
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
    marginBottom: 15,
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
  selectIconBg: {
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
  updateIconBg: {
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
  cancelIconBg: {
    borderColor: "#8E8E93",
    backgroundColor: "rgba(142, 142, 147, 0.15)",
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
  selectImageButton: {
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
  },
  updateButton: {
    borderColor: "#34C759",
    shadowColor: "#34C759",
  },
  cancelButton: {
    borderColor: "#2A2F4A",
    backgroundColor: "#0A0E27",
  },
  cancelButtonText: {
    color: "#8E8E93",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
