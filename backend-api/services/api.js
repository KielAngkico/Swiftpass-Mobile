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
  const token = await AsyncStorage.getItem("accessToken");

  if (token) {
    console.log("📨 Sending request with token:", token);
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No token found in AsyncStorage, request will be unauthenticated");
  }

  console.log("➡️ Request:", {
    url: config.baseURL + config.url,
    method: config.method,
    headers: config.headers,
    data: config.data,
  });

  return config;
});

API.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("❌ API Error Response:", {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {

      console.error("❌ API No Response:", error.request);
    } else {

      console.error("❌ API Setup Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
