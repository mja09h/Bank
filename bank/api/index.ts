import axios from 'axios'
import { getToken } from './storage';

const api = axios.create({
    baseURL: 'https://react-bank-project.eapi.joincoded.com/mini-project/api'
});

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