import axios from 'axios'

const api = axios.create({
    baseURL: 'https://react-bank-project.eapi.joincoded.com/mini-project/api/'
});

export default api;