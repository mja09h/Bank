import axios from 'axios'
import { Platform } from 'react-native';
import { getToken } from './storage';

// Use local backend for deposit codes, or the main API for other endpoints
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, use localhost
// For physical device, use your computer's IP address (192.168.8.102 from Flask output)
const getDepositCodesApiUrl = () => {
    if (!__DEV__) {
        return 'http://your-server.com:5000'; // Production server
    }

    // In development, detect platform
    if (Platform.OS === 'android') {
        // Try IP first (for physical device), fallback to emulator address
        return 'http://192.168.8.102:5000'; // Change this to your computer's IP if different
        // Alternative for Android emulator: 'http://10.0.2.2:5000'
    } else if (Platform.OS === 'ios') {
        return 'http://localhost:5000'; // iOS simulator
    } else {
        // Web or other platforms
        return 'http://localhost:5000';
    }
};

const DEPOSIT_CODES_API_URL = getDepositCodesApiUrl();

// Log the API URL for debugging
console.log('🔗 Deposit Codes API URL:', DEPOSIT_CODES_API_URL);
console.log('📱 Platform:', Platform.OS);

const api = axios.create({
    baseURL: 'https://react-bank-project.eapi.joincoded.com/mini-project/api'
});

// Separate API instance for deposit codes (local Flask backend)
export const depositCodesApi = axios.create({
    baseURL: DEPOSIT_CODES_API_URL,
});

// Add request interceptor for deposit codes API to log requests
depositCodesApi.interceptors.request.use(
    (request) => {
        console.log('📤 Deposit Code Request:', {
            method: request.method,
            url: request.url,
            baseURL: request.baseURL,
            data: request.data,
        });
        return request;
    },
    (error) => {
        console.error('❌ Deposit Code Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for deposit codes API
depositCodesApi.interceptors.response.use(
    (response) => {
        console.log('✅ Deposit Code Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
        });
        return response;
    },
    (error) => {
        console.error('❌ Deposit Code Response Error:', {
            message: error.message,
            status: error.response?.status,
            url: error.config?.url,
            data: error.response?.data,
        });
        return Promise.reject(error);
    }
);

api.interceptors.request.use(async (request) => {
    const token = await getToken();
    if (token) {
        request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
});

// Response interceptor - logs incoming responses
api.interceptors.response.use(
    (response) => {
        console.log('✅ RESPONSE:', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            data: response.data,
            headers: response.headers,
        });
        return response;
    },
    (error) => {
        console.log('❌ RESPONSE ERROR:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            data: error.response?.data,
        });
        return Promise.reject(error);
    }
);

export default api;