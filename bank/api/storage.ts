import AsyncStorage from '@react-native-async-storage/async-storage';

const storeToken = async (token: string) => {
    try {
    await AsyncStorage.setItem('token', token);
    } catch (error) {
        console.error('Error storing token:', error);
    }
};

const getToken = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        return token;
    } catch (error) {
        console.error('Error getting token:', error);
    }
};

const removeToken = async () => {
    try {
        await AsyncStorage.removeItem('token');
    } catch (error) {
        console.error('Error removing token:', error);
    }
};

export { storeToken, getToken, removeToken };