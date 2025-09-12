import React, { useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);

  const deviceId = Constants.installationId || Constants.deviceId || 'mobile-temp-id';

  const handleLogin = async () => {
    try {

  
      const res = await API.post('/auth/login', { email, password, deviceId });
      if (res.data.requiresOTP) {

        setRequiresOtp(true);
        Alert.alert('OTP Required', 'An OTP has been sent to your email.');
        return;
      }
  
      const { user, token } = res.data;
 

      if (!token) {
        console.error("❌ No token in response!");
        Alert.alert('Error', 'Login successful but no authentication token received');
        return;
      }

      await AsyncStorage.setItem('test', 'hello');
      const test = await AsyncStorage.getItem('test');

      await AsyncStorage.setItem('accessToken', token);
      const storedToken = await AsyncStorage.getItem('accessToken');

      await AsyncStorage.setItem('member_id', user.member_id?.toString() || user.id.toString());
      await AsyncStorage.setItem('admin_id', user.admin_id.toString());
      await AsyncStorage.setItem('rfid_tag', user.rfid_tag);
      await AsyncStorage.setItem('email', user.email);
      await AsyncStorage.setItem('system_type', user.system_type);

   
      const allKeys = await AsyncStorage.getAllKeys();
      const allValues = await AsyncStorage.multiGet(allKeys);

      if (user.hasInitialAssessment) {
        router.push(`/homepage?email=${encodeURIComponent(user.email)}&rfid_tag=${encodeURIComponent(user.rfid_tag)}&admin_id=${user.admin_id}&system_type=${user.system_type}`);
      } else {
        router.push('Assessments/InitialAssessment');
      }
    } catch (err) {
      Alert.alert('Login failed', err?.response?.data?.message || 'Unknown error');
    }
  };

  const handleVerifyOtp = async () => {
    try {

      
      const res = await API.post('/auth/verify-otp', { email, otp, deviceId });
      


      const { user, token } = res.data;


      if (!token) {
        console.error("No token in OTP response!");
        Alert.alert('Error', 'OTP verified but no authentication token received');
        return;
      }


      await AsyncStorage.setItem('accessToken', token);

      const storedToken = await AsyncStorage.getItem('accessToken');


      await AsyncStorage.setItem('member_id', user.member_id?.toString() || user.id.toString());
      await AsyncStorage.setItem('admin_id', user.admin_id.toString());
      await AsyncStorage.setItem('rfid_tag', user.rfid_tag);
      await AsyncStorage.setItem('email', user.email);
      await AsyncStorage.setItem('system_type', user.system_type);

      if (user.hasInitialAssessment) {
        router.push(`/homepage?email=${encodeURIComponent(user.email)}&rfid_tag=${encodeURIComponent(user.rfid_tag)}&admin_id=${user.admin_id}&system_type=${user.system_type}`);
      } else {
        router.push('Assessments/InitialAssessment');
      }
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      console.error('❌ OTP error response:', err?.response?.data);
      Alert.alert('OTP Verification failed', err?.response?.data?.message || 'Unknown error');
    }
  };

  const handleForgotPassword = () => {
    router.push('/login/forgotpassword');
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
          <Text className="text-base text-white mb-10">Welcome back! Please sign in.</Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9E9E9E"
            className="bg-[#FAFAFA] w-full rounded-2xl px-5 py-4 mb-4 text-base text-[#212121] border border-gray-300 shadow-sm"
            editable={!requiresOtp}
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#9E9E9E"
            className="bg-[#FAFAFA] w-full rounded-2xl px-5 py-4 mb-2 text-base text-[#212121] border border-gray-300 shadow-sm"
            editable={!requiresOtp}
          />

          {requiresOtp && (
            <TextInput
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              placeholderTextColor="#9E9E9E"
              className="bg-[#FAFAFA] w-full rounded-2xl px-5 py-4 mb-4 text-base text-[#212121] border border-gray-300 shadow-sm"
            />
          )}

          {!requiresOtp && (
            <TouchableOpacity onPress={handleForgotPassword} className="self-end mb-6">
              <Text className="text-sm text-white font-semibold">Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={requiresOtp ? handleVerifyOtp : handleLogin}
            activeOpacity={0.85}
            className="w-full bg-blue-300 rounded-2xl py-4 shadow-md"
          >
            <Text className="text-center text-white text-lg font-semibent">
              {requiresOtp ? 'Verify OTP' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <Text className="text-xs text-white mt-6">© 2025 SwiftPass. All rights reserved.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}