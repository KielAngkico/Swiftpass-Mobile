import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavigationBar from "../../../components/NavigationBar";
import API from '../../../backend-api/services/api';
import { Image } from 'react-native';
import ProfileModal from "../../Profile";
import { getFullPhotoUrl } from "../../../backend-api/services/Media_host";

export default function PrepaidHomepage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params?.email;
  const admin_id = params?.admin_id;
  const rfid_tag = params?.rfid_tag;
  const system_type = params.system_type || '';

  const adminId = parseInt(params?.admin_id || "");

  const [profile, setProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [balance, setBalance] = useState(null);
  const [totalInside, setTotalInside] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalInsideLoading, setTotalInsideLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleExercisePlannerPress = async () => {
    try {
      const rfid_tag = await AsyncStorage.getItem('rfid_tag');
      console.log("🔑 Using RFID Tag:", rfid_tag);
      const member_id = await AsyncStorage.getItem('member_id');

      if (!rfid_tag || !member_id) {
        Alert.alert('Error', 'Missing login info. Please login again.');
        return;
      }

      const res = await API.get(`/exercise-assessment-status/${member_id}`);

      if (res.data.completed) {
        router.push({
          pathname: '/Assessments/Exercise/Result',
          params: { rfid: rfid_tag },
        });
      } else {
        router.push('/Assessments/Exercise/Assessment');
      }
    } catch (error) {
      console.error('Error checking assessment status:', error);
      Alert.alert('Error', 'Failed to check assessment.');
    }
  };

  const handleNutritionPlannerPress = async () => {
    try {
      const rfid_tag = await AsyncStorage.getItem('rfid_tag');
      const member_id = await AsyncStorage.getItem('member_id');

      if (!rfid_tag || !member_id) {
        Alert.alert('Error', 'Missing login info. Please login again.');
        return;
      }

      const res = await API.get(`/nutrition-assessment-status/${member_id}`);

      if (res.data.completed) {
        router.push({
          pathname: '/Assessments/Nutrition/Result',
          params: { rfid: rfid_tag },
        });
      } else {
        router.push('/Assessments/Nutrition/Assessment');
      }
    } catch (error) {
      console.error('Error checking assessment status:', error);
      Alert.alert('Error', 'Failed to check assessment.');
    }
  };

 
  useEffect(() => {
    if (rfid_tag) {
      AsyncStorage.setItem("rfid_tag", rfid_tag.toString());
      console.log("Stored RFID Tag in AsyncStorage:", rfid_tag);
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log("Animation completed");
    });
  }, []);

  const fetchBalanceData = async (email) => {
    try {
      const res = await API.get(`/balance/${email}`);
      setBalance(res.data.balance);
    } catch (error) {
      Alert.alert("Error", "Failed to load balance info");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProfile = async (email) => {
    try {
      const res = await API.get(`/profile/${email}`);
      setProfile(res.data.profile);
    } catch (err) {
      console.error("Profile fetch error:", err.message);
    }
  };

  const fetchActiveMembers = async () => {
    try {
      const res = await API.get(`/active-members/${adminId}`);
      setTotalInside(res.data.totalInside);
    } catch (error) {
      console.error("Failed to fetch active members:", error);
    } finally {
      setTotalInsideLoading(false);
    }
  };

  useEffect(() => {
    const validateSession = async () => {
      let resolvedEmail = email;
      let resolvedSystemType = system_type;

      if (!resolvedEmail) {
        resolvedEmail = await AsyncStorage.getItem('email');
      }

      if (!resolvedSystemType) {
        resolvedSystemType = await AsyncStorage.getItem('system_type');
      }

      if (!resolvedEmail || !resolvedSystemType) {
        Alert.alert("Missing session info", "Redirecting to login...");
        router.replace("/login");
        return;
      }

      fetchBalanceData(resolvedEmail);
      fetchActiveMembers();
      fetchProfile(resolvedEmail);
    };

    validateSession();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const getEmail = async () => {
      const resolvedEmail = email || await AsyncStorage.getItem('email');
      fetchBalanceData(resolvedEmail);
    };
    getEmail();
    fetchActiveMembers();
  }, [email]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        console.log("📥 Fetching profile for email:", email);
        const res = await API.get(`/profile/${email}`);
        console.log("✅ Profile response data:", res.data);
        setProfile(res.data.profile);
      } catch (err) {
        console.error("Profile fetch error:", err.message);
      }
    };

    if (email) fetchProfileData();
  }, [email]);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white shadow-sm border-b border-gray-100">
        <View className="flex-row justify-between items-center px-6 pt-12 pb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">Dashboard</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-gray-500 text-sm mr-2">SwiftPass Prepaid</Text>
              <View
                className={`w-2.5 h-2.5 rounded-full ${
                  profile?.profile_image_url ? "bg-emerald-500" : "bg-orange-400"
                }`}
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => setShowProfileModal(true)}
            className="bg-white rounded-2xl shadow-md border border-gray-200"
          >
            {profile?.profile_image_url ? (
              <Image
                source={{ uri: `${getFullPhotoUrl(profile.profile_image_url)}?t=${Date.now()}` }}
                className="w-14 h-14 rounded-2xl"
              />
            ) : (
              <View className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Text className="text-white font-bold text-lg">
                  {profile?.name?.charAt(0) || "U"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }}
        >
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-800">Current Balance</Text>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-700 text-xs font-medium">PREPAID</Text>
              </View>
            </View>
            
            {loading ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Text className="text-2xl font-bold text-gray-900">
                ₱{parseFloat(balance).toFixed(2)}
              </Text>
            )}
          </View>

          <View className="bg-white rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              <Text className="text-black text-sm font-medium">Live Stats</Text>
            </View>
            
            <Text className="text-black text-sm mb-2 opacity-80">Currently in Gym</Text>
            {totalInsideLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <View className="flex-row items-baseline">
                <Text className="text-black text-xl font-bold mr-2">{totalInside}</Text>
                <Text className="text-black text-base opacity-70">
                  member{totalInside === 1 ? '' : 's'}
                </Text>
              </View>
            )}
          </View>

          <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</Text>
          
          <View className="space-y-4 mb-6">
            <TouchableOpacity
              onPress={handleExercisePlannerPress}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex-row items-center justify-between active:bg-gray-50"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <Text className="text-orange-600 text-xl">💪</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-base">Exercise Planner</Text>
                  <Text className="text-gray-500 text-sm">Create your workout routine</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-lg">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNutritionPlannerPress}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex-row items-center justify-between active:bg-gray-50"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <Text className="text-green-600 text-xl">🥗</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-base">Meal Planner</Text>
                  <Text className="text-gray-500 text-sm">Plan your nutrition goals</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-lg">→</Text>
            </TouchableOpacity>
          </View>

          <View className="h-20" />
        </Animated.View>
      </ScrollView>

      <View className="bg-white border-t border-gray-200 safe-area-bottom">
        <NavigationBar
          email={email}
          rfid_tag={rfid_tag}
          system_type={system_type}
          admin_id={admin_id}
        />
      </View>

      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profile}
        email={email}
        system_type={system_type}
      />
    </View>
  );
}