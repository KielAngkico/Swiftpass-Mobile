import React, { useEffect } from "react";
import { View, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/welcome"); 
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Image
        source={require("../assets/images/Final_SwiftPass_Logo.jpg")}
        style={{ width: 400, height: 400, resizeMode: "contain" }}
      />
      <ActivityIndicator size="large" color="#FFC107" style={{ marginTop: 20 }} />
    </View>
  );
}
