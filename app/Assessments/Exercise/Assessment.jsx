import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import API from "../../../backend-api/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const steps = [
  {
    key: "welcome",
    type: "info",
    content: (username) => ({
      title: `Hello, ${username || "User"}!`,
      message: "We'd like to learn more about your training style to give you the best program.",
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
    key: "calculating",
    type: "info",
    content: () => ({
      title: "Loading your workout plan...",
      message: "Please wait while we prepare your personalized exercise program.",
      button: "Next",
    }),
  },
  {
    key: "review_exercises",
    type: "review",
    question: "Here's your personalized workout plan!",
    subtitle: "Review your exercises before we save your plan",
  },
  {
    key: "done",
    type: "info",
    content: (username) => ({
      title: `Perfect, ${username || "User"}!`,
      message: "Your exercise plan has been saved and is ready for you to start training!",
      button: "Continue to Homepage",
    }),
  },
];

export default function ExerciseAssessment() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [splitOptions, setSplitOptions] = useState([]);
  const [reviewExercises, setReviewExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const current = steps[step];
  const username = "Kiel";

  const handleSelect = async (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));

    if (key === "workout_days") {
      try {
        setLoading(true);
        const res = await API.get(`/splits/days/${value}`);
        
        console.log("📥 API Response for splits:", res.data);
        

        const data = Array.isArray(res.data) ? res.data : [res.data];
        const splits = data.filter(s => s && s.split_name).map((s) => s.split_name);
        
        console.log("📋 Available splits:", splits);
     
        const splitStep = steps.find((s) => s.key === "split_choice");
        splitStep.options = splits;
        setSplitOptions(splits);
      } catch (err) {
        console.error("Error fetching splits:", err);
        Alert.alert("Error", "Failed to load workout splits. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchExercisePreview = async (splitName) => {
    try {
      setLoading(true);
      const res = await API.get(`/exercise-plan/preview?split_name=${encodeURIComponent(splitName)}`);
      const exercises = res.data.days || [];
      setReviewExercises(exercises);
      return true;
    } catch (err) {
      console.error("❌ Error fetching exercises:", err);
      Alert.alert("Error", "Failed to load exercise preview. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

const saveAssessment = async () => {
  try {
    setLoading(true);
    console.log("🟡 Save button clicked!");

    const memberId = await AsyncStorage.getItem("member_id");
    const rfid_tag = await AsyncStorage.getItem("rfid_tag");
    console.log("🔑 Loaded from storage:", { memberId, rfid_tag });

    const exerciseData = {
      member_id: parseInt(memberId, 10),
      rfid_tag,
      fitness_level: answers.athlete_level?.toLowerCase() || "beginner",
      workout_days: Number(answers.workout_days) || null,
      assigned_split_name: answers.split_choice || null,
      coach_notes: null,
      admin_id: null,
    };

    if (!exerciseData.member_id || !exerciseData.rfid_tag) {
      Alert.alert("Error", "Missing member information. Please log in again.");
      return false; 
    }
    if (!exerciseData.workout_days || !exerciseData.assigned_split_name) {
      Alert.alert("Error", "Please select workout days and a split plan before saving.");
      return false; 
    }

    console.log("📤 About to POST:", exerciseData);

    const res = await API.post(
      `/exercise/${exerciseData.member_id}`,
      exerciseData
    );

    console.log("✅ Save success:", res.data);

    return true; 

  } catch (err) {
    console.error("❌ Save error:", err.response?.data || err.message);
    Alert.alert("Error", `Failed to save assessment: ${err.response?.data?.error || err.message}`);
    return false; 
  } finally {
    setLoading(false);
  }
};

const goNext = async () => {

  if (
    !["welcome", "done", "review_exercises", "calculating"].includes(current.key) &&
    (answers[current.key] === undefined || answers[current.key] === null || answers[current.key] === "")
  ) {
    Alert.alert("Selection Required", "Please select an option to continue.");
    return;
  }

  if (current.key === "split_choice") {
    if (!answers.split_choice) {
      Alert.alert("Error", "Please select a split plan first.");
      return;
    }

    setStep((prev) => prev + 1); 
    const success = await fetchExercisePreview(answers.split_choice);
    if (success) {
      setStep((prev) => prev + 1); 
    }
    return;
  }

  if (current.key === "review_exercises") {
    const success = await saveAssessment();
    if (success) {
      setStep((prev) => prev + 1);
    }
    return;
  }

  if (current.key === "done") {
    try {
      const memberId = await AsyncStorage.getItem("member_id");
      const admin_id = await AsyncStorage.getItem("admin_id");
      const rfid_tag = await AsyncStorage.getItem("rfid_tag");
      const email = await AsyncStorage.getItem("email");
      const system_type = await AsyncStorage.getItem("system_type");

      router.push(
        `/homepage?email=${encodeURIComponent(email)}&rfid_tag=${encodeURIComponent(rfid_tag)}&admin_id=${admin_id}&system_type=${system_type}`
      );
    } catch (err) {
      console.error("Error redirecting to homepage:", err);
      Alert.alert("Error", "Failed to go to homepage");
    }
    return;
  }

  if (step < steps.length - 1) {
    setStep((prev) => prev + 1);
  }
};



  const goBack = () => {
    if (step > 0) {
      if (current.key === "review_exercises") {
        setStep((prev) => prev - 2); 
      } else if (current.key === "calculating") {
        setStep((prev) => prev - 1); 
      } else {
        setStep((prev) => prev - 1);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-gray-800"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
      >

        {current.type === "info" && (
          <>
            <Text className="text-3xl font-bold text-white text-center mb-4">
              {String(current.content(username).title)}
            </Text>
            <Text className="text-lg text-white text-center mb-10">
              {String(current.content(username).message)}
            </Text>
            {current.key === "calculating" && loading && (
              <View className="items-center mt-4">
                <Text className="text-white text-sm">Preparing your workout plan...</Text>
              </View>
            )}
          </>
        )}

        {!current.type && (
          <Text className="text-2xl font-bold mb-6 text-white text-center">
            {String(current.question)}
          </Text>
        )}

        {current.key === "review_exercises" && (
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

        {current.key === "split_choice" &&
          splitOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              className={`py-4 px-4 rounded-lg mb-3 border ${
                answers.split_choice === opt
                  ? "bg-white border-white"
                  : "bg-gray-600 border-gray-400"
              }`}
              onPress={() => handleSelect("split_choice", opt)}
              disabled={loading}
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

        {!current.type &&
          current.key !== "split_choice" &&
          current.options?.map((opt) => (
            <TouchableOpacity
              key={opt}
              className={`py-4 px-4 rounded-lg mb-3 border ${
                answers[current.key] === opt
                  ? "bg-white border-white"
                  : "bg-gray-600 border-gray-400"
              }`}
              onPress={() => handleSelect(current.key, opt)}
              disabled={loading}
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

        {current.key === "review_exercises" && (
          <View>
            {loading ? (
              <View className="items-center py-8">
                <Text className="text-white text-center text-lg mb-2">Loading exercises...</Text>
                <Text className="text-gray-400 text-center text-sm">Preparing your workout plan</Text>
              </View>
            ) : reviewExercises.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-white text-center text-lg mb-2">No exercises found</Text>
                <Text className="text-gray-400 text-center text-sm">Please try selecting a different split</Text>
              </View>
            ) : (
              <>

                <View className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg border border-purple-400">
                  <Text className="text-white text-center text-lg font-bold mb-2">Your Workout Plan</Text>
                  <Text className="text-purple-200 text-center mb-1">
                    <Text className="font-semibold">Split:</Text> {answers.split_choice}
                  </Text>
                  <Text className="text-purple-200 text-center mb-1">
                    <Text className="font-semibold">Days per week:</Text> {answers.workout_days}
                  </Text>
                  <Text className="text-purple-200 text-center">
                    <Text className="font-semibold">Level:</Text> {answers.athlete_level}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-white font-bold text-xl mb-4 text-center">
                    Weekly Schedule
                  </Text>
                  
                  {reviewExercises.map((day, index) => (
                    <View key={index} className="mb-6 bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
 
                      <View className="bg-gradient-to-r from-purple-700 to-purple-800 p-4">
                        <Text className="text-white font-bold text-lg text-center">
                          Day {day.day_number}
                        </Text>
                        <Text className="text-purple-200 text-center text-sm mt-1">
                          {day.day_title}
                        </Text>
                      </View>

                      <View className="p-4">
                        {day.exercises && day.exercises.length > 0 ? (
                          <View>
                            <Text className="text-gray-300 text-sm mb-3 text-center">
                              {day.exercises.length} exercises planned
                            </Text>
                            {day.exercises.map((ex, exIndex) => (
                              <View key={exIndex} className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
                                <Text className="text-white font-semibold text-base mb-1">
                                  {ex.name}
                                </Text>
                                
                                <View className="flex-row justify-between items-center mb-1">
                                  <Text className="text-gray-300 text-sm">
                                    {ex.sets ? `${ex.sets} sets` : '3 sets'} × {ex.reps || '6-12 reps'}
                                  </Text>
                                  <Text className="text-purple-300 text-sm font-medium">
                                    {ex.muscle_group}
                                  </Text>
                                </View>

                                {ex.equipment && (
                                  <Text className="text-gray-400 text-xs mt-1">
                                    Equipment: {ex.equipment}
                                  </Text>
                                )}

                                {ex.rest_time && (
                                  <Text className="text-gray-400 text-xs">
                                    Rest: {ex.rest_time}
                                  </Text>
                                )}
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text className="text-gray-400 text-center py-4">
                            No exercises found for this day
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      <View className="flex-row justify-between items-center p-4 border-t border-gray-700 bg-gray-900">
        {step > 0 && current.key !== "calculating" ? (
          <TouchableOpacity
            onPress={goBack}
            className="w-12 h-12 rounded-full bg-gray-600 justify-center items-center"
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <View className="w-12" />
        )}

        <TouchableOpacity
          onPress={goNext}
          className={`flex-1 ml-4 py-4 rounded-lg ${
            loading ? "bg-gray-500" : "bg-purple-600"
          }`}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold text-lg">
            {loading
              ? "Loading..."
              : step === steps.length - 1
              ? "Finish"
              : current.key === "review_exercises"
              ? "Save My Plan"
              : current.key === "calculating"
              ? "Please wait..."
              : current.type === "info"
              ? current.content(username)?.button || "Next"
              : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}