import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyTransactions } from "../../../../api/transactions";
import TransactionsCard from "../../../../components/TransactionsCard";
import Transaction from "../../../../types/transaction";

const index = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<
    "" | "deposit" | "withdraw" | "transfer"
  >("");

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getMyTransactions(),
  });

  // Move useMemo BEFORE early returns
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((transaction: Transaction) => {
      // Filter by date range
      if (fromDate || toDate) {
        const transactionDate = new Date(transaction.createdAt);
        transactionDate.setHours(0, 0, 0, 0);

        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          if (transactionDate < from) return false;
        }

        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          if (transactionDate > to) return false;
        }
      }

      // Filter by amount
      if (amount) {
        const searchAmount = parseFloat(amount);
        if (isNaN(searchAmount) || transaction.amount !== searchAmount) {
          return false;
        }
      }

      // Filter by transaction type
      if (transactionType && transaction.type !== transactionType) {
        return false;
      }

      return true;
    });
  }, [transactions, fromDate, toDate, amount, transactionType]);

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setAmount("");
    setTransactionType("");
  };

  const hasActiveFilters = fromDate || toDate || amount || transactionType;

  // Now early returns come AFTER all hooks
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load transactions</Text>
      </View>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No transactions found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Transactions</Text>
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.searchTitle}>Search & Filter</Text>

        <View style={styles.dateRow}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.label}>From Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={fromDate}
              onChangeText={setFromDate}
              placeholderTextColor="#999"
            />
          </View>
          <View style={styles.dateInputContainer}>
            <Text style={styles.label}>To Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={toDate}
              onChangeText={setToDate}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.typeContainer}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeButtonsRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                transactionType === "" && styles.typeButtonActive,
              ]}
              onPress={() => setTransactionType("")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  transactionType === "" && styles.typeButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                styles.typeButtonDeposit,
                transactionType === "deposit" && styles.typeButtonActive,
              ]}
              onPress={() => setTransactionType("deposit")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  transactionType === "deposit" && styles.typeButtonTextActive,
                ]}
              >
                Deposit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                styles.typeButtonWithdraw,
                transactionType === "withdraw" && styles.typeButtonActive,
              ]}
              onPress={() => setTransactionType("withdraw")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  transactionType === "withdraw" && styles.typeButtonTextActive,
                ]}
              >
                Withdraw
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                styles.typeButtonTransfer,
                transactionType === "transfer" && styles.typeButtonActive,
              ]}
              onPress={() => setTransactionType("transfer")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  transactionType === "transfer" && styles.typeButtonTextActive,
                ]}
              >
                Transfer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearFilters}
          >
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.list}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {hasActiveFilters
                ? "No transactions match your filters"
                : "No transactions found"}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction: Transaction) => (
            <TransactionsCard key={transaction.id} transaction={transaction} />
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  list: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  searchSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  amountContainer: {
    marginBottom: 16,
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeButtonsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    minWidth: 80,
    alignItems: "center",
  },
  typeButtonActive: {
    borderWidth: 2,
  },
  typeButtonDeposit: {
    borderColor: "#34C759",
  },
  typeButtonWithdraw: {
    borderColor: "#FF3B30",
  },
  typeButtonTransfer: {
    borderColor: "#FF3B30",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  typeButtonTextActive: {
    color: "#000",
    fontWeight: "bold",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  clearButton: {
    backgroundColor: "#8E8E93",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
});
