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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deposit } from "../../../../api/transactions";
import { getUser } from "../../../../api/auth";

const index = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  const { mutate: depositMutation, isPending } = useMutation({
    mutationKey: ["deposit"],
    mutationFn: (amount: number) => deposit(amount),
    onSuccess: () => {
      setModalVisible(false);
      setAmount("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      Alert.alert("Success", "Funds deposited successfully!");
    },
    onError: (error: any) => {
      Alert.alert(
        "Deposit Failed",
        error.response?.data?.message || "Failed to deposit funds"
      );
    },
  });

  const validateAmount = (): boolean => {
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

    setError("");
    return true;
  };

  const handleDeposit = () => {
    if (validateAmount()) {
      depositMutation(parseFloat(amount));
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setAmount("");
    setError("");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Home</Text>
        <Text style={styles.balance}>Balance: {user?.balance} KD</Text>
        <TouchableOpacity
          style={styles.depositButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.depositButtonText}>Deposit Funds</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
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
              editable={!isPending}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCloseModal}
                disabled={isPending}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.depositButtonModal,
                  isPending && styles.buttonDisabled,
                ]}
                onPress={handleDeposit}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Deposit</Text>
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});