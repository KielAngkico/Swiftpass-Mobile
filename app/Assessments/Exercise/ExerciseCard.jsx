import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import { getFullPhotoUrl } from "../../../backend-api/services/Exercise_host";
export default function ExerciseCard({ visible, exercise, onClose }) {
  if (!exercise) return null;
  console.log("Full exercise:", JSON.stringify(exercise, null, 2));
  console.log("Raw image_url:", exercise.image_url);
  console.log("Built URL:", getFullPhotoUrl(exercise.image_url));
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/80 justify-center px-4">
        <View className="bg-gray-900 rounded-2xl max-h-[90%] shadow-2xl border border-gray-700">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-gray-700">
            <Text className="text-2xl font-bold text-white flex-1 pr-4">
              {exercise.name}
            </Text>
            <TouchableOpacity 
              onPress={onClose}
              className="bg-gray-800 w-10 h-10 rounded-full items-center justify-center"
            >
              <Text className="text-gray-300 text-xl">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Exercise GIF/Image */}
            {exercise.image_url && (
              <View className="px-6 pt-4">
                <Image
                  source={{ uri: getFullPhotoUrl(exercise.image_url) }}
                  style={{ 
                    width: '100%', 
                    height: 240, 
                    borderRadius: 16,
                    backgroundColor: '#1F2937'
                  }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              </View>
            )}

            {/* Exercise Details - Two Column Layout */}
            <View className="px-6 pt-6">
              <View className="flex-row space-x-3">
                {/* Column 1 */}
                <View className="flex-1 space-y-3">
                  {/* Muscle Group */}
                  <View className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <Text className="text-white text-xs uppercase mb-1">Muscle Group</Text>
                    <Text className="text-white text-base font-semibold capitalize">
                      {exercise.muscle_group}
                    </Text>
                  </View>

                  {/* Level */}
                  <View className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <Text className="text-white text-xs uppercase mb-1">Level</Text>
                    <Text className="text-white text-base font-semibold capitalize">
                      {exercise.level}
                    </Text>
                  </View>
                </View>

                {/* Column 2 */}
                <View className="flex-1 space-y-3">
                  {/* Equipment */}
                  {exercise.equipment && (
                    <View className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                      <Text className="text-white text-xs uppercase mb-1">Equipment</Text>
                      <Text className="text-white text-base font-semibold capitalize">
                        {exercise.equipment}
                      </Text>
                    </View>
                  )}

                  {/* Type */}
                  <View className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <Text className="text-white text-xs uppercase mb-1">Type</Text>
                    <Text className="text-white text-base font-semibold capitalize">
                      {exercise.exercise_type}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sub Target - Full Width if exists */}
              {exercise.sub_target && (
                <View className="bg-gray-800 rounded-xl p-4 border border-gray-700 mt-3">
                  <Text className="text-white text-xs uppercase mb-1">Sub Target</Text>
                  <Text className="text-white text-base font-semibold capitalize">
                    {exercise.sub_target}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Close Button at Bottom */}
          <View className="px-6 pb-6 pt-4 border-t border-gray-700">
            <TouchableOpacity
              onPress={onClose}
              className="bg-blue-600 py-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-base">Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}