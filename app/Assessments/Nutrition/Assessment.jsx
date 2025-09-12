import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import API from "../../../backend-api/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const steps = [
  { key: "welcome", type: "info", content: (username) => ({
      title: `Hello, ${username || "User"}!`,
      message: "We need a few details about your nutrition preferences.",
      button: "Get Started",
    }),
  },
  { key: "diet_type", question: "What's your diet preference?", subtitle: "This will customize your food options", options: ["Balanced", "Vegetarian", "No Red Meat"] },
  { key: "allergies", question: "Do you have any allergies?", subtitle: "Select all that apply", options: [] },
  { key: "food_preferences", question: "Which foods do you like?", subtitle: "Select options per category", macroGrouped: true, options: {} },
  { key: "calculating", type: "info", content: () => ({ title: "Calculating...", message: "Please wait while we find your best food options.", button: "Next" }) },
  { key: "best_foods", question: "Here are your recommended foods!", subtitle: "Tap any food to see other options", macroGrouped: true, options: {} },
  { key: "done", type: "info", content: (username) => ({
      title: "All done!",
      message: "Your nutrition assessment is complete.",
      button: "Continue to Homepage",
    }),
  },
];

export default function NutritionAssessment() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ 
    diet_type: "", 
    allergies: [], 
    food_preferences: {} 
  });
  const [otherAllergy, setOtherAllergy] = useState("");
  const [foodGroups, setFoodGroups] = useState({});
  const [filteredFoodGroups, setFilteredFoodGroups] = useState({});
  const [allergensList, setAllergensList] = useState([]);
  const [bestFoods, setBestFoods] = useState({});
  const [selectedSpecificFoods, setSelectedSpecificFoods] = useState({}); 
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMacro, setModalMacro] = useState("");
  const [modalFoodGroup, setModalFoodGroup] = useState("");
  const [modalOptions, setModalOptions] = useState([]);
  const [modalSelected, setModalSelected] = useState("");
  const [loadingSpecificFoods, setLoadingSpecificFoods] = useState(false);
  const [goalType, setGoalType] = useState("");
  const [macroBreakdown, setMacroBreakdown] = useState(null);
  const [targetCalories, setTargetCalories] = useState(""); 

  const current = steps[step];
  const [username, setUsername] = useState(""); 


  useEffect(() => {
    const fetchAllergens = async () => {
      try {
        const res = await API.get("/allergens");
        const allergens = Array.isArray(res.data) ? res.data : [];
        const list = [...allergens.map(a => ({ id: a.id, name: a.name })), { id: "Other", name: "Other (please specify)" }];
        setAllergensList(list);
        steps.find(s => s.key === "allergies").options = list.map(a => a.name);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllergens();
  }, []);

  useEffect(() => {
    const fetchFoodGroups = async () => {
      try {
        const res = await API.get("/food-groups");
        const data = Array.isArray(res.data) ? res.data : [res.data];


        const grouped = data.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push({ 
            name: item.name, 
            id: item.id,
            is_meat: item.is_meat || false,
            is_red_meat: item.is_red_meat || false
          });
          return acc;
        }, {});

        setFoodGroups(grouped);
        

        setFilteredFoodGroups(grouped);

      } catch (err) {
        console.error("Error fetching food groups:", err);
      }
    };

    fetchFoodGroups();
  }, []);

  useEffect(() => {
    if (!answers.diet_type || Object.keys(foodGroups).length === 0) {
      setFilteredFoodGroups(foodGroups);
      return;
    }

    const filtered = Object.entries(foodGroups).reduce((acc, [macro, items]) => {
      let filteredItems = items;

      if (answers.diet_type === "Vegetarian") {
        filteredItems = items.filter(item => !item.is_meat);
      } else if (answers.diet_type === "No Red Meat") {
        filteredItems = items.filter(item => !item.is_red_meat);
      }

      if (filteredItems.length > 0) {
        acc[macro] = filteredItems;
      }

      return acc;
    }, {});

    setFilteredFoodGroups(filtered);

    const foodPrefStep = steps.find((s) => s.key === "food_preferences");
    if (foodPrefStep) {
      foodPrefStep.options = Object.fromEntries(
        Object.entries(filtered).map(([macro, items]) => [
          macro,
          items.map((i) => i.name), 
        ])
      );
    }

  }, [answers.diet_type, foodGroups]);

  const getBestSpecificFood = async (foodGroupId, foodGroupName) => {
    try {
      const res = await API.get(`/food-library/best-specific/${foodGroupId}`);
      return Array.isArray(res.data) ? res.data : [res.data]; 
    } catch (err) {
      console.error(`Error fetching best food for ${foodGroupName}:`, err);
      return [{
        id: `${foodGroupId}_default`,
        name: `Best ${foodGroupName}`,
        food_group_id: foodGroupId
      }];
    }
  };

  const getAllSpecificFoods = async (foodGroupId) => {
    try {
      const res = await API.get(`/food-library/group/${foodGroupId}`);
      return Array.isArray(res.data) ? res.data : [res.data];
    } catch (err) {
      console.error(`Error fetching all foods for group ${foodGroupId}:`, err);
      return [];
    }
  };

  const toggleAllergy = (id) => {
    const prev = answers.allergies || [];
    const updated = prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id];
    setAnswers(prev => ({ ...prev, allergies: updated }));
  };

  const toggleFood = (macro, id) => {
    const prev = answers.food_preferences[macro] || [];
    const updated = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
    setAnswers(prev => ({ ...prev, food_preferences: { ...prev.food_preferences, [macro]: updated } }));
  };

  const selectDietType = (dietType) => {
    setAnswers(prev => ({ ...prev, diet_type: dietType }));
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const memberId = await AsyncStorage.getItem("member_id");

        const initialRes = await API.get(`/assessment/initial/${memberId}`);
        const { goal_type, calories_target, username } = initialRes.data;

        setGoalType(goal_type);
        setTargetCalories(calories_target);  
        setUsername(username);                

        const macroRes = await API.get(`/macro-breakdown/${encodeURIComponent(goal_type)}`);
        setMacroBreakdown(macroRes.data);

        console.log("Username:", username);
        console.log("Goal type:", goal_type);
        console.log("Calories target:", calories_target);
        console.log("Macro breakdown:", macroRes.data);

      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };

    fetchInitialData();
  }, []);

  const goNext = async () => {
    const memberId = await AsyncStorage.getItem("member_id");
    const admin_id = await AsyncStorage.getItem("admin_id");
    const rfid_tag = await AsyncStorage.getItem("rfid_tag");
    const email = await AsyncStorage.getItem("email");
    const system_type = await AsyncStorage.getItem("system_type");

    if (step < steps.length - 1) {
      if (current.key === "food_preferences") {
        setStep(step + 1);
        setLoadingSpecificFoods(true);

        try {
          const bestFoodsResult = {};
          const specificFoodsResult = {};

          for (const [macro, selectedFoodGroupIds] of Object.entries(answers.food_preferences)) {
            if (selectedFoodGroupIds?.length) {
              bestFoodsResult[macro] = [];
              specificFoodsResult[macro] = [];

              for (const foodGroupId of selectedFoodGroupIds) {
                const foodGroup = filteredFoodGroups[macro]?.find(fg => fg.id === foodGroupId);
                if (!foodGroup) continue;

                const bestSpecificFoods = await getBestSpecificFood(foodGroupId, foodGroup.name);

                bestSpecificFoods.forEach(food => {
                  bestFoodsResult[macro].push({
                    ...food,
                    food_group_id: foodGroupId,
                    food_group_name: foodGroup.name
                  });

                  specificFoodsResult[macro].push({
                    food_group_id: foodGroupId,
                    food_group_name: foodGroup.name,
                    selected_food: food
                  });
                });
              }
            }
          }

          setBestFoods(bestFoodsResult);
          setSelectedSpecificFoods(specificFoodsResult);
          steps.find(s => s.key === "best_foods").options = bestFoodsResult;

          setLoadingSpecificFoods(false);
          setTimeout(() => setStep(prev => prev + 1), 1500);
        } catch (err) {
          console.error(err);
          setLoadingSpecificFoods(false);
          Alert.alert("Error", "Failed to calculate best foods");
        }
        return;
      }

      setStep(step + 1);
      return;
    }

    try {
      if (!macroBreakdown) throw new Error("Macro breakdown not loaded");

      const calories_target = targetCalories;
      const protein_grams = Math.round((calories_target * macroBreakdown.protein_pct) / 100 / 4);
      const carbs_grams   = Math.round((calories_target * macroBreakdown.carbs_pct) / 100 / 4);
      const fats_grams    = Math.round((calories_target * macroBreakdown.fats_pct) / 100 / 9);

      console.log("Target macros:", { protein_grams, carbs_grams, fats_grams });


const food_preferences_payload = Object.entries(selectedSpecificFoods).flatMap(([macro, foods]) =>
  foods.map(f => ({
    macro_type: macro,
    food_group_id: f.food_group_id,
    food_id: f.selected_food?.id,           
    food_name: f.selected_food?.name || ""  
  }))
);


      console.log("Food preferences for SQL computation:", food_preferences_payload);

      const payload = {
        rfid_tag,
        diet_type: answers.diet_type,
        allergens: answers.allergies || [],
        calories_target,
        protein_grams,
        carbs_grams,
        fats_grams,
        macro_breakdown_id: macroBreakdown.id,
        food_preferences: food_preferences_payload
      };

      console.log("Sending payload for SQL-based nutrition computation");
      const response = await API.post(`/nutrition/${memberId}`, payload);
      
      if (response.data.success) {
        const assessment_id = response.data.assessment_id;
        console.log("Nutrition assessment saved and computed with ID:", assessment_id);
        if (response.data.summary) {
          console.log("Nutrition summary:", response.data.summary);
        }
        router.push(
          `/homepage?email=${encodeURIComponent(email)}&rfid_tag=${encodeURIComponent(rfid_tag)}&admin_id=${admin_id}&system_type=${system_type}`
        );
      } else {
        throw new Error("Backend returned success: false");
      }

    } catch (err) {
      console.error("Error saving assessment:", err);
      Alert.alert("Error", "Failed to save assessment");
    }
  };

  const goBack = () => step > 0 && setStep(prev => prev - 1);

  const openFoodSelectionModal = async (macro, foodGroupId, foodGroupName, currentSelectedFood) => {
    try {
      setModalMacro(macro);
      setModalFoodGroup(foodGroupName);
      setModalSelected(currentSelectedFood.id);
      
      const allFoods = await getAllSpecificFoods(foodGroupId);
      setModalOptions(allFoods);
      setModalVisible(true);
    } catch (err) {
      console.error("Error opening food selection modal:", err);
      Alert.alert("Error", "Failed to load food options");
    }
  };

  const confirmFoodSelection = () => {
    const selectedFood = modalOptions.find(f => f.id === modalSelected);
    if (selectedFood) {
      const updatedSpecificFoods = { ...selectedSpecificFoods };
      const macroFoods = updatedSpecificFoods[modalMacro];
      const foodIndex = macroFoods.findIndex(f => f.food_group_name === modalFoodGroup);
      
      if (foodIndex !== -1) {
        updatedSpecificFoods[modalMacro][foodIndex].selected_food = selectedFood;
        setSelectedSpecificFoods(updatedSpecificFoods);
        
        const updatedBestFoods = { ...bestFoods };
        const bestFoodIndex = updatedBestFoods[modalMacro].findIndex(f => f.food_group_name === modalFoodGroup);
        if (bestFoodIndex !== -1) {
          updatedBestFoods[modalMacro][bestFoodIndex] = {
            ...selectedFood,
            food_group_id: updatedBestFoods[modalMacro][bestFoodIndex].food_group_id,
            food_group_name: modalFoodGroup
          };
          setBestFoods(updatedBestFoods);
        }
      }
    }
    setModalVisible(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-gray-800">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        {current.type === "info" ? (
          <>
            <Text className="text-3xl font-bold text-white text-center mb-4">{current.content(username).title}</Text>
            <Text className="text-lg text-white text-center mb-10">{current.content(username).message}</Text>
            {loadingSpecificFoods && (
              <View className="items-center mt-4">
                <Text className="text-white text-sm">Finding the best foods for you...</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text className="text-2xl font-bold mb-4 text-white text-center">{current.question}</Text>
            {current.subtitle && <Text className="text-sm text-gray-300 text-center mb-6">{current.subtitle}</Text>}
          </>
        )}
        {current.key === "diet_type" && (
          <View className="space-y-4">
            {current.options.map((dietType) => (
              <TouchableOpacity
                key={dietType}
                onPress={() => selectDietType(dietType)}
                className={`p-4 rounded-lg border-2 ${
                  answers.diet_type === dietType 
                    ? "border-purple-500 bg-purple-900/30" 
                    : "border-gray-500 bg-gray-700"
                }`}
              >
                <Text className={`text-center font-semibold text-lg ${
                  answers.diet_type === dietType ? "text-purple-300" : "text-white"
                }`}>
                  {dietType}
                </Text>
                {dietType === "Balanced" && (
                  <Text className="text-gray-400 text-sm text-center mt-1">
                    Includes all food groups including meats
                  </Text>
                )}
                {dietType === "Vegetarian" && (
                  <Text className="text-gray-400 text-sm text-center mt-1">
                    No meat options will be shown
                  </Text>
                )}
                {dietType === "No Red Meat" && (
                  <Text className="text-gray-400 text-sm text-center mt-1">
                    Fish and poultry only, no red meat
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {current.key === "food_preferences" && current.macroGrouped &&
          Object.entries(filteredFoodGroups).map(([macro, items]) => (
            <View key={macro} className="mb-6">
              <Text className="text-white font-semibold mb-2">{String(macro)}</Text>
              <View className="flex-row flex-wrap gap-2">
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleFood(macro, item.id)}
                    className={`px-4 py-2 rounded ${
                      answers.food_preferences?.[macro]?.includes(item.id)
                        ? "bg-green-600"
                        : "bg-gray-500"
                    }`}
                  >
                    <Text className="text-white">{String(item.name)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        {current.key === "best_foods" && bestFoods &&
          Object.entries(bestFoods).map(([macro, foods]) => (
            <View key={macro} className="mb-6">
              <Text className="text-white font-semibold mb-3 text-lg">{String(macro)}</Text>
              <View className="space-y-2">
                {foods.map((food, index) => (
                  <TouchableOpacity
                    key={`${food.food_group_id}-${index}`}
                    onPress={() => openFoodSelectionModal(macro, food.food_group_id, food.food_group_name, food)}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-lg border border-purple-400"
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-lg">{food.name}</Text>
                        <Text className="text-purple-200 text-sm">from {food.food_group_name}</Text>
                        {food.nutritional_info && (
                          <Text className="text-purple-100 text-xs mt-1">
                            {food.nutritional_info.calories ? `${food.nutritional_info.calories} cal` : 'Nutritional info available'}
                          </Text>
                        )}
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-purple-200 text-sm mr-2">Change</Text>
                        <Ionicons name="chevron-forward" size={20} color="#c4b5fd" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        {current.key === "allergies" && (
          <>
            <View className="flex-row flex-wrap gap-2">
              {allergensList.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => toggleAllergy(a.id)}
                  className={`px-4 py-2 rounded ${answers.allergies?.includes(a.id) ? "bg-red-600" : "bg-gray-500"}`}
                >
                  <Text className="text-white">{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {answers.allergies?.includes("Other") && (
              <TextInput 
                className="bg-gray-200 mt-4 p-3 rounded" 
                placeholder="Please specify your allergy" 
                value={otherAllergy} 
                onChangeText={setOtherAllergy} 
              />
            )}
          </>
        )}
      </ScrollView>
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-lg w-11/12 max-h-4/5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold flex-1">{modalFoodGroup} Options</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-200 justify-center items-center"
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={modalOptions}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setModalSelected(item.id)}
                  className={`p-4 rounded-lg mb-2 border ${
                    modalSelected === item.id 
                      ? "border-purple-600 bg-purple-50" 
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <Text className={`font-semibold ${modalSelected === item.id ? 'text-purple-800' : 'text-gray-800'}`}>
                    {item.name}
                  </Text>
                  {item.nutritional_info && (
                    <Text className="text-gray-600 text-sm mt-1">
                      {item.nutritional_info.calories ? `${item.nutritional_info.calories} cal per serving` : 'Nutritional info available'}
                    </Text>
                  )}
                  {item.description && (
                    <Text className="text-gray-500 text-xs mt-1">{item.description}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            
            <View className="flex-row justify-end mt-4 space-x-2">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-gray-400 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmFoodSelection}
                className="bg-purple-600 px-6 py-3 rounded-lg ml-2"
              >
                <Text className="text-white font-bold">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View className="flex-row justify-between items-center p-4 border-t border-gray-700 bg-gray-900">
        {step > 0 ? (
          <TouchableOpacity
            onPress={goBack}
            className="w-12 h-12 rounded-full bg-gray-600 justify-center items-center"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <View className="w-12" />
        )}

        <TouchableOpacity
          onPress={goNext}
          className="flex-1 ml-4 bg-purple-600 py-4 rounded-lg"
          disabled={loadingSpecificFoods}
        >
          <Text className="text-white text-center font-bold text-lg">
            {current.type === "info"
              ? current.content(username)?.button || "Next"
              : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}