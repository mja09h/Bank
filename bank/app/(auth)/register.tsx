import { StyleSheet, Text, View, ScrollView, Button } from 'react-native'
import React from 'react'


const register = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Input
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      <Input
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Input
        placeholder="Image"
        value={image}
        onChangeText={setImage}
      />

      <Button title="Register" onPress={handleRegister} />
    </ScrollView>
  )
}

export default register

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },

})