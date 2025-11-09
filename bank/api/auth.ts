import api from "."
import UserInfo from "../types/userInfo"

const register = async (userInfo: UserInfo) => {
    const response = await api.post('/register', userInfo);
    return response.data;
}


export { register };

