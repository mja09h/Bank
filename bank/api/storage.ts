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

// Deposit Code Storage
export interface DepositCode {
    id: string;
    code: string;
    amount: number;
    type: 'get' | 'send'; // 'get' = to receive, 'send' = to send
    expiryDate: string;
    status: 'pending' | 'success' | 'failed' | 'expired';
    createdAt: string;
    userId?: string;
    recipientId?: string;
}

const DEPOSIT_CODES_KEY = 'deposit_codes';

const storeDepositCode = async (code: DepositCode) => {
    try {
        const codes = await getDepositCodes();
        codes.push(code);
        await AsyncStorage.setItem(DEPOSIT_CODES_KEY, JSON.stringify(codes));
    } catch (error) {
        console.error('Error storing deposit code:', error);
    }
};

const getDepositCodes = async (): Promise<DepositCode[]> => {
    try {
        const codesJson = await AsyncStorage.getItem(DEPOSIT_CODES_KEY);
        return codesJson ? JSON.parse(codesJson) : [];
    } catch (error) {
        console.error('Error getting deposit codes:', error);
        return [];
    }
};

const updateDepositCode = async (codeId: string, updates: Partial<DepositCode>) => {
    try {
        const codes = await getDepositCodes();
        const index = codes.findIndex(c => c.id === codeId);
        if (index !== -1) {
            codes[index] = { ...codes[index], ...updates };
            await AsyncStorage.setItem(DEPOSIT_CODES_KEY, JSON.stringify(codes));
        }
    } catch (error) {
        console.error('Error updating deposit code:', error);
    }
};

export { storeToken, getToken, removeToken, storeDepositCode, getDepositCodes, updateDepositCode };
