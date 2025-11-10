import { StyleSheet, Text, View, ScrollView, Button, TextInput, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import UserInfo from '../../types/userInfo';
import { useMutation } from '@tanstack/react-query';
import { register } from '../../api/auth';
import * as ImagePicker from 'expo-image-picker';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [image, setImage] = useState('');


  const { mutate: registerMutation } = useMutation({
    mutationKey: ['register'],
    mutationFn: (userInfo: UserInfo) => register(userInfo),

  });

  const handleRegister = () => {
    if (password && username && image) {
      registerMutation({ username, password, image });
    }
  }

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={{ marginTop: 20 }} onPress={pickImage}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            ) : (
              <Text style={{ fontSize: 16 }}>
                Upload Profile Image
              </Text>
            )}
      </TouchableOpacity>

      <Button title="Register" onPress={handleRegister} />
    </ScrollView>
  )
}

export default Register

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    button: {
      backgroundColor: 'blue',
      color: 'white',
      padding: 10,
      borderRadius: 5,
      marginTop: 20,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      textAlign: 'center',
    },

  })