import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const index = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.text}>index</Text>
    </ScrollView>
  )
}

export default index

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
})