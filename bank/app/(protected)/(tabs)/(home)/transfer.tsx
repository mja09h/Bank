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
import React, { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transfer } from "../../../../api/transactions";
import { getAllUsers, getUser } from "../../../../api/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

/**
 * Transfer Screen Component
 * Allows users to search and select a user to transfer money to
 * Styled with Orbit theme - dark space aesthetic
 */
const Transfer = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Fetch all users
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
  });

  // Fetch current user balance
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });

  // Process users data - same logic as users page
  const allUsers = useMemo(() => {
    if (!usersData) return [];

    // Handle different response structures - same as users page
    const processed = Array.isArray(usersData)
      ? usersData
      : usersData?.users || usersData?.data || [];

    return processed;
  }, [usersData]);

  // Filter users based on search query and exclude current user
  const filteredUsers = useMemo(() => {
    if (!allUsers || allUsers.length === 0) {
      return [];
    }

    // Start with all users
    let filtered = [...allUsers];

    // Exclude current user if we have user info
    if (user) {
      const currentUsername = user.username;
      const currentUserId = user.id || user._id;

      filtered = filtered.filter((u: any) => {
        // Check username match
        if (currentUsername && u.username === currentUsername) {
          return false;
        }
        // Check id match (try both id and _id)
        if (
          currentUserId &&
          (u.id === currentUserId || u._id === currentUserId)
        ) {
          return false;
        }
        return true;
      });
    }

    // Apply search filter if there's a search query
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter((u: any) => {
        return u.username?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    return filtered;
  }, [allUsers, searchQuery, user]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSearchQuery(user.username);
  };

  const handleTransfer = () => {
    setError("");

    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (user?.balance && amountNum > user.balance) {
      setError("Insufficient balance");
      return;
    }

    transferMutation.mutate({
      amount: amountNum,
      username: selectedUser.username,
    });
  };

  const isTransferPending = transferMutation.isPending;

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
        <Text style={styles.headerTitle}>Transfer Funds</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Info */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{user?.balance || 0} KD</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <MaterialIcons
              name="search"
              size={24}
              color="#8E8E93"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a user..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (selectedUser && text !== selectedUser.username) {
                  setSelectedUser(null);
                }
              }}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSelectedUser(null);
                }}
              >
                <MaterialIcons name="close" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Selected User Display */}
        {selectedUser && (
          <View style={styles.selectedUserCard}>
            <View style={styles.selectedUserInfo}>
              <Image
                source={{
                  uri:
                    "https://react-bank-project.eapi.joincoded.com/" +
                    selectedUser?.image,
                }}
                style={styles.selectedUserImage}
              />
              <View style={styles.selectedUserDetails}>
                <Text style={styles.selectedUserName}>
                  {selectedUser.username}
                </Text>
                <Text style={styles.selectedUserBalance}>
                  Balance: {selectedUser.balance || 0} KD
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedUser(null);
                setSearchQuery("");
              }}
            >
              <MaterialIcons name="close" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}

        {/* Users List */}
        {!selectedUser && (
          <View style={styles.usersSection}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? "Search Results" : "All Users"}
            </Text>
            {isLoadingUsers ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading users...</Text>
              </View>
            ) : usersError ? (
              <View style={styles.centerContainer}>
                <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>Error loading users</Text>
                <Text
                  style={[styles.errorText, { fontSize: 12, marginTop: 5 }]}
                >
                  {usersError?.message || "Unknown error"}
                </Text>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.centerContainer}>
                <MaterialIcons name="person-off" size={48} color="#8E8E93" />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "No users found matching your search"
                    : allUsers.length === 0
                    ? "No users available"
                    : "No users available (all filtered out)"}
                </Text>
                {allUsers.length > 0 && filteredUsers.length === 0 && (
                  <Text
                    style={[styles.emptyText, { fontSize: 12, marginTop: 5 }]}
                  >
                    {allUsers.length} user(s) were filtered out
                  </Text>
                )}
              </View>
            ) : (
              <>
                <View style={styles.usersList}>
                  {paginatedUsers.map((userItem: any, index: number) => (
                    <TouchableOpacity
                      key={userItem.id || userItem._id || index}
                      style={styles.userCard}
                      onPress={() => handleSelectUser(userItem)}
                    >
                      <Image
                        source={{
                          uri:
                            "https://react-bank-project.eapi.joincoded.com/" +
                            userItem?.image,
                        }}
                        style={styles.userImage}
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userItem.username}</Text>
                        <Text style={styles.userBalance}>
                          {userItem.balance || 0} KD
                        </Text>
                      </View>
                      <MaterialIcons
                        name="arrow-forward"
                        size={20}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      style={[
                        styles.paginationButton,
                        currentPage === 1 && styles.paginationButtonDisabled,
                      ]}
                      onPress={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <MaterialIcons
                        name="chevron-left"
                        size={24}
                        color={currentPage === 1 ? "#8E8E93" : "#FFFFFF"}
                      />
                    </TouchableOpacity>

                    <View style={styles.paginationNumbers}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
                          const prevPage = array[index - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;

                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && (
                                <Text style={styles.paginationEllipsis}>
                                  ...
                                </Text>
                              )}
                              <TouchableOpacity
                                style={[
                                  styles.paginationNumber,
                                  currentPage === page &&
                                    styles.paginationNumberActive,
                                ]}
                                onPress={() => setCurrentPage(page)}
                              >
                                <Text
                                  style={[
                                    styles.paginationNumberText,
                                    currentPage === page &&
                                      styles.paginationNumberTextActive,
                                  ]}
                                >
                                  {page}
                                </Text>
                              </TouchableOpacity>
                            </React.Fragment>
                          );
                        })}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.paginationButton,
                        currentPage === totalPages &&
                          styles.paginationButtonDisabled,
                      ]}
                      onPress={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color={
                          currentPage === totalPages ? "#8E8E93" : "#FFFFFF"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Page Info */}
                {filteredUsers.length > 0 && (
                  <Text style={styles.pageInfo}>
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filteredUsers.length)} of{" "}
                    {filteredUsers.length} users
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Amount Input Section */}
        {selectedUser && (
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
                    user?.balance &&
                      quickAmount > user.balance &&
                      styles.quickAmountButtonDisabled,
                    amount === quickAmount.toString() &&
                      styles.quickAmountButtonActive,
                  ]}
                  onPress={() => {
                    if (!user?.balance || quickAmount <= user.balance) {
                      setAmount(quickAmount.toString());
                      setError("");
                    }
                  }}
                  disabled={
                    isTransferPending ||
                    (user?.balance && quickAmount > user.balance)
                  }
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      user?.balance &&
                        quickAmount > user.balance &&
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
        )}
      </ScrollView>
    </View>
  );
};

export default Transfer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E27", // Dark space background
  },
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
  balanceCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginTop: 10,
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
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1F3A",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 12,
  },
  selectedUserCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedUserImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  selectedUserDetails: {
    flex: 1,
  },
  selectedUserName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  selectedUserBalance: {
    fontSize: 14,
    color: "#8E8E93",
  },
  usersSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: "#1A1F3A",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userBalance: {
    fontSize: 14,
    color: "#8E8E93",
  },
  amountSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
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
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    color: "#8E8E93",
    marginTop: 10,
  },
  emptyText: {
    color: "#8E8E93",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  // Pagination styles
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 10,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1F3A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  paginationNumbers: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    gap: 5,
  },
  paginationNumber: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1F3A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2F4A",
    paddingHorizontal: 12,
  },
  paginationNumberActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  paginationNumberText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  paginationNumberTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  paginationEllipsis: {
    color: "#8E8E93",
    fontSize: 16,
    paddingHorizontal: 5,
  },
  pageInfo: {
    color: "#8E8E93",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
});
