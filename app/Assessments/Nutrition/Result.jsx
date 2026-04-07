import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../../backend-api/services/api";
import SimpleHeader from '../../../components/SimpleHeader';

// Import tab components
import OverviewTab from './OverviewTab';
import FoodsTab from './FoodsTab';
import Learn from './Learn';
import RNDTab from './RNDTab';

export default function NutritionResult() {
  const [result, setResult] = useState(null);
  const [specificFoods, setSpecificFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rfid_tag = await AsyncStorage.getItem("rfid_tag");
        console.log("Using RFID Tag:", rfid_tag);
        
        if (!rfid_tag) {
          Alert.alert("Error", "No RFID tag found in AsyncStorage.");
          setLoading(false);
          return;
        }

        const nutritionRes = await API.get(`/nutrition-plan-result/${rfid_tag}`);
        
        if (nutritionRes.data && typeof nutritionRes.data === 'object' && nutritionRes.data.calories_target) {
          setResult(nutritionRes.data);

          try {
            const specificFoodsRes = await API.get(`/specific-foods/${rfid_tag}`);
            if (specificFoodsRes.data && Array.isArray(specificFoodsRes.data)) {
              setSpecificFoods(specificFoodsRes.data);
              console.log("Loaded specific foods:", specificFoodsRes.data);
            }
          } catch (foodError) {
            console.log("Specific foods not available:", foodError.message);
          }
        } else {
          console.warn("Unexpected response structure:", nutritionRes.data);
          Alert.alert("Error", "Invalid response from server.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        Alert.alert("Error", `Failed to fetch data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <View className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-white mt-4 text-center font-medium">Loading your nutrition plan...</Text>
        </View>
      </View>
    );
  }

  if (!result || !result.calories_target) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <View className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <Text className="text-white text-xl font-bold mb-2">No Plan Found</Text>
          <Text className="text-gray-400">We couldn't find your nutrition plan.</Text>
        </View>
      </View>
    );
  }

  const totalMacros = (result.protein_grams || 0) + (result.carbs_grams || 0) + (result.fats_grams || 0);
  
  if (totalMacros === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <Text className="text-white">Invalid nutrition data.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="bg-gray-900 flex-1">
      <SimpleHeader title="Nutrition Guidance" />
      
      <View className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-12 pb-6 px-6 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold mb-2">Your Nutrition Plan</Text>
        <Text className="text-blue-100 text-sm opacity-80">Personalized for your fitness goals</Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row mx-6 mt-4 bg-gray-800 rounded-xl p-1">
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'overview' ? 'bg-blue-500' : ''}`}
          onPress={() => setActiveTab('overview')}
        >
          <Text className={`text-center font-medium ${activeTab === 'overview' ? 'text-white' : 'text-gray-400'}`}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'foods' ? 'bg-blue-500' : ''}`}
          onPress={() => setActiveTab('foods')}
        >
          <Text className={`text-center font-medium ${activeTab === 'foods' ? 'text-white' : 'text-gray-400'}`}>
            Your Foods 
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'learn' ? 'bg-blue-500' : ''}`}
          onPress={() => setActiveTab('learn')}
        >
          <Text className={`text-center font-medium ${activeTab === 'learn' ? 'text-white' : 'text-gray-400'}`}>
            Learn
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'RND' ? 'bg-blue-500' : ''}`}
          onPress={() => setActiveTab('RND')}
        >
          <Text className={`text-center font-medium ${activeTab === 'RND' ? 'text-white' : 'text-gray-400'}`}>
            RND
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab result={result} specificFoods={specificFoods} />}
      {activeTab === 'foods' && <FoodsTab specificFoods={specificFoods} />}
      {activeTab === 'learn' && <Learn onNavigateToRND={() => setActiveTab('RND')} />}
      {activeTab === 'RND' && <RNDTab />}
    </ScrollView>
  );
}