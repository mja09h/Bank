import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../../../api/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import RocketLoader from "../../../../components/RocketLoader";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Users Screen Component
 * Displays all users in a grid layout
 * Styled with Orbit theme - dark space aesthetic matching the app
 */
const index = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 30;

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

  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
  });

  // Handle different response structures
  // The API might return: { users: [...] } or { data: [...] } or directly [...]
  const allUsers = useMemo(() => {
    if (!usersData) return [];
    return Array.isArray(usersData)
      ? usersData
      : usersData?.users || usersData?.data || [];
  }, [usersData]);

  // Filter users based on search query
  const users = useMemo(() => {
    if (!searchQuery.trim()) {
      return allUsers;
    }
    return allUsers.filter((user: any) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allUsers, searchQuery]);

  // Calculate number of columns based on screen width
  // Large screens (> 600px): 3 columns
  // Medium screens (400-600px): 2 columns
  // Small screens (< 400px): 1 column
  const getColumnsPerRow = () => {
    if (width > 600) return 3;
    if (width > 400) return 2;
    return 1;
  };

  const columnsPerRow = getColumnsPerRow();

  // Calculate width percentage for each box based on columns
  const getBoxWidth = () => {
    if (columnsPerRow === 3) return "30%";
    if (columnsPerRow === 2) return "48%";
    return "95%"; // 1 column
  };

  const boxWidth = getBoxWidth();

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);

  if (isLoading) {
    return <RocketLoader message="Loading users..." size="large" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Error loading users</Text>
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>
            {searchQuery
              ? `${users.length} ${
                  users.length === 1 ? "result" : "results"
                } found`
              : `${users.length} ${
                  users.length === 1 ? "user" : "users"
                } available`}
          </Text>
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
              }}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                }}
              >
                <MaterialIcons name="close" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Users Grid */}
        <View style={styles.body}>
          {users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="person-off" size={48} color="#8E8E93" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No users found matching your search"
                  : "No users found"}
              </Text>
            </View>
          ) : (
            <>
              {paginatedUsers.map((user: any, index: number) => (
                <TouchableOpacity
                  key={user.id || user._id || index}
                  style={[styles.userCard, { width: boxWidth }]}
                  onPress={() => {
                    const userId = user.id || user._id || user.username;
                    router.push(`/(protected)/(tabs)/(users)/${userId}`);
                  }}
                  activeOpacity={0.8}
                >
                  {user?.image && user.image.trim() !== "" ? (
                    <Image
                      source={{
                        uri:
                          "https://react-bank-project.eapi.joincoded.com/" +
                          user.image,
                      }}
                      style={styles.userImage}
                      onError={() => {
                        // If image fails to load, it will fallback to placeholder
                      }}
                    />
                  ) : (
                    <View style={styles.userImagePlaceholder}>
                      <Text style={styles.userImagePlaceholderText}>
                        {user.username?.charAt(0)?.toUpperCase() || "?"}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{user.username}</Text>
                    <Text style={styles.balance}>
                      {user.balance || 0} KD
                    </Text>
                  </View>
                  <MaterialIcons
                    name="arrow-forward"
                    size={20}
                    color="#007AFF"
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>
              ))}

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
                              <Text style={styles.paginationEllipsis}>...</Text>
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
                      color={currentPage === totalPages ? "#8E8E93" : "#FFFFFF"}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Page Info */}
              {users.length > 0 && (
                <Text style={styles.pageInfo}>
                  Showing {startIndex + 1}-{Math.min(endIndex, users.length)} of{" "}
                  {users.length} users
                </Text>
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
    backgroundColor: "#0A0E27", // Dark space background
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
  scrollView: {
    flex: 1,
    zIndex: 1,
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
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  // Search section
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1F3A",
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  // Users grid container
  body: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  // User card - dark theme with orbit styling
  userCard: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 15,
    marginHorizontal: 5,
    padding: 16,
    backgroundColor: "#1A1F3A", // Dark card background
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 100,
    position: "relative",
  },
  // User image - circular
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30, // Perfect circle
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  userImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  userImagePlaceholderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  // User info container
  userInfo: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  // Username text
  username: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 6,
    textAlign: "center",
  },
  // Balance text
  balance: {
    fontSize: 14,
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "600",
  },
  // Arrow icon for navigation
  arrowIcon: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  // Center container for loading/error states
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    color: "#8E8E93",
    fontSize: 16,
    marginTop: 12,
  },
  // Error text styling
  errorText: {
    color: "#FF3B30",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  // Empty state container
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    width: "100%",
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 12,
  },
  // Pagination styles
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 10,
    width: "100%",
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1F3A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
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
    borderWidth: 2,
    borderColor: "#007AFF",
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
    width: "100%",
  },
});
