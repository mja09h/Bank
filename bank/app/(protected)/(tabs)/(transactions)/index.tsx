import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyTransactions } from "../../../../api/transactions";
import { getAllUsers } from "../../../../api/auth";
import TransactionsCard from "../../../../components/TransactionsCard";
import Transaction from "../../../../types/transaction";
import { MaterialIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Transactions Screen Component
 * Displays user transactions with filtering and search capabilities
 * Styled with Orbit theme - dark space aesthetic matching the app
 */

const index = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<
    "" | "deposit" | "withdraw" | "transfer"
  >("");
  const [fromUserFilter, setFromUserFilter] = useState("");
  const [toUserFilter, setToUserFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getMyTransactions(),
  });

  // Fetch all users for filtering
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
  });

  // Process users data
  const allUsers = useMemo(() => {
    if (!usersData) return [];
    return Array.isArray(usersData)
      ? usersData
      : usersData?.users || usersData?.data || [];
  }, [usersData]);

  // Generate star positions (memoized to prevent regeneration)
  const stars = useRef(
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: 2 + Math.random() * 3,
      duration: 1000 + Math.random() * 2000,
    }))
  ).current;

  // Generate moon positions (memoized)
  const moons = useRef([
    { x: SCREEN_WIDTH * 0.15, y: SCREEN_HEIGHT * 0.2, size: 35 },
    { x: SCREEN_WIDTH * 0.8, y: SCREEN_HEIGHT * 0.3, size: 28 },
  ]).current;

  // Animation values for stars and moons
  const starAnimations = useRef(
    stars.map(() => new Animated.Value(Math.random()))
  ).current;
  const moonAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

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

  // Animate moons floating
  useEffect(() => {
    const moonAnimationsArray = moonAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000 + index * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000 + index * 1000,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(moonAnimationsArray).start();
  }, []);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    // Find user IDs from username filters
    const fromUser = fromUserFilter
      ? allUsers.find((u: any) =>
          u.username?.toLowerCase().includes(fromUserFilter.toLowerCase())
        )
      : null;
    const fromUserId = fromUser?.id || fromUser?._id || null;

    const toUser = toUserFilter
      ? allUsers.find((u: any) =>
          u.username?.toLowerCase().includes(toUserFilter.toLowerCase())
        )
      : null;
    const toUserId = toUser?.id || toUser?._id || null;

    const filtered = transactions.filter((transaction: Transaction) => {
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

      // Filter by from user
      if (fromUserId) {
        const transactionFromId =
          (transaction as any).fromUserId || (transaction as any).from;
        if (String(transactionFromId) !== String(fromUserId)) {
          return false;
        }
      }

      // Filter by to user
      if (toUserId) {
        const transactionToId =
          (transaction as any).toUserId || (transaction as any).to;
        if (String(transactionToId) !== String(toUserId)) {
          return false;
        }
      }

      return true;
    });

    // Sort by newest date/time first (most recent at the top)
    return filtered.sort((a: Transaction, b: Transaction) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [
    transactions,
    fromDate,
    toDate,
    amount,
    transactionType,
    fromUserFilter,
    toUserFilter,
    allUsers,
  ]);

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setAmount("");
    setTransactionType("");
    setFromUserFilter("");
    setToUserFilter("");
  };

  const hasActiveFilters =
    fromDate || toDate || amount || transactionType || fromUserFilter || toUserFilter;

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, amount, transactionType, fromUserFilter, toUserFilter]);

  // Calculate statistics
  const totalTransactions = transactions?.length || 0;
  const depositCount = transactions?.filter((t: any) => t.type === "deposit").length || 0;
  const withdrawCount = transactions?.filter((t: any) => t.type === "withdraw").length || 0;
  const transferCount = transactions?.filter((t: any) => t.type === "transfer").length || 0;
  const filteredCount = filteredTransactions.length;

  // Calculate total amounts
  const totalDeposits = transactions?.reduce((sum: number, t: any) => 
    t.type === "deposit" ? sum + t.amount : sum, 0) || 0;
  const totalWithdrawals = transactions?.reduce((sum: number, t: any) => 
    t.type === "withdraw" ? sum + t.amount : sum, 0) || 0;
  const totalTransfers = transactions?.reduce((sum: number, t: any) => 
    t.type === "transfer" ? sum + t.amount : sum, 0) || 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Failed to load transactions</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Background - Stars and Moons */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {/* Animated Stars */}
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

        {/* Animated Moons */}
        {moons.map((moon, index) => {
          const translateY = moonAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          });
          const opacity = moonAnimations[index].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.4, 0.7, 0.4],
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.moon,
                {
                  left: moon.x,
                  top: moon.y,
                  width: moon.size,
                  height: moon.size,
                  borderRadius: moon.size / 2,
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>
            {filteredCount} {filteredCount === 1 ? "transaction" : "transactions"}
            {hasActiveFilters && ` (filtered)`}
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconDeposit]}>
              <MaterialIcons name="trending-up" size={20} color="#34C759" />
            </View>
            <Text style={styles.statValue}>{depositCount}</Text>
            <Text style={styles.statLabel}>Deposits</Text>
            <Text style={styles.statAmount}>+{totalDeposits.toFixed(2)} KD</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconWithdraw]}>
              <MaterialIcons name="trending-down" size={20} color="#FF3B30" />
            </View>
            <Text style={styles.statValue}>{withdrawCount}</Text>
            <Text style={styles.statLabel}>Withdrawals</Text>
            <Text style={styles.statAmount}>-{totalWithdrawals.toFixed(2)} KD</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconTransfer]}>
              <MaterialIcons name="swap-horiz" size={20} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>{transferCount}</Text>
            <Text style={styles.statLabel}>Transfers</Text>
            <Text style={styles.statAmount}>{totalTransfers.toFixed(2)} KD</Text>
          </View>
        </View>

        {/* Filter Toggle Button */}
        <View style={styles.filterToggleContainer}>
          <TouchableOpacity
            style={styles.filterToggleButton}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.9}
          >
            <View style={styles.filterToggleContent}>
              <MaterialIcons
                name={showFilters ? "filter-list" : "filter-list-off"}
                size={20}
                color="#007AFF"
              />
              <Text style={styles.filterToggleText}>
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Text>
              {hasActiveFilters && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {[fromDate, toDate, amount, transactionType, fromUserFilter, toUserFilter].filter(Boolean).length}
                  </Text>
                </View>
              )}
            </View>
            <MaterialIcons
              name={showFilters ? "expand-less" : "expand-more"}
              size={24}
              color="#8E8E93"
            />
          </TouchableOpacity>
        </View>

        {/* Filter Section */}
        {showFilters && (
          <View style={styles.filterCard}>
            <Text style={styles.filterTitle}>Search & Filter</Text>

            {/* Date Range */}
            <View style={styles.dateRow}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.label}>From Date</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="calendar-today" size={18} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#8E8E93"
                    value={fromDate}
                    onChangeText={setFromDate}
                  />
                </View>
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.label}>To Date</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="calendar-today" size={18} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#8E8E93"
                    value={toDate}
                    onChangeText={setToDate}
                  />
                </View>
              </View>
            </View>

            {/* Amount Filter */}
            <View style={styles.amountContainer}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="attach-money" size={18} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  placeholderTextColor="#8E8E93"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Type Filter */}
            <View style={styles.typeContainer}>
              <Text style={styles.label}>Transaction Type</Text>
              <View style={styles.typeButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === "" && styles.typeButtonActive,
                  ]}
                  onPress={() => setTransactionType("")}
                  activeOpacity={0.7}
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
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="trending-up"
                    size={16}
                    color={transactionType === "deposit" ? "#34C759" : "#8E8E93"}
                    style={styles.typeButtonIcon}
                  />
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
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="trending-down"
                    size={16}
                    color={transactionType === "withdraw" ? "#FF3B30" : "#8E8E93"}
                    style={styles.typeButtonIcon}
                  />
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
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="swap-horiz"
                    size={16}
                    color={transactionType === "transfer" ? "#007AFF" : "#8E8E93"}
                    style={styles.typeButtonIcon}
                  />
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

            {/* From User Filter */}
            <View style={styles.userFilterContainer}>
              <Text style={styles.label}>From User</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person-outline" size={18} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Search by username"
                  placeholderTextColor="#8E8E93"
                  value={fromUserFilter}
                  onChangeText={setFromUserFilter}
                />
                {fromUserFilter.length > 0 && (
                  <TouchableOpacity onPress={() => setFromUserFilter("")}>
                    <MaterialIcons name="close" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* To User Filter */}
            <View style={styles.userFilterContainer}>
              <Text style={styles.label}>To User</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={18} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Search by username"
                  placeholderTextColor="#8E8E93"
                  value={toUserFilter}
                  onChangeText={setToUserFilter}
                />
                {toUserFilter.length > 0 && (
                  <TouchableOpacity onPress={() => setToUserFilter("")}>
                    <MaterialIcons name="close" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearFilters}
                activeOpacity={0.9}
              >
                <MaterialIcons name="clear" size={18} color="#FFFFFF" />
                <Text style={styles.clearButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Transactions List */}
        <View style={styles.listContainer}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={64} color="#8E8E93" />
              <Text style={styles.emptyText}>
                {hasActiveFilters
                  ? "No transactions match your filters"
                  : "No transactions found"}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={handleClearFilters}
                  activeOpacity={0.9}
                >
                  <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {paginatedTransactions.map((transaction: Transaction, index: number) => (
                <TransactionsCard 
                  key={(transaction as any).id || (transaction as any)._id || `transaction-${index}`} 
                  transaction={transaction} 
                />
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <View style={styles.paginationInfo}>
                    <Text style={styles.paginationText}>
                      Page {currentPage} of {totalPages}
                    </Text>
                    <Text style={styles.paginationSubtext}>
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    </Text>
                  </View>
                  <View style={styles.paginationButtons}>
                    <TouchableOpacity
                      style={[
                        styles.paginationButton,
                        currentPage === 1 && styles.paginationButtonDisabled,
                      ]}
                      onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons
                        name="chevron-left"
                        size={24}
                        color={currentPage === 1 ? "#8E8E93" : "#FFFFFF"}
                      />
                      <Text
                        style={[
                          styles.paginationButtonText,
                          currentPage === 1 && styles.paginationButtonTextDisabled,
                        ]}
                      >
                        Previous
                      </Text>
                    </TouchableOpacity>

                    {/* Page Numbers */}
                    <View style={styles.pageNumbersContainer}>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <TouchableOpacity
                            key={pageNum}
                            style={[
                              styles.pageNumberButton,
                              currentPage === pageNum && styles.pageNumberButtonActive,
                            ]}
                            onPress={() => setCurrentPage(pageNum)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.pageNumberText,
                                currentPage === pageNum && styles.pageNumberTextActive,
                              ]}
                            >
                              {pageNum}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.paginationButton,
                        currentPage === totalPages && styles.paginationButtonDisabled,
                      ]}
                      onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.paginationButtonText,
                          currentPage === totalPages && styles.paginationButtonTextDisabled,
                        ]}
                      >
                        Next
                      </Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color={currentPage === totalPages ? "#8E8E93" : "#FFFFFF"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  // Main container with dark space theme background
  container: {
    flex: 1,
    backgroundColor: "#0A0E27", // Deep space dark blue
  },
  // Background container for animated elements
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  // Scroll view for content
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Center container for loading/error
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0E27",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    marginTop: 12,
    textAlign: "center",
  },
  // Animated star style
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    shadowColor: "#FFFFFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  // Animated moon style
  moon: {
    position: "absolute",
    backgroundColor: "#F5F5DC", // Moon color
    shadowColor: "#F5F5DC",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  // Header section
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  // Statistics container
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A1F3A",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2F4A",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
  },
  statIconDeposit: {
    borderColor: "#34C759",
    backgroundColor: "rgba(52, 199, 89, 0.15)",
  },
  statIconWithdraw: {
    borderColor: "#FF3B30",
    backgroundColor: "rgba(255, 59, 48, 0.15)",
  },
  statIconTransfer: {
    borderColor: "#007AFF",
    backgroundColor: "rgba(0, 122, 255, 0.15)",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "500",
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // Filter toggle
  filterToggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterToggleButton: {
    backgroundColor: "#1A1F3A",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  filterToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  filterBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Filter card
  filterCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2F4A",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
    letterSpacing: 0.5,
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
  userFilterContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0E27",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2F4A",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 12,
  },
  typeButtonsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2A2F4A",
    backgroundColor: "#0A0E27",
    minWidth: 100,
    justifyContent: "center",
    gap: 6,
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
    borderColor: "#007AFF",
  },
  typeButtonIcon: {
    marginRight: 0,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  typeButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8E8E93",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // List container
  listContainer: {
    paddingTop: 10,
  },
  // Empty state
  emptyContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
  clearFiltersButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#007AFF",
    borderRadius: 12,
  },
  clearFiltersButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Pagination
  paginationContainer: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  paginationInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  paginationText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  paginationSubtext: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  paginationButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    gap: 6,
  },
  paginationButtonDisabled: {
    backgroundColor: "#2A2F4A",
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  paginationButtonTextDisabled: {
    color: "#8E8E93",
  },
  pageNumbersContainer: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  pageNumberButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#0A0E27",
    borderWidth: 1,
    borderColor: "#2A2F4A",
    justifyContent: "center",
    alignItems: "center",
  },
  pageNumberButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  pageNumberTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
