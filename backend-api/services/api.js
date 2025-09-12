import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const baseURL = Constants.expoConfig.extra?.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  console.warn("⚠️ No API URL found in Expo extra. Check your app.json");
}

const API = axios.create({
  baseURL,
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
