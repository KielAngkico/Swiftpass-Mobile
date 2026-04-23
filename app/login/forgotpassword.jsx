import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import API from '../../backend-api/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [step, setStep] = useState(1); 
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    try {
      const res = await API.post('/auth/forgot-password', { email });

      if (res.data.requiresOTP) {
        Alert.alert('OTP Sent', 'Check your email for the OTP.');
        setStep(2);
        setResendTimer(60);
      } else {
        Alert.alert('Error', res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Server error');
    }
  };

  const handleVerifyOtp = async () => { 
    try {
      const res = await API.post('/auth/verify-forgot-otp', { email, otp });
      if (res.data.success) {
        Alert.alert('OTP Verified', 'You can now set a new password.');
        setStep(3);
      } else {
        Alert.alert('Error', res.data.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Server error');
    }
  };

const handleResetPassword = async () => {
  if (newPassword !== confirmPassword) {
    Alert.alert("Error", "PINs do not match.");
    return;
  }

  if (newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
    Alert.alert("Error", "PIN must be exactly 4 digits.");
    return;
  }

  try {
    const res = await API.post('/auth/reset-password', { email, otp, newPassword });
    if (res.data.success) {
      Alert.alert('Success', 'PIN updated successfully.');
      router.replace('/login');
    } else {
      Alert.alert('Error', res.data.message || 'Failed to reset PIN');
    }
  } catch (err) {
    Alert.alert('Error', err?.response?.data?.message || 'Server error');
  }
};


  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await handleSendOtp();
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
          {step === 1 && 'Enter your email to receive an OTP.'}
          {step === 2 && 'Enter the OTP sent to your email.'}
          {step === 3 && 'Enter your new 4-digit PIN twice.'}
        </Text>
        {step === 1 && (
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9E9E9E"
            className="bg-[#FAFAFA] w-full rounded-2xl px-5 py-4 mb-4 text-base text-[#212121] border border-gray-300 shadow-sm"
          />
        )}
        {step === 2 && (
          <>
            <View className="flex-row justify-center space-x-3 mb-6">
              {Array(6).fill(0).map((_, i) => (
                <View
                  key={i}
                  className="w-12 h-12 bg-white rounded-lg border border-gray-300 items-center justify-center"
                >
                  <Text className="text-2xl text-black font-bold">
                    {otp[i] ? otp[i] : ""}
                  </Text>
                </View>
              ))}
              <TextInput
                value={otp}
                onChangeText={(text) => {
                  if (/^\d{0,6}$/.test(text)) setOtp(text);
                }}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: "100%",
                  height: 60,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={resendTimer > 0}
              className="self-end mb-6"
            >
              <Text className="text-sm text-white font-semibold">
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {step === 3 && (
          <>
            <View className="flex-row justify-center space-x-3 mb-6">
              {Array(4).fill(0).map((_, i) => (
                <View
                  key={i}
                  className="w-12 h-12 bg-white rounded-lg border border-gray-300 items-center justify-center"
                >
                  <Text className="text-2xl text-black font-bold">
                    {newPassword[i] ? "•" : ""}
                  </Text>
                </View>
              ))}
              <TextInput
                value={newPassword}
                onChangeText={(text) => {
                  if (/^\d{0,4}$/.test(text)) setNewPassword(text);
                }}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                autoFocus
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: "100%",
                  height: 60,
                }}
              />
            </View>
            <View className="flex-row justify-center space-x-3 mb-6">
              {Array(4).fill(0).map((_, i) => (
                <View
                  key={i}
                  className="w-12 h-12 bg-white rounded-lg border border-gray-300 items-center justify-center"
                >
                  <Text className="text-2xl text-black font-bold">
                    {confirmPassword[i] ? "•" : ""}
                  </Text>
                </View>
              ))}
              <TextInput
                value={confirmPassword}
                onChangeText={(text) => {
                  if (/^\d{0,4}$/.test(text)) setConfirmPassword(text);
                }}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: "100%",
                  height: 60,
                }}
              />
            </View>
          </>
        )}
        <TouchableOpacity
          onPress={
            step === 1
              ? handleSendOtp
              : step === 2
              ? handleVerifyOtp
              : handleResetPassword
          }
          className="w-full bg-blue-500 rounded-2xl py-4 shadow-md"
        >
          <Text className="text-center text-white text-lg font-semibold">
            {step === 1 ? 'Send OTP' : step === 2 ? 'Verify OTP' : 'Reset PIN'}
          </Text>
        </TouchableOpacity>

        <Text className="text-xs text-white mt-6">
          © 2025 SwiftPass. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);

}
