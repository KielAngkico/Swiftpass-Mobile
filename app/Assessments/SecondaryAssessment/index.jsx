import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import API from '../../../backend-api/services/api';
import AsyncStorage from "@react-native-async-storage/async-storage";
const steps = [
  {
    key: "welcome",
    type: "info",
    content: (username) => ({
      title: `Hello, ${username || "User"}!`,
      message:
        "To better guide you on your fitness journey with our features, we would like to ask a few more questions.",
      button: "Get Started",
    }),
  },
  {
    key: "athlete_level",
    question: "What athlete level are you?",
    options: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    key: "cardio",
    question: "Do you like to include cardio?",
    options: ["Yes", "No", "Sometimes"],
  },
  {
    key: "workout_days",
    question: "How often do you plan to work out per week?",
    options: ["1", "2", "3", "4", "5", "6", "7"],
  },
  {
    key: "split_choice",
    question: "Choose a split plan",
    options: [],
  },
  {
    key: "food_preferences",
    question: "What foods do you like to eat?",
    subtitle: "Select options grouped by Protein, Carbs, Fats",
    macroGrouped: true,
    options: {
      Protein: ["Chicken", "Beef", "Fish", "Eggs"],
      Carbs: ["Rice", "Potato", "Bread", "Oats"],
      Fats: ["Avocado", "Nuts", "Olive Oil", "Butter"],
    },
  },
  {
    key: "allergies",
    question: "Do you have any allergies?",
    subtitle: "Select all that apply",
    options: [], 
  },
  {
    key: "done",
    type: "info",
    content: (username) => ({
      title: `That would be all, ${username || "User"}!`,
      message:
        "Thank you for your time — you can now access all features that will support your fitness journey!",
      button: "Continue to Homepage",
    }),
  },
];

export default function SecondaryAssessment() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [otherAllergy, setOtherAllergy] = useState("");
  const current = steps[step];
  const username = "Kiel";
  const [splitOptions, setSplitOptions] = useState([]);
  const [foodGroups, setFoodGroups] = useState({});
  const [allergensList, setAllergensList] = useState([]);
  const [macroBreakdownId, setMacroBreakdownId] = useState(null);


  useEffect(() => {

    const fetchAllergens = async () => {
      try {
        const res = await API.get("/allergens");
        const allergens = Array.isArray(res.data) ? res.data : [];
        setAllergensList([...allergens, { id: "Other", name: "Other (please specify)" }]);

        steps.find((s) => s.key === "allergies").options = [...allergens.map(a => a.name), "Other"];
      } catch (err) {
        console.error("Error fetching allergens:", err);
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
        acc[item.category].push({ name: item.name, id: item.id });
        return acc;
      }, {});

      const foodPrefStep = steps.find((s) => s.key === "food_preferences");
      if (foodPrefStep) {
        foodPrefStep.options = Object.fromEntries(
          Object.entries(grouped).map(([macro, items]) => [
            macro,
            items.map((i) => i.name), 
          ])
        );
      }

      setFoodGroups(grouped); 
    } catch (err) {
      console.error("Error fetching food groups:", err);
    }
  };

  fetchFoodGroups();
}, []);



useEffect(() => {
  const fetchInitialAssessment = async () => {
    try {
      const memberId = await AsyncStorage.getItem("member_id");
      if (!memberId) return;

      const res = await API.get(`/assessment/initial/${memberId}`);
      if (res.data && res.data.goal_type) {
        setAnswers(prev => ({
          ...prev,
          goal_type: res.data.goal_type,
          calories_target: res.data.calories_target || 2000,
        }));
      }
    } catch (err) {
      console.error("Error fetching initial assessment:", err);
    }
  };
  fetchInitialAssessment();
}, []);

  const handleSelect = async (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (key === "workout_days") {
      try {
        const res = await API.get(`/splits/days/${value}`);
        const data = Array.isArray(res.data) ? res.data : [res.data];
        const splits = data.map((s) => s.split_name);
        steps.find((s) => s.key === "split_choice").options = splits;
        setSplitOptions(splits);
      } catch (err) {
        console.error("Error fetching splits:", err);
      }
    }
  };

const toggleFood = (macro, id) => {
  const prev = answers.food_preferences?.[macro] || [];
  const updated = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
  setAnswers(prevState => ({
    ...prevState,
    food_preferences: { ...prevState.food_preferences, [macro]: updated },
  }));
};



  const toggleAllergy = (id) => {
    const prev = answers.allergies || [];
    const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
    setAnswers((prevState) => ({ ...prevState, allergies: updated }));
  };

