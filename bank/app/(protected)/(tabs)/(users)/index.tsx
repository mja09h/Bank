import { ScrollView, StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllUsers } from '../../../../api/auth'

const index = () => {
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => getAllUsers(),
    });

  return (
    <ScrollView>
      <View style={styles.Header}>
        <Text style={styles.title}>Users</Text>
      </View>
      <View style={styles.body}>

        {users?.map((user: any) => (
            <View style={styles.user} key={user.id}>
                <Image source={require('../../../../assets/icon.png')} style={styles.image}></Image>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.balance}>{user.balance} KD</Text>
            </View>
        ))}

      </View>
    </ScrollView>
  )
}

export default index

const styles = StyleSheet.create({
    Header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    title: {
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
    user: {
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
    balance: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
    },
})