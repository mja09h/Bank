import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Transaction from "../types/transaction";

interface TransactionsCardProps {
  transaction: Transaction;
}

const TransactionsCard: React.FC<TransactionsCardProps> = ({ transaction }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "⬇️";
      case "withdraw":
        return "⬆️";
      case "transfer":
        return "↔️";
      default:
        return "•";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "#34C759"; // Green
      case "withdraw":
      case "transfer":
        return "#FF3B30"; // Red
      default:
        return "#000";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getTypeIcon(transaction.type)}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.type}>{getTypeLabel(transaction.type)}</Text>
          <Text style={[styles.amount, { color }]}>
            {transaction.type === "deposit" ? "+" : "-"}
            {transaction.amount} KD
          </Text>
        </View>
        {transaction.username && (
          <Text style={styles.username}>To: {transaction.username}</Text>
        )}
        <Text style={styles.date}>{formatDate(transaction.createdAt)}</Text>
      </View>
    </View>
  );
};

export default TransactionsCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  type: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  username: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
});

