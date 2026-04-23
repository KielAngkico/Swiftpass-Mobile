import { View, Text, ScrollView, Image } from "react-native";

// Import coach image
const Coach = require('../../../assets/images/coachJehad.jpg');

export default function TrainerTab() {
  return (
    <ScrollView className="px-6 py-6">
      <View className="bg-gray-800 rounded-2xl p-6 mb-5 shadow-xl items-center">
        <Text className="text-white text-2xl font-bold mb-2">Certified Fitness Trainer</Text>
        <Text className="text-gray-400  text-sm mb-4">
          The training guidance and exercise programs in this module were designed 
          in collaboration with certified fitness trainers to ensure safe and effective 
          workouts for all fitness levels.
        </Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <View className="bg-gray-700 rounded-xl overflow-hidden mb-3">
          <Image 
            source={Coach}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-white text-lg font-bold text-center mb-1">Coach Jehad</Text>
        <Text className="text-gray-300  text-sm leading-5 mb-4">
          A certified fitness professional passionate about helping individuals achieve 
          their goals through structured workout programs, proper exercise form, 
          and sustainable fitness routines.
        </Text>
      </View>

      {/* Specialties */}
<View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
  <Text className="text-white text-lg font-bold mb-3 text-center">Specialties</Text>

  <View className="flex-row justify-between">
    {/* Column 1 */}
    <View className="space-y-2 w-[48%]">
      <View className="flex-row items-center mb-2">
        <Text className="text-blue-400 text-base mr-2">•</Text>
        <Text className="text-gray-300 text-sm">Strength Training</Text>
      </View>
      <View className="flex-row items-center mb-2">
        <Text className="text-blue-400 text-base mr-2">•</Text>
        <Text className="text-gray-300 text-sm">Bodybuilding</Text>
      </View>
      <View className="flex-row items-center mb-2">
        <Text className="text-blue-400 text-base mr-2">•</Text>
        <Text className="text-gray-300 text-sm">Gain Weight</Text>
      </View>
    </View>

    {/* Column 2 */}
    <View className="space-y-2 w-[48%]">
      <View className="flex-row items-center mb-2">
        <Text className="text-blue-400 text-base mr-2">•</Text>
        <Text className="text-gray-300 text-sm">Weight Loss</Text>
      </View>
      <View className="flex-row items-center">
        <Text className="text-blue-400 text-base mr-2">•</Text>
        <Text className="text-gray-300 text-sm">Circuit Training</Text>
      </View>
    </View>
  </View>
</View>


      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-2 text-center">Training Philosophy</Text>
        <Text className="text-gray-300 text-sm leading-5 ">
          "Fitness is not about perfection — it is about Consistency, Quality, Balance Lifestyle. 
          That's how real results are made."
        </Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-10 shadow-xl">
        <Text className="text-white text-lg font-bold text-center mb-2">Special Thanks</Text>
        <Text className="text-gray-300 text-sm leading-5">
          Special thanks to our certified trainers for their continuous support 
          and expertise in developing SwiftPass exercise materials and ensuring 
          the safety and effectiveness of all training programs.
        </Text>
      </View>
    </ScrollView>
  );
}