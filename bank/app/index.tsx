import { StyleSheet, View, Dimensions } from "react-native";
import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
} from "react";
import { Video, AVPlaybackStatus, ResizeMode } from "expo-av";
import { useRouter } from "expo-router";
import AuthContext from "../context/authContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: screenHeight } = Dimensions.get("window");

const SplashScreen = () => {
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const { isAuthenticated } = useContext(AuthContext);
  const [hasNavigated, setHasNavigated] = useState(false);
  const insets = useSafeAreaInsets();

  const navigateToNextScreen = useCallback(() => {
    if (hasNavigated) return; // Prevent multiple navigations
    setHasNavigated(true);

    // Small delay to ensure smooth transition
    setTimeout(() => {
      if (isAuthenticated) {
        router.replace("/(protected)/(tabs)/(home)");
      } else {
        router.replace("/(auth)/login");
      }
    }, 300);
  }, [hasNavigated, isAuthenticated, router]);

  useEffect(() => {
    // Play video when component mounts
    const playVideo = async () => {
      try {
        if (videoRef.current) {
          await videoRef.current.playAsync();
        }
      } catch (error) {
        console.log("Error playing video:", error);
        // If video fails, navigate immediately
        navigateToNextScreen();
      }
    };

    playVideo();
  }, [navigateToNextScreen]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        // Video finished playing
        navigateToNextScreen();
      }
    }
  };

  // Calculate full screen dimensions including safe areas
  const fullHeight = screenHeight + insets.top + insets.bottom;

  return (
    <View
      style={[
        styles.container,
        {
          marginTop: -insets.top,
          marginBottom: -insets.bottom,
          height: fullHeight,
        },
      ]}
    >
      <Video
        ref={videoRef}
        source={require("../assets/orbit-video.mp4")}
        style={[styles.video, { height: fullHeight }]}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={true}
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={(error) => {
          console.log("Video error:", error);
          navigateToNextScreen();
        }}
      />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
