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

export default api;