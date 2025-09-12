import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-gray-900 px-6">
      <Text className="text-5xl font-extrabold text-white mb-3 tracking-tight text-center">
        SwiftPass
      </Text>
      <Text className="text-lg text-white mb-16 text-center font-medium">
        The Perfect Fitness App
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/login")}
        className="bg-blue-300 w-full rounded-2xl py-5 shadow-lg"
        activeOpacity={0.85}
      >
        <Text className="text-center text-white text-xl font-semibold tracking-wide">
          Start Training
        </Text>
      </TouchableOpacity>
    </View>
  );
}
