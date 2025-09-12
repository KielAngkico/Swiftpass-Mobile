import { View, Text, TouchableOpacity } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

export default function SimpleHeader({ title = "Back" }) {
  const navigation = useNavigation();

  return (
    <View className="flex-row items-center justify-center py-3 px-3 bg-black">
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="absolute left-3 p-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="arrow-left" size={22} color="white" />
      </TouchableOpacity>

      <Text className="text-white text-lg font-semibold">{title}</Text>
    </View>
  );
}
