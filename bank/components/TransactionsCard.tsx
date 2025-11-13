import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../api/auth";
import Transaction from "../types/transaction";

interface TransactionsCardProps {
  transaction: Transaction;
}

const TransactionsCard: React.FC<TransactionsCardProps> = ({ transaction }) => {
  const router = useRouter();
  
  // Get user IDs from transaction
  const fromUserId = (transaction as any)?.fromUserId || (transaction as any)?.from;
  const toUserId = (transaction as any)?.toUserId || (transaction as any)?.to;

  // Fetch from user details
  const { data: fromUser } = useQuery({
    queryKey: ["user", fromUserId],
    queryFn: () => getUserById(fromUserId),
    enabled: !!fromUserId,
  });

  // Fetch to user details
  const { data: toUser } = useQuery({
    queryKey: ["user", toUserId],
    queryFn: () => getUserById(toUserId),
    enabled: !!toUserId,
  });
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "trending-up";
      case "withdraw":
        return "trending-down";
      case "transfer":
        return "swap-horiz";
      default:
        return "circle";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "#34C759"; // Green
      case "withdraw":
        return "#FF3B30"; // Red
      case "transfer":
        return "#007AFF"; // Blue
      default:
        return "#8E8E93";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Otherwise show full date
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const color = getTypeColor(transaction.type);
  const iconName = getTypeIcon(transaction.type);

  const handlePress = () => {
    const transactionId = transaction.id || (transaction as any)._id;
    console.log("Navigating to transaction:", transactionId);
    console.log("Full transaction:", transaction);
    router.push(`/(protected)/(tabs)/(transactions)/${transactionId}`);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { borderColor: color }]}>
        <MaterialIcons name={iconName as any} size={24} color={color} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <Text style={styles.type}>{getTypeLabel(transaction.type)}</Text>
            {/* Show From */}
            {fromUserId && fromUser && (
              <Text style={styles.username}>
                From: {fromUser.username || "Unknown"}
              </Text>
            )}
            {/* Show To */}
            {toUserId && toUser && (
              <Text style={styles.username}>
                To: {toUser.username || "Unknown"}
              </Text>
            )}
            {/* Fallback to username field if available */}
            {!fromUserId && !toUserId && transaction.username && (
              <Text style={styles.username}>
                {transaction.type === "transfer" ? "To" : "From"}: {transaction.username}
              </Text>
            )}
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color }]}>
              {transaction.type === "deposit" ? "+" : "-"}
              {transaction.amount} KD
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.dateContainer}>
            <MaterialIcons name="schedule" size={14} color="#8E8E93" />
            <Text style={styles.date}>{formatDate(transaction.createdAt)}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#8E8E93" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TransactionsCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#1A1F3A", // Dark card background
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#2A2F4A",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  typeContainer: {
    flex: 1,
  },
  type: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  username: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  date: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
});
