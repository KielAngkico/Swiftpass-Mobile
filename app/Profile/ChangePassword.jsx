import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import API from "../../backend-api/services/api";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();


  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const userInfo = await AsyncStorage.getItem("userInfo");
      
      console.log("🔑 Token exists:", !!token);
      console.log("🔑 Token length:", token?.length || 0);
      console.log("👤 User info exists:", !!userInfo);
      console.log("👤 User info:", userInfo);
      
      if (!token) {
        Alert.alert("Authentication Error", "No valid session found. Please login again.", [
          { text: "OK", onPress: () => router.replace("/login") }
        ]);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirmation do not match.");
      return;
    }

    setIsLoading(true);

    try {

      const token = await AsyncStorage.getItem("accessToken");
      console.log("🔑 Retrieved Token in ChangePassword:", token ? "EXISTS" : "NULL");
      console.log("🔑 Token starts with:", token?.substring(0, 20) + "...");
      
      if (!token) {
        Alert.alert("Authentication Error", "You are not logged in. Please login again.", [
          { text: "Login", onPress: () => router.replace("/login") }
        ]);
        return;
      }

      console.log("📡 Making API request to /auth/change-password");
      console.log("📡 Request headers:", { Authorization: `Bearer ${token.substring(0, 20)}...` });

      const res = await API.post(
        "/auth/change-password",
        { 
          currentPassword, 
          newPassword 
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log("✅ API Response:", res.data);

      if (res.data.success) {
        Alert.alert("Success", res.data.message || "Password changed successfully.", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Error", res.data.message || "Failed to change password.");
      }
    } catch (error) {
      console.error("❌ Change password error:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please login again.", [
          { text: "Login", onPress: () => router.replace("/login") }
        ]);
      } else {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           "Something went wrong.";
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gray-900"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="px-6"
      >
        <View className="flex-1 justify-center items-center">
          <Text className="text-5xl font-bold text-white mt-10 mb-2 tracking-tight">
            SwiftPass
          </Text>
          <Text className="text-base text-white mb-10">
            Change your account password
          </Text>

          <TextInput
            placeholder="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholderTextColor="#9E9E9E"
            className="bg-[#FAFAFA] w-full rounded-2xl px-5 py-4 mb-4 text-base text-[#212121] border border-gray-300 shadow-sm"
            editable={!isLoading}
          />

          <TextInput
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholderTextColor="#9E9E9E"
            className="bg-[#FAFAFA] w-full rounded-2xl px-5 py-4 mb-4 text-base text-[#212121] border border-gray-300 shadow-sm"
            editable={!isLoading}
          />

          <TextInput
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor="#9E9E9E"
            className="bg-[#FAFAFA] w-full rounded-2xl px-5 py-4 mb-6 text-base text-[#212121] border border-gray-300 shadow-sm"
            editable={!isLoading}
          />

          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={isLoading}
            className="w-full bg-blue-300 rounded-2xl py-4 shadow-md"
          >
            <Text className="text-center text-white text-lg font-semibold">
              {isLoading ? "Updating..." : "Update Password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isLoading}
            className="mt-4"
          >
            <Text className="text-sm text-white font-semibold">
              ← Back
            </Text>
          </TouchableOpacity>

          <Text className="text-xs text-white mt-6">© 2025 SwiftPass. All rights reserved.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}