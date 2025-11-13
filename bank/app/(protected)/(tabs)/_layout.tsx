import { StyleSheet, Text, View } from 'react-native'
import React, { useContext } from 'react'
import { Redirect, Tabs } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import AuthContext from '../../../context/authContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const _layout = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1F3A', // Dark card background
          borderTopWidth: 1,
          borderTopColor: '#2A2F4A', // Subtle border
          height: 60 + Math.max(insets.bottom, 0), // Add bottom inset to push tabs outside SafeAreaView
          paddingBottom: Math.max(insets.bottom, 4), // Add bottom safe area padding
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#007AFF', // Blue accent
        tabBarInactiveTintColor: '#8E8E93', // Gray text
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
        <Tabs.Screen 
          name="index" 
          options={{ 
            headerShown: false, 
            tabBarItemStyle: { display: 'none' } 
          }} 
        />
        <Tabs.Screen
          name="(home)"
          options={{
            headerShown: false,
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <View style={[
                styles.iconContainer,
                focused && styles.iconContainerActive,
                { borderColor: focused ? '#007AFF' : 'transparent' }
              ]}>
                <MaterialIcons
                  name="home"
                  size={focused ? 26 : 24}
                  color={focused ? '#007AFF' : '#8E8E93'}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="(users)"
          options={{
            headerShown: false,
            title: 'Users',
            tabBarIcon: ({ focused }) => (
              <View style={[
                styles.iconContainer,
                focused && styles.iconContainerActive,
                { borderColor: focused ? '#007AFF' : 'transparent' }
              ]}>
                <MaterialIcons
                  name="people"
                  size={focused ? 26 : 24}
                  color={focused ? '#007AFF' : '#8E8E93'}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="(transactions)"
          options={{
            headerShown: false,
            title: 'Transactions',
            tabBarIcon: ({ focused }) => (
              <View style={[
                styles.iconContainer,
                focused && styles.iconContainerActive,
                { borderColor: focused ? '#007AFF' : 'transparent' }
              ]}>
                <MaterialIcons
                  name="history"
                  size={focused ? 26 : 24}
                  color={focused ? '#007AFF' : '#8E8E93'}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="(profile)"
          options={{
            headerShown: false,
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <View style={[
                styles.iconContainer,
                focused && styles.iconContainerActive,
                { borderColor: focused ? '#007AFF' : 'transparent' }
              ]}>
                <MaterialIcons
                  name="person"
                  size={focused ? 26 : 24}
                  color={focused ? '#007AFF' : '#8E8E93'}
                />
              </View>
            ),
          }}
        />
    </Tabs>
  )
}

export default _layout

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)', // Blue glow effect
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
})
