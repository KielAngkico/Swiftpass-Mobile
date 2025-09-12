import React from "react";
import { Modal, View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { getFullPhotoUrl } from "../../../backend-api/services/Exercise_host";

export default function ExerciseCard({ visible, exercise, onClose }) {
  if (!exercise) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black bg-opacity-50 justify-center px-4">
        <View className="bg-white rounded-xl max-h-[90%] p-5 shadow-lg">
   
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-purple-700 flex-shrink">
              {exercise.name}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 text-2xl">✖</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

            {exercise.image_url && (
<Image
  source={{ uri: getFullPhotoUrl(exercise.image_url, "exercises") }}
  className="w-full h-40 rounded-xl mb-3"
/>

            )}


            <View className="space-y-2">
              <Text>
                <Text className="font-semibold text-gray-800">Muscle Group: </Text>
                {exercise.muscle_group}
              </Text>
              <Text>
                <Text className="font-semibold text-gray-800">Sub Target: </Text>
                {exercise.sub_target}
              </Text>
              <Text>
                <Text className="font-semibold text-gray-800">Level: </Text>
                {exercise.level}
              </Text>
              <Text>
                <Text className="font-semibold text-gray-800">Type: </Text>
                {exercise.exercise_type}
              </Text>
              <Text>
                <Text className="font-semibold text-gray-800">Equipment: </Text>
                {exercise.equipment}
              </Text>

              <View className="mt-3">
                <Text className="font-semibold text-gray-800 mb-1">Instructions:</Text>
                <Text className="text-gray-700 whitespace-pre-wrap">
                  {exercise.instructions}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
