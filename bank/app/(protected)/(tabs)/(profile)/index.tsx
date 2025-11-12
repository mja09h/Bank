import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Button,
} from "react-native";
import React, { useContext } from "react";
import { Redirect, router } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUser } from "../../../../api/auth";
import { removeToken } from "../../../../api/storage";
import AuthContext from "../../../../context/authContext";

const index = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  });
  

  const { mutate: logout } = useMutation({
    mutationKey: ["logout"],
    mutationFn: async () => {
      await removeToken();
      setIsAuthenticated(false);
      router.replace("/(auth)/login");
    },
    onSuccess: () => {
      console.log("Logged out");
    },
    onError: (error) => {
      console.log(error);
    },
  });


  return (
    <ScrollView>
      <View style={styles.Header}>
        <Image
          source={{
            uri: "https://react-bank-project.eapi.joincoded.com/" + user?.image,
          }}
          style={styles.image}
        ></Image>
      </View>
      <View style={styles.body}>
        <Text style={styles.username}>Username: {user?.username}</Text>
        <Text style={styles.balance}>Balance: {user?.balance} KD</Text>
      </View>
      <View style={styles.footer}>
        <Button
          title="Edit Profile"
          onPress={() => router.push("/(protected)/(tabs)/(profile)/edit")}
        />
        <Button title="Logout" onPress={() => logout()} />
      </View>
    </ScrollView>
  );
};

export default index;

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  Header: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  body: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  balance: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
});
