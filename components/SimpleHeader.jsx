import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";   
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";



export default function SimpleHeader({ title = "Back" }) {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={["top"]} className="bg-gray-900 border-b border-white">
      <View className="flex-row items-center justify-center h-14 px-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-3 p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-semibold">{title}</Text>
      </View>
    </SafeAreaView>
  );
}
