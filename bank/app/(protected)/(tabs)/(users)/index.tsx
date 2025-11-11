import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../../../api/auth";

const index = () => {
  const { width } = useWindowDimensions();
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
  const users = Array.isArray(usersData)
    ? usersData
    : usersData?.users || usersData?.data || [];

  console.log("Users data:", usersData);
  console.log("Processed users:", users);

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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading users</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.Header}>
        <Text style={styles.title}>Users</Text>
      </View>
      <View style={styles.body}>
        {users.length === 0 ? (
          <Text style={styles.emptyText}>No users found</Text>
        ) : (
          users.map((user: any, index: number) => (
            <View
              style={[styles.user, { width: boxWidth }]}
              key={user.id || user._id || index}
            >
              <Image
                source={require("../../../../assets/icon.png")}
                style={styles.image}
              ></Image>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.balance}>{user.balance || 0} KD</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default index;

const styles = StyleSheet.create({
  Header: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  body: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 10,
  },
  user: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 15,
    marginHorizontal: 5,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    minWidth: 100,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "column",
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  balance: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 40,
  },
});
