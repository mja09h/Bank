import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
  }>;
  onDismiss?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = "info",
  buttons = [{ text: "OK" }],
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return { name: "check-circle", color: "#34C759" };
      case "error":
        return { name: "error", color: "#FF3B30" };
      case "warning":
        return { name: "warning", color: "#FF9500" };
      default:
        return { name: "info", color: "#007AFF" };
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "#34C759";
      case "error":
        return "#FF3B30";
      case "warning":
        return "#FF9500";
      default:
        return "#007AFF";
    }
  };

  const icon = getIcon();
  const borderColor = getBorderColor();

  const handleButtonPress = (button: (typeof buttons)[0]) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.overlayAnimated,
            {
              opacity: opacityAnim,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { borderColor }]}>
            <MaterialIcons
              name={icon.name as any}
              size={48}
              color={icon.color}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isCancel = button.style === "cancel";
              const isDestructive = button.style === "destructive";
              const isPrimary = !isCancel && !isDestructive;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isPrimary && styles.buttonPrimary,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    buttons.length > 1 &&
                      index < buttons.length - 1 &&
                      styles.buttonMargin,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isPrimary && styles.buttonTextPrimary,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  overlayAnimated: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  alertContainer: {
    backgroundColor: "#1A1F3A",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2A2F4A",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: "#007AFF",
  },
  buttonCancel: {
    backgroundColor: "#1A1F3A",
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  buttonDestructive: {
    backgroundColor: "#FF3B30",
  },
  buttonMargin: {
    marginRight: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  buttonTextPrimary: {
    color: "#FFFFFF",
  },
  buttonTextCancel: {
    color: "#8E8E93",
  },
  buttonTextDestructive: {
    color: "#FFFFFF",
  },
});
