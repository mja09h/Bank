import api from "."
import UserInfo from "../types/userInfo"

const register = async (userInfo: UserInfo) => {
    const formData = new FormData();

    formData.append('username', userInfo.username);
    formData.append('password', userInfo.password);
    formData.append('image', {
        uri: userInfo.image,
        name: userInfo.image,
        type: 'image/jpeg',
    } as any);
    const response = await api.post('/auth/register', formData);
    return response.data;
}



export { register };

