import { ScrollView, StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'

const index = () => {
  return (
    <ScrollView>
      <View style={styles.Header}>
       <Image source={require('../../../../assets/icon.png')} style={styles.image}></Image>
       <Text style={styles.username}>John Doe</Text>
    </View>
    <View style={styles.body}>
        <Text style={styles.text}>Username: John Doe</Text>
    </View>
    <View style={styles.footer}>
        
    </View>
    </ScrollView>
  )
}

export default index

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
    },
    Header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },      
    username: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
    },
    body: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
})