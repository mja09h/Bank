import api from ".";
import UserInfo from "../types/userInfo";
import { getToken, storeToken, removeToken } from "./storage";

const login = async (userInfo: UserInfo) => {
  const { data } = await api.post("/auth/login", userInfo);
  await storeToken(data.token);
  return data;
};
const register = async (userInfo: UserInfo) => {
  const formData = new FormData();

  formData.append("username", userInfo.username);
  formData.append("password", userInfo.password);
  formData.append("image", {
    uri: userInfo.image,
    name: userInfo.image,
    type: "image/jpeg",
  } as any);
  const response = await api.post("/auth/register", formData);
  await storeToken(response.data.token);
  return response.data;
};

const getAllUsers = async () => {
    const { data } = await api.get("/auth/users");
    return data;
};

const getUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

export { register, login, getAllUsers, getUser };
