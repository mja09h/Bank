import api from ".";
import UserInfo from "../types/userInfo";
import { getToken, storeToken, removeToken } from "./storage";

const login = async (userInfo: UserInfo) => {
  const { data } = await api.post("/auth/login", userInfo);
  await storeToken(data.token);
  return data;
};
const register = async (userInfo: UserInfo) => {
  try {
    const formData = new FormData();
    console.log("userInfo in register", userInfo);
    formData.append("username", userInfo.username);
    formData.append("password", userInfo.password);
    formData.append("image", {
      uri: userInfo.image,
      name: "image.jpg",
      type: "image/jpeg",
    } as any);


    const response = await api.post("/auth/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    await storeToken(response.data.token);
    return response.data;
  }
  catch (error) {
    console.log(error);
  }
};

const getAllUsers = async () => {
  const { data } = await api.get("/auth/users");
  return data;
};

const getUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

const updateProfile = async (imageUri: string) => {
  try {
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      name: "image.jpg",
      type: "image/jpeg",
    } as any);

    const response = await api.put("/auth/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getUserById = async (userId: string) => {
  try {
    const { data } = await api.get(`/auth/user/${userId}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export { register, login, getAllUsers, getUser, updateProfile, getUserById };
