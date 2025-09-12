import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NavigationBar({ email, rfid_tag, system_type, admin_id }) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { key: "home", label: "Home", icon: "home", route: "/homepage" },
    { key: "history", label: "History", icon: "mail", route: "/ActivityHistory" },
    { key: "transactions", label: "Transactions", icon: "file-text", route: "/Transactions" },
  ];

  return (
    <SafeAreaView edges={["bottom"]} className="bg-gray-700 border-t border-gray-300 shadow-md">
      <View className="flex-row justify-around items-center px-6 py-3">
        {navItems.map(({ key, label, icon, route }) => {
          const isActive = pathname.toLowerCase().includes(route.toLowerCase());
          return (
            <TouchableOpacity
              key={key}
              onPress={() =>
                router.push({
                  pathname: route,
                  params: { email, rfid_tag, system_type, admin_id },
                })
              }
              className="items-center flex-1"
              activeOpacity={0.7}
            >
              <Feather
                name={icon}
                size={22}
                color={isActive ? "#ffffff" : "#6B7280"}
              />
              <Text
                className={`mt-0.5 text-[10px] font-semibold ${
                  isActive ? "text-white" : "text-gray-500"
                }`}
              >
                {label}
              </Text>
              {isActive && (
                <View className="h-1 w-6 bg-white rounded mt-0.5" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
