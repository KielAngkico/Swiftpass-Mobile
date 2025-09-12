import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../../backend-api/services/api";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

export default function NutritionResult() {
  const [result, setResult] = useState(null);
  const [specificFoods, setSpecificFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rfid_tag = await AsyncStorage.getItem("rfid_tag");
        console.log("🔑 Using RFID Tag:", rfid_tag);
        
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
              console.log("✅ Loaded specific foods:", specificFoodsRes.data);
            }
          } catch (foodError) {
            console.log("ℹ️ Specific foods not available:", foodError.message);
          }
        } else {
          console.warn("⚠️ Unexpected response structure:", nutritionRes.data);
          Alert.alert("Error", "Invalid response from server.");
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err);
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
          <ActivityIndicator size="large" color="#10B981" />
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

  const { protein_grams, carbs_grams, fats_grams, calories_target } = result;
  
  const totalMacros = (protein_grams || 0) + (carbs_grams || 0) + (fats_grams || 0);
  
  if (totalMacros === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <Text className="text-white">Invalid nutrition data.</Text>
      </View>
    );
  }

  const proteinPercent = ((protein_grams || 0) / totalMacros) * 100;
  const carbsPercent = ((carbs_grams || 0) / totalMacros) * 100;
  const fatsPercent = ((fats_grams || 0) / totalMacros) * 100;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const proteinDash = (proteinPercent / 100) * circumference;
  const carbsDash = (carbsPercent / 100) * circumference;
  const fatsDash = (fatsPercent / 100) * circumference;

  const MacroCard = ({ title, grams, percentage, color, bgColor, icon }) => (
    <View className={`${bgColor} rounded-xl p-4 flex-1 mx-1 shadow-lg`}>
      <View className="flex-row items-center mb-2">
        <Text className="text-2xl mr-2">{icon}</Text>
        <Text className={`${color} font-semibold text-sm`}>{title}</Text>
      </View>
      <Text className="text-white text-2xl font-bold">{grams}g</Text>
      <Text className="text-gray-300 text-sm">{percentage.toFixed(1)}%</Text>
    </View>
  );

  const SpecificFoodItem = ({ food }) => {
    const categoryColors = {
      'Protein': 'bg-red-500/20 border-red-400',
      'Carb': 'bg-blue-500/20 border-blue-400', 
      'Fruit': 'bg-green-500/20 border-green-400',
      'Vegetable': 'bg-yellow-500/20 border-yellow-400'
    };
    
    const categoryIcons = {
      'Protein': '🥩',
      'Carb': '🍚',
      'Fruit': '🍎',
      'Vegetable': '🥬'
    };

    return (
      <View className={`${categoryColors[food.macro_type]} border rounded-lg p-4 mb-3`}>
        <View className="flex-row items-start">
          <Text className="text-3xl mr-3 mt-1">{categoryIcons[food.macro_type]}</Text>
          <View className="flex-1">
            <Text className="text-white font-semibold text-base mb-1">{food.food_name}</Text>
            <View className="flex-row items-center mb-2">
              <Text className="text-gray-400 text-sm mr-3">{food.macro_type}</Text>
              <View className="bg-gray-700 px-2 py-1 rounded">
                <Text className="text-white font-bold text-sm">{food.portion_grams}g</Text>
              </View>
            </View>

            <View className="flex-row justify-between mt-2">
              <View className="items-center">
                <Text className="text-orange-400 font-bold text-sm">{Math.round(food.calories)}</Text>
                <Text className="text-gray-400 text-xs">cal</Text>
              </View>
              <View className="items-center">
                <Text className="text-red-400 font-bold text-sm">{food.protein.toFixed(1)}</Text>
                <Text className="text-gray-400 text-xs">protein</Text>
              </View>
              <View className="items-center">
                <Text className="text-blue-400 font-bold text-sm">{food.carbs.toFixed(1)}</Text>
                <Text className="text-gray-400 text-xs">carbs</Text>
              </View>
              <View className="items-center">
                <Text className="text-yellow-400 font-bold text-sm">{food.fats.toFixed(1)}</Text>
                <Text className="text-gray-400 text-xs">fats</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const groupedFoods = specificFoods.reduce((acc, food) => {
    if (!acc[food.macro_type]) {
      acc[food.macro_type] = [];
    }
    acc[food.macro_type].push(food);
    return acc;
  }, {});

  return (
    <ScrollView className="bg-gray-900 flex-1">
      <View className="bg-gradient-to-r from-green-600 to-emerald-600 pt-12 pb-6 px-6 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold mb-2">Your Nutrition Plan</Text>
        <Text className="text-green-100 text-sm opacity-80">Personalized for your fitness goals</Text>
      </View>

      <View className="flex-row mx-6 mt-4 bg-gray-800 rounded-xl p-1">
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'overview' ? 'bg-green-600' : ''}`}
          onPress={() => setActiveTab('overview')}
        >
          <Text className={`text-center font-medium ${activeTab === 'overview' ? 'text-white' : 'text-gray-400'}`}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'foods' ? 'bg-green-600' : ''}`}
          onPress={() => setActiveTab('foods')}
        >
          <Text className={`text-center font-medium ${activeTab === 'foods' ? 'text-white' : 'text-gray-400'}`}>
            Your Foods ({specificFoods.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' ? (
        <View className="px-6">
          <View className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mt-6 shadow-xl">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-purple-100 text-sm font-medium mb-1">Daily Target</Text>
                <Text className="text-white text-3xl font-bold">{calories_target}</Text>
                <Text className="text-purple-100 text-sm">calories</Text>
              </View>
              <Text className="text-6xl opacity-20">🎯</Text>
            </View>
          </View>

          <View className="flex-row mt-6 mb-6">
            <MacroCard 
              title="Protein" 
              grams={protein_grams} 
              percentage={proteinPercent}
              color="text-red-400"
              bgColor="bg-red-500/10"
              icon="💪"
            />
            <MacroCard 
              title="Carbs" 
              grams={carbs_grams} 
              percentage={carbsPercent}
              color="text-blue-400"
              bgColor="bg-blue-500/10"
              icon="⚡"
            />
            <MacroCard 
              title="Fats" 
              grams={fats_grams} 
              percentage={fatsPercent}
              color="text-yellow-400"
              bgColor="bg-yellow-500/10"
              icon="🧈"
            />
          </View>

          <View className="bg-gray-800 rounded-2xl p-6 shadow-xl">
            <Text className="text-white text-lg font-bold mb-4 text-center">Macro Distribution</Text>
            
            <View className="items-center">
              <Svg width={160} height={160} viewBox="0 0 160 160">
                <G rotation="-90" origin="80,80">
                  <Circle 
                    cx="80" 
                    cy="80" 
                    r={radius} 
                    stroke="#374151" 
                    strokeWidth={24} 
                    fill="none" 
                  />
                  
                  <Circle 
                    cx="80" 
                    cy="80" 
                    r={radius} 
                    stroke="#EF4444" 
                    strokeWidth={24} 
                    fill="none"
                    strokeDasharray={`${proteinDash} ${circumference}`} 
                    strokeDashoffset={0}
                    strokeLinecap="round"
                  />
                  
                  <Circle 
                    cx="80" 
                    cy="80" 
                    r={radius} 
                    stroke="#3B82F6" 
                    strokeWidth={24} 
                    fill="none"
                    strokeDasharray={`${carbsDash} ${circumference}`} 
                    strokeDashoffset={-proteinDash}
                    strokeLinecap="round"
                  />
                  
                  <Circle 
                    cx="80" 
                    cy="80" 
                    r={radius} 
                    stroke="#EAB308" 
                    strokeWidth={24} 
                    fill="none"
                    strokeDasharray={`${fatsDash} ${circumference}`} 
                    strokeDashoffset={-(proteinDash + carbsDash)}
                    strokeLinecap="round"
                  />
                </G>
                
                <SvgText x="80" y="75" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
                  Total
                </SvgText>
                <SvgText x="80" y="90" textAnchor="middle" fill="#9CA3AF" fontSize="12">
                  {totalMacros}g
                </SvgText>
              </Svg>
            </View>
            <View className="flex-row justify-around mt-6">
              <View className="items-center">
                <View className="w-4 h-4 bg-red-500 rounded-full mb-2" />
                <Text className="text-red-400 font-medium text-sm">Protein</Text>
                <Text className="text-gray-400 text-xs">{proteinPercent.toFixed(1)}%</Text>
              </View>
              <View className="items-center">
                <View className="w-4 h-4 bg-blue-500 rounded-full mb-2" />
                <Text className="text-blue-400 font-medium text-sm">Carbs</Text>
                <Text className="text-gray-400 text-xs">{carbsPercent.toFixed(1)}%</Text>
              </View>
              <View className="items-center">
                <View className="w-4 h-4 bg-yellow-500 rounded-full mb-2" />
                <Text className="text-yellow-400 font-medium text-sm">Fats</Text>
                <Text className="text-gray-400 text-xs">{fatsPercent.toFixed(1)}%</Text>
              </View>
            </View>
          </View>

          {specificFoods.length > 0 && (
            <View className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mt-4 mb-6 shadow-xl">
              <Text className="text-white text-lg font-bold mb-3">📋 Your Food Plan</Text>
              <Text className="text-indigo-100 text-sm leading-5 mb-3">
                You have {specificFoods.length} specific foods selected to meet your macro targets.
              </Text>
              <TouchableOpacity 
                onPress={() => setActiveTab('foods')}
                className="bg-white/20 rounded-lg p-3"
              >
                <Text className="text-white text-center font-medium">View Detailed Food Plan →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View className="px-6">
          <View className="bg-gray-800 rounded-2xl p-6 mt-6 shadow-xl">
            <Text className="text-white text-lg font-bold mb-4">Your Personalized Foods</Text>
            
            {specificFoods.length > 0 ? (
              <View>
                {Object.entries(groupedFoods).map(([macroType, foods]) => (
                  <View key={macroType} className="mb-6">
                    <Text className="text-gray-300 font-semibold text-base mb-3 border-b border-gray-600 pb-2">
                      {macroType} ({foods.length} food{foods.length !== 1 ? 's' : ''})
                    </Text>
                    {foods.map((food, index) => (
                      <SpecificFoodItem key={`${food.food_id}-${index}`} food={food} />
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-8 items-center">
                <Text className="text-6xl mb-3">🍽️</Text>
                <Text className="text-gray-400 text-center">
                  No specific food selections found.{'\n'}Your macro targets are ready to guide your meal planning!
                </Text>
              </View>
            )}
          </View>

          {specificFoods.length > 0 && (
            <View className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 mt-4 mb-6 shadow-xl">
              <Text className="text-white text-lg font-bold mb-3">📊 Total Daily Nutrition</Text>
                            {(() => {
const totals = specificFoods.reduce((acc, food) => ({
  calories: acc.calories + Number(food.calories ?? 0),
  protein: acc.protein + Number(food.protein ?? 0),
  carbs: acc.carbs + Number(food.carbs ?? 0),
  fats: acc.fats + Number(food.fats ?? 0),
  weight: acc.weight + Number(food.portion_grams ?? 0),
}), { calories: 0, protein: 0, carbs: 0, fats: 0, weight: 0 });



                return (
                  <View>
                    <View className="flex-row justify-between mb-3">
                      <View className="items-center flex-1">
                        <Text className="text-white text-xl font-bold">{Math.round(totals.calories)}</Text>
                        <Text className="text-green-100 text-sm">Calories</Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-white text-xl font-bold">{totals.weight.toFixed(0)}g</Text>

                        <Text className="text-green-100 text-sm">Total Food</Text>
                      </View>
                    </View>
                    
                    <View className="flex-row justify-between">
                      <View className="items-center flex-1">
                        <Text className="text-red-300 text-lg font-bold">{totals.protein.toFixed(1)}g</Text>
                        <Text className="text-green-100 text-xs">Protein</Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-blue-300 text-lg font-bold">{totals.carbs.toFixed(1)}g</Text>
                        <Text className="text-green-100 text-xs">Carbs</Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-yellow-300 text-lg font-bold">{totals.fats.toFixed(1)}g</Text>
                        <Text className="text-green-100 text-xs">Fats</Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}