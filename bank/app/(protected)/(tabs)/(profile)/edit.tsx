import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Button,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUser, updateProfile } from "../../../../api/auth";
import * as ImagePicker from "expo-image-picker";

const edit = () => {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { mutate: updateProfileMutation, isPending } = useMutation({
    mutationKey: ["updateProfile"],
    mutationFn: (imageUri: string) => updateProfile(imageUri),
    onSuccess: () => {
      // Invalidate and refetch user data to get updated image
      queryClient.invalidateQueries({ queryKey: ["user"] });
      Alert.alert("Success", "Profile image updated successfully!");
      router.back();
    },
    onError: (error: any) => {
      console.log(error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update profile image"
      );
    },
  });

  const pickImage = async () => {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant permission to access your photos"
      );
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
      Alert.alert("No Image Selected", "Please select an image to update");
    }
  };

  const displayImage =
    selectedImage ||
    (user?.image
      ? "https://react-bank-project.eapi.joincoded.com/" + user.image
      : null);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Profile Image</Text>

      <View style={styles.imageContainer}>
        {displayImage ? (
          <Image source={{ uri: displayImage }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>
              {user?.username?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.pickImageButton}
        onPress={pickImage}
        disabled={isPending}
      >
        <Text style={styles.pickImageText}>
          {selectedImage ? "Change Image" : "Select Image"}
        </Text>
      </TouchableOpacity>

      {selectedImage && (
        <View style={styles.buttonContainer}>
          <Button
            title={isPending ? "Updating..." : "Update Profile Image"}
            onPress={handleUpdate}
            disabled={isPending}
          />
          {isPending && (
            <ActivityIndicator
              size="small"
              style={styles.loader}
              color="#007AFF"
            />
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={isPending}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default edit;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#f0f0f0",
  },
  placeholderImage: {
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#fff",
  },
  pickImageButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  pickImageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  loader: {
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 10,
    alignItems: "center",
    padding: 15,
  },
  cancelText: {
    color: "#007AFF",
    fontSize: 16,
  },
});
