import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import API from '../../backend-api/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loginState, setLoginState] = useState('email'); 
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  const deviceId = Constants.installationId || Constants.deviceId || 'mobile-temp-id';

  useEffect(() => {
    checkForPasswordAccess();
  }, []);

  const checkForPasswordAccess = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('email');
      const lastOtpVerified = await AsyncStorage.getItem('lastOtpVerified');
      
      if (storedEmail && lastOtpVerified) {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const otpTime = new Date(lastOtpVerified).getTime();
        
        if (otpTime > sevenDaysAgo) {
          setEmail(storedEmail);
          await handleEmailSubmit(storedEmail);
        }
      }
    } catch (error) {
      console.error('Error checking password access:', error);
    }
  };

  const handleEmailSubmit = async (emailToSubmit = email) => {
    if (!emailToSubmit.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Email Required',
        text2: 'Please enter your email to continue.',
      });
      return;
    }

    try {
      const res = await API.post('/auth/login', { 
        email: emailToSubmit.trim().toLowerCase()
      });

      if (res.data.requiresPassword) {
        setUserEmail(res.data.email);
        setUserName(res.data.full_name);
        setLoginState('password');
        return;
      }

      if (res.data.requiresOTP) {
        setUserEmail(emailToSubmit.trim().toLowerCase());
        setLoginState('otp');
        Toast.show({
          type: 'info',
          text1: 'OTP Required',
          text2: 'An OTP has been sent to your email.',
        });
        return;
      }

      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: 'Unexpected response from server.',
      });

    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err?.response?.data?.message || 'Unknown error occurred.',
      });
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      Toast.show({
        type: 'error',
        text1: 'Password Required',
        text2: 'Please enter your 4-digit password.',
      });
      return;
    }

    try {
      const res = await API.post('/auth/login', { 
        email: userEmail, 
        password,
        deviceId 
      });

      await handleLoginSuccess(res.data);

    } catch (err) {
      if (err?.response?.data?.requiresOTP) {
        setLoginState('otp');
        setPassword('');
        Toast.show({
          type: 'info',
          text1: 'Password Access Expired',
          text2: 'Please verify with OTP to continue.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Password Verification Failed',
          text2: err?.response?.data?.message || 'Invalid password',
        });
        setPassword('');
      }
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp) {
      Toast.show({
        type: 'error',
        text1: 'OTP Required',
        text2: 'Please enter the 6-digit OTP sent to your email.',
      });
      return;
    }

    try {
      const res = await API.post('/auth/verify-otp', { 
        email: userEmail, 
        otp, 
        deviceId 
      });

      await handleLoginSuccess(res.data);

    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'OTP Verification Failed',
        text2: err?.response?.data?.message || 'Invalid OTP',
      });
      setOtp('');
    }
  };

  const handleLoginSuccess = async (data) => {
    const { user, token } = data;

    if (!token) {
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: 'Missing access token.',
      });
      return;
    }

    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('member_id', user.member_id?.toString() || user.id?.toString());
    await AsyncStorage.setItem('admin_id', user.admin_id.toString());
    await AsyncStorage.setItem('rfid_tag', user.rfid_tag);
    await AsyncStorage.setItem('email', user.email);
    await AsyncStorage.setItem('system_type', user.system_type);
    await AsyncStorage.setItem('lastOtpVerified', new Date().toISOString());

    if (user.hasInitialAssessment) {
      router.push(`/homepage?email=${encodeURIComponent(user.email)}&rfid_tag=${encodeURIComponent(user.rfid_tag)}&admin_id=${user.admin_id}&system_type=${user.system_type}`);
    } else {
      router.push('Assessments/InitialAssessment');
    }
  };

  const handleForgotPassword = () => router.push('/login/forgotpassword');
  const handleBackToEmail = () => {
    setLoginState('email');
    setPassword('');
    setOtp('');
    setUserEmail('');
    setUserName('');
    setEmail('');
  };

  const getHeaderText = () => {
    switch (loginState) {
      case 'password': return `Welcome back, ${userName}!`;
      case 'otp': return 'Enter the OTP sent to your email';
      default: return 'Welcome back! Please sign in.';
    }
  };

  const getSubHeaderText = () => {
    switch (loginState) {
      case 'password': return 'Enter your 4-digit password';
      case 'otp': return `OTP sent to: ${userEmail}`;
      default: return 'Enter your email to continue';
    }
  };

  const getButtonText = () => {
    switch (loginState) {
      case 'password': return 'Sign In';
      case 'otp': return 'Verify OTP';
      default: return 'Continue';
    }
  };

  const handleSubmit = () => {
    switch (loginState) {
      case 'password': return handlePasswordSubmit();
      case 'otp': return handleOtpSubmit();
      default: return handleEmailSubmit();
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
        <View className="flex-1 justify-center items-center pb-5">
          <Text className="text-5xl font-bold text-white mt-10 mb-2 tracking-tight">
            SwiftPass
          </Text>
          <Text className="text-xl text-white mb-2 text-center">{getHeaderText()}</Text>
          <Text className="text-base text-gray-300 mb-10 text-center">{getSubHeaderText()}</Text>

          {loginState === 'email' && (
            <>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9E9E9E"
                className="bg-[#FAFAFA] w-full rounded-2xl px-5 py-4 mb-2 text-base text-[#212121] border border-gray-300 shadow-sm"
              />
              <TouchableOpacity onPress={handleForgotPassword} className="self-end mb-2">
                <Text className="text-sm text-white font-semibold">Forgot Password?</Text>
              </TouchableOpacity>
            </>
          )}

          {loginState === 'password' && (
            <>
              <View className="w-full items-center mb-6">
                <Text className="text-white text-sm mb-4">Email: {userEmail}</Text>
                <View className="flex-row justify-center space-x-4">
                  {Array(4).fill(0).map((_, i) => (
                    <View key={i} className="w-12 h-12 bg-white rounded-lg border border-gray-300 items-center justify-center">
                      <Text className="text-2xl text-black font-bold">{password[i] ? "•" : ""}</Text>
                    </View>
                  ))}
                </View>
                <TextInput
                  value={password}
                  onChangeText={(text) => { if (/^\d{0,4}$/.test(text)) setPassword(text); }}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  autoFocus
                  style={{ position: "absolute", opacity: 0, width: "100%", height: 60 }}
                />
              </View>
              <TouchableOpacity onPress={handleBackToEmail} className="mb-4">
                <Text className="text-sm text-blue-400 font-semibold">Use different account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleForgotPassword} className="mb-6">
                <Text className="text-sm text-white font-semibold">Forgot Password?</Text>
              </TouchableOpacity>
            </>
          )}

          {loginState === 'otp' && (
            <>
              <TextInput
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor="#9E9E9E"
                className="bg-[#FAFAFA] w-full rounded-2xl px-5 py-4 mb-4 text-base text-[#212121] border border-gray-300 shadow-sm text-center text-xl tracking-widest"
              />
              <TouchableOpacity onPress={handleBackToEmail} className="mb-6">
                <Text className="text-sm text-blue-400 font-semibold">Use different account</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} className="w-full bg-blue-500 rounded-2xl py-4 shadow-md">
            <Text className="text-center text-white text-lg font-semibold">{getButtonText()}</Text>
          </TouchableOpacity>

          <Text className="text-xs text-white mt-6">© 2025 SwiftPass. All rights reserved.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
