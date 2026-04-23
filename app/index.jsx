import React, { useEffect } from "react";
import { View, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const email = await AsyncStorage.getItem("email");
        const lastOtpVerified = await AsyncStorage.getItem("lastOtpVerified");

        if (token && email && lastOtpVerified) {
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          const otpTime = new Date(lastOtpVerified).getTime();
          
          if (otpTime > sevenDaysAgo) {
            router.replace("/login");
            return;
          }
        }

        if (token) {
          router.replace("/homepage");
        } else {
          router.replace("/login");
        }
      } catch (err) {
        console.error("Error checking login status:", err);
        router.replace("/welcome");
      }
    };

    const timer = setTimeout(checkLogin, 2000); 
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Image
        source={require("../assets/images/Final_SwiftPass_Logo.png")}
        style={{ width: 400, height: 400, resizeMode: "contain" }}
      />
      <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 10 }} />
    </View>
  );
}