const goNext = async () => {

  if (
    current.key !== "food_preferences" &&
    current.key !== "welcome" &&
    current.key !== "done" &&
    (!answers[current.key] || answers[current.key].length === 0)
  ) {
    return;
  }

  if (current.key === "allergies" && answers.allergies?.includes("Other")) {
    setAnswers((prev) => ({ ...prev, other_allergy: otherAllergy }));
  }

  if (step < steps.length - 1) {
    setStep((prev) => prev + 1);
    return;
  }

  try {

    const memberId = await AsyncStorage.getItem("member_id");
    const rfid_tag = await AsyncStorage.getItem("rfid_tag");

    if (!memberId || !rfid_tag) {
      console.error("Missing member info:", { memberId, rfid_tag });
      Alert.alert("Error", "Missing member information. Please log in again.");
      return;
    }

    let goal_type = answers.goal_type;
    if (!goal_type) {
      const resInitial = await API.get(`/assessment/initial/${memberId}`);
      goal_type = resInitial.data?.goal_type;
      if (!goal_type) throw new Error("Goal type missing");
      setAnswers((prev) => ({ ...prev, goal_type }));
    }

    const trimmedGoalType = goal_type.trim();
    let macroBreakdownId = null;
    let macroPct = { protein_pct: 0.3, carbs_pct: 0.4, fats_pct: 0.3 };

    try {
      const resMacro = await API.get(`/macro-breakdown/${encodeURIComponent(trimmedGoalType)}`);
      const data = resMacro?.data;

      if (!data || typeof data.id !== "number") {
        throw new Error(`Macro breakdown not found for goal_type: "${trimmedGoalType}"`);
      }

      macroBreakdownId = data.id;
      macroPct = {
        protein_pct: Number(data.protein_pct),
        carbs_pct: Number(data.carbs_pct),
        fats_pct: Number(data.fats_pct),
      };

      console.log("✅ Parsed macro breakdown:", macroBreakdownId, macroPct);
    } catch (err) {
      console.error("❌ Error fetching macro breakdown:", err.message);
      throw err;
    }

    const calories = answers.calories_target || 2000;
    const protein_grams = Math.round((calories * (macroPct.protein_pct / 100)) / 4);
    const carbs_grams = Math.round((calories * (macroPct.carbs_pct / 100)) / 4);
    const fats_grams = Math.round((calories * (macroPct.fats_pct / 100)) / 9);

const foodPreferencesArray = [];
if (answers.food_preferences) {
  Object.entries(answers.food_preferences).forEach(([macro, selectedIds]) => {
    if (Array.isArray(selectedIds)) {
      selectedIds.forEach((id) => {
        foodPreferencesArray.push({ macro_type: macro, food_group_id: id });
      });
    }
  });
}

    const nutritionData = {
      member_id: parseInt(memberId, 10),
      rfid_tag,
      allergens: answers.allergies || [],
      food_preferences: foodPreferencesArray,
      calories_target: calories,
      protein_grams,
      carbs_grams,
      fats_grams,
      macro_breakdown_id: macroBreakdownId,
    };

    const exerciseData = {
      member_id: parseInt(memberId, 10),
      rfid_tag,
      admin_id: answers.admin_id || null,
      fitness_level: answers.athlete_level?.toLowerCase() || "beginner",
      workout_days: parseInt(answers.workout_days) || null,
      assigned_split_name: answers.split_choice || null,
      coach_notes: answers.coach_notes || null,
    };

    console.log("📤 Posting Nutrition:", `/nutrition/${memberId}`, nutritionData);
    const resNutrition = await API.post(`/nutrition/${memberId}`, nutritionData);
    console.log("✅ Nutrition saved:", resNutrition.data);

    console.log("📤 Posting Exercise:", `/exercise/${memberId}`, exerciseData);
    const resExercise = await API.post(`/exercise/${memberId}`, exerciseData);
    console.log("✅ Exercise saved:", resExercise.data);

    router.push("/homepage");
  } catch (err) {
    console.error("❌ Error saving assessment:", err.response?.data || err.message);
    Alert.alert("Error", "Failed to save assessment. Please try again.");
  }
};








  const goBack = () => step > 0 && setStep((prev) => prev - 1);

return (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    className="flex-1 bg-gray-800"
  >
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
    >
      {current.type === "info" ? (
        <>
          <Text className="text-3xl font-bold text-white text-center mb-4">
            {String(current.content(username).title)}
          </Text>
          <Text className="text-lg text-white text-center mb-10">
            {String(current.content(username).message)}
          </Text>
        </>
      ) : (
        <>
          <Text className="text-2xl font-bold mb-4 text-white text-center">
            {String(current.question)}
          </Text>
          {current.subtitle && (
            <Text className="text-sm text-gray-300 text-center mb-6">
              {String(current.subtitle)}
            </Text>
          )}
        </>
      )}
      {current.macroGrouped &&
        Object.entries(foodGroups).map(([macro, items]) => (
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
      {current.key === "allergies" && (
        <>
          <View className="flex-row flex-wrap gap-2">
            {allergensList.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => toggleAllergy(a.id)}
                className={`px-4 py-2 rounded ${
                  answers.allergies?.includes(a.id) ? "bg-red-600" : "bg-gray-500"
                }`}
              >
                <Text className="text-white">{String(a.name)}</Text>
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
      {current.key === "split_choice" &&
        splitOptions.map((opt) => (
          <TouchableOpacity
            key={opt}
            className={`py-4 px-4 rounded-lg mb-3 border ${
              answers.split_choice === opt ? "bg-white border-white" : "bg-gray-600 border-gray-400"
            }`}
            onPress={() => handleSelect("split_choice", opt)}
          >
            <Text
              className={`font-semibold text-lg ${
                answers.split_choice === opt ? "text-black" : "text-white"
              }`}
            >
              {String(opt)}
            </Text>
          </TouchableOpacity>
        ))}
      {!current.macroGrouped &&
        !current.type &&
        current.key !== "allergies" &&
        current.key !== "split_choice" &&
        current.options?.map((opt) => (
          <TouchableOpacity
            key={opt}
            className={`py-4 px-4 rounded-lg mb-3 border ${
              answers[current.key] === opt ? "bg-white border-white" : "bg-gray-600 border-gray-400"
            }`}
            onPress={() => handleSelect(current.key, opt)}
          >
            <Text
              className={`font-semibold text-lg ${
                answers[current.key] === opt ? "text-black" : "text-white"
              }`}
            >
              {String(opt)}
            </Text>
          </TouchableOpacity>
        ))}
    </ScrollView>

    {/* Navigation */}
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
      >
        <Text className="text-white text-center font-bold text-lg">
          {String(
            step === steps.length - 1
              ? "Finish"
              : current.type === "info"
              ? current.content(username)?.button || "Next"
              : "Next"
          )}
        </Text>
      </TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
);

}
