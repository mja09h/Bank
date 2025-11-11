import { StyleSheet, Text, View } from 'react-native'
import React, { useContext } from 'react'
import { Redirect, Tabs } from 'expo-router'
import AuthContext from '../../../context/authContext';

const _layout = () => {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ headerShown: false }} />
        <Tabs.Screen name="(home)/index" options={{ headerShown: false }} />
        <Tabs.Screen name="(profile)/index" options={{ headerShown: false }} />
        
    </Tabs>
  )
}

export default _layout

const styles = StyleSheet.create({

})