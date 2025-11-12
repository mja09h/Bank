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
} from "react-native";
import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../../../api/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </View>
    );
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
                  <Image
                    source={{
                      uri:
                        "https://react-bank-project.eapi.joincoded.com/" +
                        user?.image,
                    }}
                    style={styles.userImage}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{user.username}</Text>
                    <Text style={styles.balance}>{user.balance || 0} KD</Text>
                  </View>
                  <MaterialIcons
                    name="arrow-forward"
                    size={20}
                    color="#8E8E93"
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
  scrollView: {
    flex: 1,
  },
  // Header section
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 20,
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
    minWidth: 100,
    position: "relative",
  },
  // User image - circular
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30, // Perfect circle
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#2A2F4A",
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
    color: "#8E8E93",
    textAlign: "center",
    fontWeight: "500",
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
    width: "100%",
  },
});
