import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Button,
  TextInput,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login as loginUser } from "../../api/auth";
import UserInfo from "../../types/userInfo";
import { storeToken } from "../../api/storage";
import { useRouter } from "expo-router";

const login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const { mutate: loginMutation, isPending } = useMutation({
    mutationKey: ["login"],
    mutationFn: (userInfo: UserInfo) => loginUser(userInfo),
    onSuccess: async (data) => {
      await storeToken(data.token);
      router.replace("/(protected)/(tabs)/(home)");
    },
    onError: (error: any) => {
      Alert.alert("Login Failed");
    },
  });

  const handleLogin = () => {
    if (username && password) {
      loginMutation({ username, password });
    } else {
      Alert.alert("Please username and password");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <Button
        title={isPending ? "Logging in..." : "Login"}
        onPress={handleLogin}
        disabled={isPending}
      />
    </ScrollView>
  );
};

export default login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 5,
    fontSize: 16,
  },
});
