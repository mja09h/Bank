import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transfer } from "../../../../api/transactions";
import { getUser, getAllUsers } from "../../../../api/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

/**
 * User Detail Screen Component
 * Displays user information and allows transferring money to this user
 * Styled with Orbit theme - dark space aesthetic matching the app
 */
const UserDetail = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  // Fetch current user balance
  const { data: currentUser } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  // Fetch all users to find the target user
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
  });

  // Find the target user from the users list
  const allUsers = usersData
    ? Array.isArray(usersData)
      ? usersData
      : usersData?.users || usersData?.data || []
    : [];

  const targetUser = allUsers.find(
    (u: any) => u.id === userId || u._id === userId || u.username === userId
  );

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: ({ amount, username }: { amount: number; username: string }) =>
      transfer(amount, username),
    onSuccess: () => {
      // Invalidate queries to refresh user balance and users list
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      Alert.alert("Success", "Transfer completed successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    },
    onError: (error: any) => {
      setError(
        error?.response?.data?.message ||
          "Failed to transfer funds. Please try again."
      );
    },
  });

  const handleTransfer = () => {
    setError("");

    if (!targetUser) {
      setError("User not found");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (currentUser?.balance && amountNum > currentUser.balance) {
      setError("Insufficient balance");
      return;
    }

    transferMutation.mutate({
      amount: amountNum,
      username: targetUser.username,
    });
  };

  const isTransferPending = transferMutation.isPending;

  if (!targetUser) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Not Found</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer to User</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <Image
            source={{
              uri:
                "https://react-bank-project.eapi.joincoded.com/" +
                targetUser?.image,
            }}
            style={styles.userImage}
          />
          <Text style={styles.userName}>{targetUser.username}</Text>
          <Text style={styles.userBalance}>
            Balance: {targetUser.balance || 0} KD
          </Text>
        </View>

        {/* Balance Info */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {currentUser?.balance || 0} KD
          </Text>
        </View>

        {/* Amount Input Section */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionTitle}>Enter Amount</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#8E8E93"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              setError("");
            }}
            keyboardType="numeric"
            editable={!isTransferPending}
          />
          <Text style={styles.currencyLabel}>KD</Text>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountContainer}>
            {[50, 100, 200, 500].map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  currentUser?.balance &&
                    quickAmount > currentUser.balance &&
                    styles.quickAmountButtonDisabled,
                  amount === quickAmount.toString() &&
                    styles.quickAmountButtonActive,
                ]}
                onPress={() => {
                  if (
                    !currentUser?.balance ||
                    quickAmount <= currentUser.balance
                  ) {
                    setAmount(quickAmount.toString());
                    setError("");
                  }
                }}
                disabled={
                  isTransferPending ||
                  (currentUser?.balance && quickAmount > currentUser.balance)
                }
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    currentUser?.balance &&
                      quickAmount > currentUser.balance &&
                      styles.quickAmountTextDisabled,
                    amount === quickAmount.toString() &&
                      styles.quickAmountTextActive,
                  ]}
                >
                  {quickAmount} KD
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.transferButton,
              isTransferPending && styles.transferButtonDisabled,
            ]}
            onPress={handleTransfer}
            disabled={isTransferPending}
          >
            {isTransferPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.transferButtonText}>Transfer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default UserDetail;

const styles = StyleSheet.create({
  // Main container with dark space theme background
  container: {
    flex: 1,
    backgroundColor: "#0A0E27", // Dark space background
  },
  // Header section
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#0A0E27",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  // User info card
  userCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  userImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  userBalance: {
    fontSize: 16,
    color: "#8E8E93",
  },
  // Balance card
  balanceCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  // Amount section
  amountSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  amountInput: {
    backgroundColor: "#1A1F3A",
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#007AFF",
    textAlign: "center",
    marginBottom: 20,
  },
  currencyLabel: {
    fontSize: 18,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 20,
  },
  quickAmountContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  quickAmountButton: {
    backgroundColor: "#1A1F3A",
    borderWidth: 1,
    borderColor: "#2A2F4A",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  quickAmountButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  quickAmountButtonDisabled: {
    opacity: 0.3,
  },
  quickAmountText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  quickAmountTextActive: {
    color: "#FFFFFF",
  },
  quickAmountTextDisabled: {
    color: "#8E8E93",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  transferButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  transferButtonDisabled: {
    opacity: 0.6,
  },
  transferButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
});
