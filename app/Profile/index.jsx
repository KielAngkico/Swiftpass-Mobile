import React from 'react';
import { View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getFullPhotoUrl } from '../../backend-api/services/Media_host';

export default function ProfileModal({ visible, onClose, profile, email, system_type }) {
  const router = useRouter();
  const photoUrl = getFullPhotoUrl(profile?.profile_image_url) + "?t=" + new Date().getTime();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/40 backdrop-blur-sm px-4">
        <View className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                    <TouchableOpacity 
            onPress={onClose} 
            className="absolute top-3 right-3 z-10 p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-gray-600 text-2xl font-bold">✖</Text>
          </TouchableOpacity>

          <View className="w-full h-60 relative">
            {profile?.profile_image_url ? (
              <Image
                source={{ uri: photoUrl }}
                className="w-full h-full absolute"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-gray-300 items-center justify-center">
                <Text className="text-3xl font-bold text-white">
                  {profile?.full_name?.charAt(0) || "?"}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent px-4 py-2">
              <Text className="text-black font-bold text-lg">{profile?.full_name}</Text>
              <Text className="text-black text-sm">{profile?.email}</Text>
            </View>
          </View>
          <View className="px-5 py-4 space-y-2">
            {system_type === 'subscription' && profile?.valid_until && (
              <Text className="text-center text-sm text-gray-700">
                Valid until: {new Date(profile.valid_until).toLocaleDateString()}
              </Text>
            )}

  
            <TouchableOpacity
              className="bg-blue-600 py-3 rounded-md"
              onPress={() => {
                onClose(); 
                router.push("/Profile/ChangePassword");
              }}
            >
              <Text className="text-white font-bold text-center">Change Password</Text>
            </TouchableOpacity>

  
            <TouchableOpacity
              className="bg-red-600 py-3 rounded-md mt-2"
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
