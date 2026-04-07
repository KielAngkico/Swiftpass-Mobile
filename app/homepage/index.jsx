import React, { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomepageRouter() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const redirect = async () => {
      let email = params.email;
      let system_type = params.system_type;
      let rfid_tag = params.rfid_tag;
      let admin_id = params.admin_id;

      // fallback to AsyncStorage if missing
      if (!email) email = await AsyncStorage.getItem("email");
      if (!system_type) system_type = await AsyncStorage.getItem("system_type");
      if (!rfid_tag) rfid_tag = await AsyncStorage.getItem("rfid_tag");
      if (!admin_id) admin_id = await AsyncStorage.getItem("admin_id");

      if (!email || !system_type) {
        console.warn("Missing system_type or email. Redirecting to /login.");
        router.replace("/login");
        return;
      }

      const routeMap = {
        prepaid_entry: "/homepage/PrepaidHomepage",
        subscription: "/homepage/SubscriptionHomepage",
      };

      const routeBase = routeMap[system_type] || "/Homepage";

      console.log(`📍 Redirecting to: ${routeBase}`);

      router.replace(
        `${routeBase}?email=${encodeURIComponent(email)}&rfid_tag=${encodeURIComponent(
          rfid_tag || ""
        )}&admin_id=${admin_id || ""}&system_type=${encodeURIComponent(system_type)}`
      );
    };

    redirect();
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#FACC15" />
      <Text className="mt-4 text-gray-500">Routing to homepage...</Text>
    </View>
  );
}
