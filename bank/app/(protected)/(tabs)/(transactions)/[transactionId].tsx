import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getMyTransactions } from "../../../../api/transactions";
import { getUserById } from "../../../../api/auth";
import Transaction from "../../../../types/transaction";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Transaction Detail Screen Component
 * Displays detailed information about a specific transaction
 * Styled with Orbit theme - dark space aesthetic matching the app
 */

const TransactionDetail = () => {
  const params = useLocalSearchParams();
  console.log("All route params:", params);
  
  // Handle both string and array cases from expo-router
  // Also try different parameter names that expo-router might use
  let transactionId: string | undefined;
  
  if (params.transactionId) {
    transactionId = Array.isArray(params.transactionId) 
      ? params.transactionId[0] 
      : params.transactionId;
  } else if (params.id) {
    transactionId = Array.isArray(params.id) ? params.id[0] : params.id;
  } else {
    // Get the last segment from the route
    const segments = params as any;
    transactionId = segments[Object.keys(segments)[0]] as string;
  }
  
  // Decode URL encoding if present
  if (transactionId) {
    try {
      transactionId = decodeURIComponent(String(transactionId));
    } catch (e) {
      // If decoding fails, use as is
      transactionId = String(transactionId);
    }
  }
  
  console.log("Extracted transactionId:", transactionId);

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getMyTransactions(),
  });

  // Find the specific transaction - check both id and _id fields
  const transaction = React.useMemo(() => {
    console.log("Looking for transaction ID:", transactionId);
    console.log("Transaction ID type:", typeof transactionId);
    
    if (!transactions || !transactionId) {
      console.log("No transactions or transactionId:", { transactions: !!transactions, transactionId });
      return null;
    }
    
    console.log("Total transactions:", transactions.length);
    console.log("First transaction sample:", transactions[0] ? {
      id: transactions[0].id,
      _id: transactions[0]._id,
      type: transactions[0].type,
      amount: transactions[0].amount
    } : "No transactions");
    
    const searchId = String(transactionId).trim();
    console.log("Searching for ID (string):", searchId);
    
    const found = transactions.find((t: any) => {
      const tId = t.id || t._id;
      const compareId = String(tId).trim();
      const matches = compareId === searchId;
      
      if (matches) {
        console.log("Found transaction match!");
      }
      
      return matches;
    });
    
    // Debug logging
    if (!found && transactions.length > 0) {
      console.log("Transaction not found. Looking for:", searchId);
      console.log("Available IDs (first 10):", transactions.slice(0, 10).map((t: any) => ({
        id: t.id,
        _id: t._id,
        idString: String(t.id || t._id),
        matches: String(t.id || t._id).trim() === searchId
      })));
    }
    
    return found;
  }, [transactions, transactionId]);

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

  const formatFullDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      iso: date.toISOString(),
      timestamp: date.getTime(),
    };
  };

  // Get user IDs from transaction
  const fromUserId = (transaction as any)?.fromUserId || (transaction as any)?.from;
  const toUserId = (transaction as any)?.toUserId || (transaction as any)?.to;

  // Fetch from user details (for all transaction types that have fromUserId)
  const { data: fromUser, isLoading: isLoadingFromUser } = useQuery({
    queryKey: ["user", fromUserId],
    queryFn: () => getUserById(fromUserId),
    enabled: !!fromUserId,
  });

  // Fetch to user details (for all transaction types that have toUserId)
  const { data: toUser, isLoading: isLoadingToUser } = useQuery({
    queryKey: ["user", toUserId],
    queryFn: () => getUserById(toUserId),
    enabled: !!toUserId,
  });

  const createdAtInfo = formatFullDate(transaction?.createdAt);
  const updatedAtInfo = formatFullDate((transaction as any)?.updatedAt);

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading transaction...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Failed to load transaction</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.9}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!transaction && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Transaction not found</Text>
          <Text style={styles.debugText}>ID: {transactionId}</Text>
          <Text style={styles.debugText}>
            Total transactions: {transactions?.length || 0}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.9}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading transaction...</Text>
        </View>
      </View>
    );
  }

  const color = getTypeColor(transaction.type);
  const iconName = getTypeIcon(transaction.type);

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
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Transaction Type Card */}
        <View style={styles.typeCard}>
          <View style={[styles.typeIconContainer, { borderColor: color }]}>
            <MaterialIcons name={iconName as any} size={48} color={color} />
          </View>
          <Text style={styles.typeLabel}>{getTypeLabel(transaction.type)}</Text>
          <Text style={[styles.typeAmount, { color }]}>
            {transaction.type === "deposit" ? "+" : "-"}
            {transaction.amount} KD
          </Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusContent}>
            <MaterialIcons name="check-circle" size={28} color="#34C759" />
            <View style={styles.statusText}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={styles.statusValue}>Completed</Text>
            </View>
          </View>
        </View>

        {/* From User Card */}
        {fromUserId && (
          <View style={styles.userCard}>
            <Text style={styles.cardTitle}>From</Text>
            {isLoadingFromUser ? (
              <View style={styles.userLoadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.userLoadingText}>Loading user...</Text>
              </View>
            ) : fromUser ? (
              <View style={styles.userInfoContainer}>
                {fromUser.image && (
                  <Image
                    source={{
                      uri: "https://react-bank-project.eapi.joincoded.com/" + fromUser.image,
                    }}
                    style={styles.userImage}
                  />
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{fromUser.username || "Unknown"}</Text>
                  {fromUser.balance !== undefined && (
                    <Text style={styles.userBalance}>Balance: {fromUser.balance} KD</Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.userErrorText}>User not found</Text>
            )}
          </View>
        )}

        {/* To User Card */}
        {toUserId && (
          <View style={styles.userCard}>
            <Text style={styles.cardTitle}>To</Text>
            {isLoadingToUser ? (
              <View style={styles.userLoadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.userLoadingText}>Loading user...</Text>
              </View>
            ) : toUser ? (
              <View style={styles.userInfoContainer}>
                {toUser.image && (
                  <Image
                    source={{
                      uri: "https://react-bank-project.eapi.joincoded.com/" + toUser.image,
                    }}
                    style={styles.userImage}
                  />
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{toUser.username || "Unknown"}</Text>
                  {toUser.balance !== undefined && (
                    <Text style={styles.userBalance}>Balance: {toUser.balance} KD</Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.userErrorText}>User not found</Text>
            )}
          </View>
        )}

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Transaction Information</Text>

          {/* Transaction ID */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <MaterialIcons name="fingerprint" size={20} color="#8E8E93" />
              <Text style={styles.detailLabel}>Transaction ID</Text>
            </View>
            <Text style={styles.detailValue}>{transaction.id || transaction._id || "N/A"}</Text>
          </View>

          {/* Created At Date */}
          {createdAtInfo && (
            <>
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <MaterialIcons name="calendar-today" size={20} color="#8E8E93" />
                  <Text style={styles.detailLabel}>Created Date</Text>
                </View>
                <Text style={styles.detailValue}>{createdAtInfo.date}</Text>
              </View>

              {/* Created At Time */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <MaterialIcons name="schedule" size={20} color="#8E8E93" />
                  <Text style={styles.detailLabel}>Created Time</Text>
                </View>
                <Text style={styles.detailValue}>{createdAtInfo.time}</Text>
              </View>
            </>
          )}

          {/* Updated At Date */}
          {updatedAtInfo && (
            <>
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <MaterialIcons name="update" size={20} color="#8E8E93" />
                  <Text style={styles.detailLabel}>Updated Date</Text>
                </View>
                <Text style={styles.detailValue}>{updatedAtInfo.date}</Text>
              </View>

              {/* Updated At Time */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <MaterialIcons name="access-time" size={20} color="#8E8E93" />
                  <Text style={styles.detailLabel}>Updated Time</Text>
                </View>
                <Text style={styles.detailValue}>{updatedAtInfo.time}</Text>
              </View>
            </>
          )}

          {/* Amount */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <MaterialIcons name="attach-money" size={20} color="#8E8E93" />
              <Text style={styles.detailLabel}>Amount</Text>
            </View>
            <Text style={[styles.detailValue, { color, fontWeight: "bold" }]}>
              {transaction.amount} KD
            </Text>
          </View>

          {/* Type */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <MaterialIcons name="category" size={20} color="#8E8E93" />
              <Text style={styles.detailLabel}>Type</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: `${color}20`, borderColor: color }]}>
              <Text style={[styles.typeBadgeText, { color }]}>
                {getTypeLabel(transaction.type)}
              </Text>
            </View>
          </View>

          {/* From */}
          {fromUserId && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialIcons name="person-outline" size={20} color="#8E8E93" />
                <Text style={styles.detailLabel}>From</Text>
              </View>
              <Text style={styles.detailValue}>
                {isLoadingFromUser ? "Loading..." : fromUser?.username || fromUserId}
              </Text>
            </View>
          )}

          {/* To */}
          {toUserId && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialIcons name="person" size={20} color="#8E8E93" />
                <Text style={styles.detailLabel}>To</Text>
              </View>
              <Text style={styles.detailValue}>
                {isLoadingToUser ? "Loading..." : toUser?.username || toUserId}
              </Text>
            </View>
          )}

          {/* ISO Timestamp */}
          {createdAtInfo && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialIcons name="code" size={20} color="#8E8E93" />
                <Text style={styles.detailLabel}>ISO Timestamp</Text>
              </View>
              <Text style={styles.detailValueSmall}>{createdAtInfo.iso}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TransactionDetail;

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
    paddingBottom: 40,
  },
  // Center container for loading/error
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0E27",
    padding: 20,
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
    marginBottom: 20,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1F3A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  // Type card
  typeCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  typeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
  },
  typeLabel: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  typeAmount: {
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  // Details card
  detailsCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#2A2F4A",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2F4A",
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  detailValueSmall: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Status card
  statusCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#34C759",
    shadowColor: "#34C759",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    marginLeft: 16,
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#34C759",
  },
  // Back button
  backButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  debugText: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  // User card
  userCard: {
    backgroundColor: "#1A1F3A",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  userLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  userLoadingText: {
    color: "#8E8E93",
    fontSize: 14,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  userBalance: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  userErrorText: {
    color: "#FF3B30",
    fontSize: 14,
    paddingVertical: 20,
  },
});

