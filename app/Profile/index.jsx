import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { getFullPhotoUrl } from "../../backend-api/services/Media_host";

export default function ProfileModal({ visible, onClose, profile, system_type }) {
  const router = useRouter();
  const [imageKey, setImageKey] = useState(Date.now());

  // Update image key whenever modal opens or profile changes
  useEffect(() => {
    if (visible) {
      setImageKey(Date.now());
    }
  }, [visible, profile?.profile_image_url]);

  const photoUrl = profile?.profile_image_url 
    ? `${getFullPhotoUrl(profile.profile_image_url)}?t=${imageKey}`
    : null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/40 px-4">
        <View className="bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-lg p-6 border border-gray-100">

          <TouchableOpacity 
            onPress={onClose} 
            className="absolute top-3 right-3 z-10 p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-gray-300 text-2xl font-bold">✖</Text>
          </TouchableOpacity>

          <View className="flex-row items-center space-x-4 mb-6">
            <View className="w-24 h-24 bg-gray-700 rounded-xl items-center justify-center overflow-hidden">
              {photoUrl ? (
                <Image
                  key={imageKey} // Force re-render when key changes
                  source={{ uri: photoUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-4xl font-bold text-gray-400">
                  {profile?.full_name?.charAt(0) || "?"}
                </Text>
              )}
            </View>

            <View className="flex-1">
              <Text className="text-xl font-bold text-white">{profile?.full_name}</Text>
              <Text className="text-gray-400 text-sm">Email: {profile?.email}</Text>
              {memberSince && (
                <Text className="text-gray-400 text-sm mt-1">Member since: {memberSince}</Text>
              )}
              {system_type === "subscription" && profile?.valid_until && (
                <Text className="text-gray-400 text-sm mt-1">
                  Valid until: {new Date(profile.valid_until).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>

          <View className="space-y-3">
            <TouchableOpacity
              className="bg-blue-500 py-3 rounded-xl"
              onPress={() => {
                onClose();
                router.push("/Profile/ChangePassword");
              }}
            >
              <Text className="text-white font-bold text-center">Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-600 py-3 rounded-xl"
              onPress={() => {
                AsyncStorage.clear();
                router.replace("/login");
              }}
            >
              <Text className="text-white font-bold text-center">Sign Out</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}