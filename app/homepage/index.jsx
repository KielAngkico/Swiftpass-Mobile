import React, { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View, Text } from "react-native";

export default function HomepageRouter() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { email, rfid_tag, admin_id, system_type } = params;

  useEffect(() => {
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
  }, [system_type, email, rfid_tag, admin_id]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#FACC15" />
      <Text className="mt-4 text-gray-500">Routing to homepage...</Text>
    </View>
  );
}
