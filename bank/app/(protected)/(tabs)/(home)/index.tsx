import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { deposit, withdraw, transfer } from "../../../../api/transactions";
import { getUser } from "../../../../api/auth";

const index = () => {
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  const { mutate: depositMutation, isPending: isDepositPending } = useMutation({
    mutationKey: ["deposit"],
    mutationFn: (amount: number) => deposit(amount),
    onSuccess: () => {
      setDepositModalVisible(false);
      setAmount("");
      setError("");
      refetchUser();
      Alert.alert("Success", "Funds deposited successfully!");
    },
    onError: (error: any) => {
      Alert.alert(
        "Deposit Failed",
        error.response?.data?.message || "Failed to deposit funds"
      );
    },
  });

  const { mutate: withdrawMutation, isPending: isWithdrawPending } =
    useMutation({
      mutationKey: ["withdraw"],
      mutationFn: (amount: number) => withdraw(amount),
      onSuccess: () => {
        setWithdrawModalVisible(false);
        setAmount("");
        setError("");
        refetchUser();
        Alert.alert("Success", "Funds withdrawn successfully!");
      },
      onError: (error: any) => {
        Alert.alert(
          "Withdraw Failed",
          error.response?.data?.message || "Failed to withdraw funds"
        );
      },
    });

  const { mutate: transferMutation, isPending: isTransferPending } =
    useMutation({
      mutationKey: ["transfer"],
      mutationFn: ({
        amount,
        username,
      }: {
        amount: number;
        username: string;
      }) => transfer(amount, username),
      onSuccess: () => {
        setTransferModalVisible(false);
        setAmount("");
        setUsername("");
        setError("");
        refetchUser();
        Alert.alert("Success", "Funds transferred successfully!");
      },
      onError: (error: any) => {
        Alert.alert(
          "Transfer Failed",
          error.response?.data?.message || "Failed to transfer funds"
        );
      },
    });

  const validateAmount = (isWithdraw: boolean = false): boolean => {
    if (!amount || amount.trim() === "") {
      setError("Amount is required");
      return false;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setError("Please enter a valid number");
      return false;
    }

    if (numAmount <= 0) {
      setError("Amount must be greater than 0");
      return false;
    }

    if (isWithdraw && user?.balance !== undefined) {
      if (numAmount > user.balance) {
        setError("Insufficient balance");
        return false;
      }
    }

    setError("");
    return true;
  };

  const validateTransfer = (): boolean => {
    if (!username || username.trim() === "") {
      setError("Username is required");
      return false;
    }

    if (!amount || amount.trim() === "") {
      setError("Amount is required");
      return false;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setError("Please enter a valid number");
      return false;
    }

    if (numAmount <= 0) {
      setError("Amount must be greater than 0");
      return false;
    }

    if (user?.balance !== undefined) {
      if (numAmount > user.balance) {
        setError("Insufficient balance");
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleDeposit = () => {
    if (validateAmount(false)) {
      depositMutation(parseFloat(amount));
    }
  };

  const handleWithdraw = () => {
    if (validateAmount(true)) {
      withdrawMutation(parseFloat(amount));
    }
  };

  const handleTransfer = () => {
    if (validateTransfer()) {
      transferMutation({
        amount: parseFloat(amount),
        username: username.trim(),
      });
    }
  };

  const handleCloseDepositModal = () => {
    setDepositModalVisible(false);
    setAmount("");
    setError("");
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawModalVisible(false);
    setAmount("");
    setError("");
  };

  const handleCloseTransferModal = () => {
    setTransferModalVisible(false);
    setAmount("");
    setUsername("");
    setError("");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Home</Text>
        <Text style={styles.balance}>Balance: {user?.balance} KD</Text>
        <TouchableOpacity
          style={styles.depositButton}
          onPress={() => setDepositModalVisible(true)}
        >
          <Text style={styles.depositButtonText}>Deposit Funds</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={() => setWithdrawModalVisible(true)}
        >
          <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.transferButton}
          onPress={() => setTransferModalVisible(true)}
        >
          <Text style={styles.transferButtonText}>Transfer Funds</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={depositModalVisible}
        onRequestClose={handleCloseDepositModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deposit Funds</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError("");
              }}
              keyboardType="numeric"
              editable={!isDepositPending}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCloseDepositModal}
                disabled={isDepositPending}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.depositButtonModal,
                  isDepositPending && styles.buttonDisabled,
                ]}
                onPress={handleDeposit}
                disabled={isDepositPending}
              >
                {isDepositPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Deposit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={withdrawModalVisible}
        onRequestClose={handleCloseWithdrawModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Withdraw Funds</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError("");
              }}
              keyboardType="numeric"
              editable={!isWithdrawPending}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCloseWithdrawModal}
                disabled={isWithdrawPending}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.withdrawButtonModal,
                  isWithdrawPending && styles.buttonDisabled,
                ]}
                onPress={handleWithdraw}
                disabled={isWithdrawPending}
              >
                {isWithdrawPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Withdraw</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={transferModalVisible}
        onRequestClose={handleCloseTransferModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transfer Funds</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError("");
              }}
              editable={!isTransferPending}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError("");
              }}
              keyboardType="numeric"
              editable={!isTransferPending}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCloseTransferModal}
                disabled={isTransferPending}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.transferButtonModal,
                  isTransferPending && styles.buttonDisabled,
                ]}
                onPress={handleTransfer}
                disabled={isTransferPending}
              >
                {isTransferPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Transfer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  balance: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#007AFF",
  },
  depositButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  depositButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  withdrawButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  withdrawButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  transferButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  transferButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#8E8E93",
  },
  depositButtonModal: {
    backgroundColor: "#007AFF",
  },
  withdrawButtonModal: {
    backgroundColor: "#FF3B30",
  },
  transferButtonModal: {
    backgroundColor: "#34C759",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
