import { Button, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router';

const index = () => {
    const router = useRouter();
  return (
    <View>
      <Text>Dev</Text>
      <Button title="Login" onPress={() => router.push('/login')} />
      <Button title="Register" onPress={() => router.push('/register')} />  
      <Button title="Home" onPress={() => router.push('/home')} />
      <Button title="Profile" onPress={() => router.push('/profile')} />
    </View>
  )
}

export default index

const styles = StyleSheet.create({})