import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const _layout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="transfer" options={{ headerShown: false }} />
      <Stack.Screen name="deposit-link" options={{ headerShown: false }} />
      <Stack.Screen name="deposit-code" options={{ headerShown: false }} />
      <Stack.Screen name="generate-code" options={{ headerShown: false }} />
      <Stack.Screen name="deposit-codes-list" options={{ headerShown: false }} />
      <Stack.Screen name="enter-code" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _layout;
