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
  const [step, setStep] = useState(1); // 1 = verify current PIN, 2 = set new PIN
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const tokenKey = "accessToken"; // AsyncStorage key

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem(tokenKey);
      if (!token) {
        Alert.alert("Authentication Error", "Please login again.", [
          { text: "OK", onPress: () => router.replace("/login") }
        ]);
      }
    } catch (err) {
      console.error("Auth check error:", err);
    }
  };

const handleVerifyCurrentPassword = async () => {
  if (currentPassword.length !== 4) {
    Alert.alert("Error", "Enter your 4-digit current PIN.");
    return;
  }

  setIsLoading(true);

  try {
    const token = await AsyncStorage.getItem(tokenKey);
    if (!token) throw new Error("No token found.");

    const res = await API.post(
      "/auth/verify-current-pin", // <-- updated endpoint
      { currentPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      setStep(2); // move to set new PIN
      setCurrentPassword(""); // clear input
    } else {
      Alert.alert("Error", res.data.message || "Current PIN incorrect.");
    }
  } catch (err) {
    console.error("Verify current PIN error:", err);
    Alert.alert("Error", err.response?.data?.message || err.message || "Server error");
  } finally {
    setIsLoading(false);
  }
};

const handleSetNewPassword = async () => {
  if (newPassword.length !== 4 || confirmPassword.length !== 4) {
    Alert.alert("Error", "PIN must be 4 digits.");
    return;
  }
  if (newPassword !== confirmPassword) {
    Alert.alert("Error", "New PIN and confirmation do not match.");
    return;
  }

  setIsLoading(true);

  try {
    const token = await AsyncStorage.getItem(tokenKey);
    const res = await API.post(
      "/auth/change-password", // backend endpoint for updating PIN
      { newPassword }, // only send new PIN
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      Alert.alert("Success", "PIN updated successfully.", [
        { text: "OK", onPress: () => router.replace("/homepage") }
      ]);
    } else {
      Alert.alert("Error", res.data.message || "Failed to update PIN.");
    }
  } catch (err) {
    console.error("Set new PIN error:", err);
    Alert.alert("Error", err.response?.data?.message || err.message || "Server error");
  } finally {
    setIsLoading(false);
  }
};


  const renderPinInput = (value, setValue) => (
    <View className="flex-row justify-center space-x-3 mb-6">
      {Array(4).fill(0).map((_, i) => (
        <View
          key={i}
          className="w-14 h-14 bg-white rounded-lg border border-gray-300 items-center justify-center"
        >
          <Text className="text-2xl text-black font-bold">
            {value[i] ? "•" : ""}
          </Text>
        </View>
      ))}
      <TextInput
        value={value}
        onChangeText={(text) => {
          if (/^\d{0,4}$/.test(text)) setValue(text);
        }}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
        autoFocus
        editable={!isLoading}
        style={{ position: "absolute", opacity: 0, width: "100%", height: 60 }}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gray-900"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" className="px-6">
        <View className="flex-1 justify-center items-center">
          <Text className="text-5xl font-bold text-white mt-10 mb-2 tracking-tight">
            SwiftPass
          </Text>
          <Text className="text-base text-white mb-10">
            {step === 1 ? "Enter your current 4-digit PIN" : "Set your new 4-digit PIN"}
          </Text>

          {step === 1 && renderPinInput(currentPassword, setCurrentPassword)}
          {step === 2 && (
            <>
              {renderPinInput(newPassword, setNewPassword)}
              {renderPinInput(confirmPassword, setConfirmPassword)}
            </>
          )}

          <TouchableOpacity
            onPress={step === 1 ? handleVerifyCurrentPassword : handleSetNewPassword}
            disabled={isLoading}
            className={`w-full rounded-2xl py-4 shadow-md ${isLoading ? "bg-blue-300" : "bg-blue-500"}`}
          >
            <Text className="text-center text-white text-lg font-semibold">
              {isLoading ? "Processing..." : step === 1 ? "Verify PIN" : "Update PIN"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isLoading}
            className="mt-4"
          >
            <Text className="text-sm text-white font-semibold">← Back</Text>
          </TouchableOpacity>

          <Text className="text-xs text-white mt-6">© 2025 SwiftPass. All rights reserved.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
