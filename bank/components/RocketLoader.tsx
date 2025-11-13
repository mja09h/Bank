import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface RocketLoaderProps {
  message?: string;
  size?: "small" | "large";
}

const RocketLoader: React.FC<RocketLoaderProps> = ({
  message = "Loading...",
  size = "large",
}) => {
  // Rocket animation values
  const rocketY = useRef(new Animated.Value(0)).current;
  const rocketRotation = useRef(new Animated.Value(0)).current;
  const trailOpacity = useRef(new Animated.Value(0.8)).current;
  const trailScale = useRef(new Animated.Value(1)).current;

  // Stars for background
  const stars = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: 2 + Math.random() * 3,
      duration: 1000 + Math.random() * 2000,
    }))
  ).current;

  const starAnimations = useRef(
    stars.map(() => new Animated.Value(Math.random()))
  ).current;

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

  // Animate rocket
  useEffect(() => {
    // Rocket flying up animation
    const rocketAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rocketY, {
            toValue: -50,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rocketRotation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(trailOpacity, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(trailOpacity, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(trailScale, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(trailScale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(rocketY, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rocketRotation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    rocketAnimation.start();
  }, []);

  const rocketSize = size === "large" ? 80 : 50;
  const trailSize = size === "large" ? 60 : 40;

  const translateY = rocketY.interpolate({
    inputRange: [-50, 0],
    outputRange: [-50, 0],
  });

  const rotate = rocketRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "15deg"],
  });

  return (
    <View style={styles.container}>
      {/* Animated Stars Background */}
      <View style={styles.starsContainer} pointerEvents="none">
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
      </View>

      {/* Rocket Container */}
      <View style={styles.rocketContainer}>
        {/* Rocket Trail */}
        <Animated.View
          style={[
            styles.trail,
            {
              width: trailSize,
              height: trailSize * 1.5,
              opacity: trailOpacity,
              transform: [{ scaleY: trailScale }],
            },
          ]}
        >
          {/* Trail gradient effect */}
          <View style={styles.trailInner} />
        </Animated.View>

        {/* Rocket */}
        <Animated.View
          style={[
            styles.rocket,
            {
              width: rocketSize,
              height: rocketSize * 1.2,
              transform: [{ translateY }, { rotate }],
            },
          ]}
        >
          {/* Rocket Body */}
          <View
            style={[
              styles.rocketBody,
              { width: rocketSize * 0.6, height: rocketSize * 0.8 },
            ]}
          >
            {/* Rocket Window */}
            <View
              style={[
                styles.rocketWindow,
                { width: rocketSize * 0.25, height: rocketSize * 0.25 },
              ]}
            />
          </View>

          {/* Rocket Fins */}
          <View
            style={[
              styles.rocketFin,
              styles.rocketFinLeft,
              { width: rocketSize * 0.2, height: rocketSize * 0.3 },
            ]}
          />
          <View
            style={[
              styles.rocketFin,
              styles.rocketFinRight,
              { width: rocketSize * 0.2, height: rocketSize * 0.3 },
            ]}
          />
        </Animated.View>
      </View>

      {/* Loading Text */}
      <Text
        style={[
          styles.loadingText,
          size === "small" && styles.loadingTextSmall,
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0E27",
  },
  starsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  rocketContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  trail: {
    position: "absolute",
    bottom: -20,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  trailInner: {
    width: "100%",
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 50,
    opacity: 0.6,
    // Create flame effect
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  rocket: {
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  rocketBody: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  rocketWindow: {
    backgroundColor: "#007AFF",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#0A0E27",
  },
  rocketFin: {
    position: "absolute",
    backgroundColor: "#007AFF",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    bottom: -5,
  },
  rocketFinLeft: {
    left: -8,
    transform: [{ rotate: "-45deg" }],
  },
  rocketFinRight: {
    right: -8,
    transform: [{ rotate: "45deg" }],
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    letterSpacing: 1,
  },
  loadingTextSmall: {
    fontSize: 14,
    marginTop: 10,
  },
});

export default RocketLoader;
