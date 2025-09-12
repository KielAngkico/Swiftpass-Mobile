import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import API from '../../../backend-api/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const questions = [
  { key: 'username', question: "What should we call you?", input: true },
  {
    key: 'body_goal',
    question: (name) => `Hello ${name || ''}, may we know your body goal?`,
    options: ['Lose Weight', 'Gain Weight', 'Body Recomp', 'Maintain Weight'],
  },
  {
    key: 'goal_type',
    question: 'What type of goal suits you best?',
    options: [
      { label: 'Get Toned', info: 'Slim down and increase muscle definition' },
      { label: 'Build Muscle', info: 'Increase muscle size and strength' },
      { label: 'Build Endurance', info: 'Improve stamina and overall fitness' },
    ],
  },
  {
    key: 'activity_level',
    question: 'How active are you?',
    options: [
      { label: 'Sedentary', info: 'Little or no exercise' },
      { label: 'Light', info: 'Light exercise 1-3 days/wk' },
      { label: 'Moderate', info: 'Moderate exercise 3-5 days/wk' },
      { label: 'Active', info: 'Hard exercise 6-7 days/wk' },
      { label: 'Very Active', info: 'Very intense exercise, physical job' },
    ],
  },
  { key: 'personal_info', question: 'Tell us a little bit about yourself' },
];

export default function InitialAssessment() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCalories, setShowCalories] = useState(false);

  const current = questions[step];
  const username = formData.username || '';

  useEffect(() => {
    if (current?.input) {
      setInputValue(formData[current.key] || '');
    } else {
      setInputValue('');
    }
  }, [step]);

  const handleSelect = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value.toLowerCase() }));
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim()) {
      Alert.alert('Input required', `Please enter your ${current.key.replace('_', ' ')}`);
      return false;
    }
    setFormData((prev) => ({ ...prev, [current.key]: inputValue.trim() }));
    return true;
  };

const goNext = () => {
  if (current?.input && !formData[current.key]) {
    if (!handleInputSubmit()) return;
  }
  if (current?.options && !formData[current.key]) {
    Alert.alert('Selection required', 'Please choose one option to continue');
    return;
  }

  if (step === questions.length - 1) {
    setShowCalories(true);
    return;
  }

  setStep((prev) => prev + 1);
};


  const goBack = () => {
    if (showCalories) {
      setShowCalories(false);
      return;
    }
    if (step > 0) setStep((prev) => prev - 1);
  };

const calculateCalories = () => {
  const weightKg = parseFloat(formData.weight_kg); 
  const heightCm = parseFloat(formData.height_cm);
  const age = parseInt(formData.age, 10);
  const sex = formData.sex;

  if (!weightKg || !heightCm || !age || !sex) return null;

 let bmr =
    sex === 'male'
      ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
      : (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;

  const activityFactors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very active': 1.9,
  };

  return Math.round(bmr * (activityFactors[formData.activity_level] || 1.2));
};

const roundToNearest5 = (num) => Math.round(num / 5) * 5;

const calorieOptions = () => {
  const tdee = calculateCalories();
  if (!tdee) return [];

  if (formData.body_goal === 'lose weight') {
    return [
      { label: 'Maintain weight', calories: roundToNearest5(tdee), desc: '100% Calories/day', strategy: 'Maintain' },
      { label: 'Mild weight loss', calories: roundToNearest5(tdee * 0.875), desc: '0.25 kg/week (87%)', strategy: 'Mild' },
      { label: 'Weight loss', calories: roundToNearest5(tdee * 0.75), desc: '0.5 kg/week (75%)', strategy: 'Moderate' },
      { label: 'Extreme loss', calories: roundToNearest5(tdee * 0.499), desc: '1 kg/week (50%)', strategy: 'Extreme' },
    ];
  }

  if (formData.body_goal === 'gain weight') {
    return [
      { label: 'Maintain weight', calories: roundToNearest5(tdee), desc: '100% Calories/day', strategy: 'Maintain' },
      { label: 'Mild gain', calories: roundToNearest5(tdee * 1.125), desc: '0.25 kg/week (110%)', strategy: 'Mild' },
      { label: 'Gain', calories: roundToNearest5(tdee * 1.25), desc: '0.5 kg/week (120%)', strategy: 'Moderate' },
      { label: 'Fast gain', calories: roundToNearest5(tdee * 1.5), desc: '1 kg/week (140%)', strategy: 'Extreme' },
    ];
  }

  return [
    { label: 'Maintain weight', calories: roundToNearest5(tdee), desc: '100% Calories/day', strategy: 'Maintain' },
  ];
};


const handleSubmit = async () => {
  setLoading(true);

  try {
    const member_id = await AsyncStorage.getItem('member_id');
    const admin_id = await AsyncStorage.getItem('admin_id');
    const rfid_tag = await AsyncStorage.getItem('rfid_tag');
    const email = await AsyncStorage.getItem('email');
    const system_type = await AsyncStorage.getItem('system_type');

    if (!member_id || !rfid_tag) {
      Alert.alert('Error', 'Missing member information. Please log in again.');
      return;
    }

    const tdee = calculateCalories();

    const payload = {
      member_id: parseInt(member_id, 10),
      rfid_tag,
      username: formData.username,
      sex: formData.sex,
      age: parseInt(formData.age, 10),
      height_cm: parseFloat(formData.height_cm),
      weight_kg: parseFloat(formData.weight_kg),
      activity_level: formData.activity_level,
      body_goal: formData.body_goal
        ? formData.body_goal.charAt(0).toUpperCase() + formData.body_goal.slice(1)
        : null,
      goal_type: formData.goal_type,
      calorie_maintenance: tdee,
      calories_target: formData.calories_target,
      calorie_strategy: formData.calorie_strategy,
    };

    await API.post('/initial-assessment', payload);

    Alert.alert('Success', 'Initial assessment saved!');

    router.push(`/homepage?email=${encodeURIComponent(email)}&rfid_tag=${encodeURIComponent(rfid_tag)}&admin_id=${admin_id}&system_type=${system_type}`);
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'Failed to save assessment');
  } finally {
    setLoading(false);
  }
};



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gray-700"
    >
      {loading ? (
        <ActivityIndicator size="large" color="#fff" className="mt-6" />
      ) : showCalories ? (
        <View className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
            <Text className="text-2xl font-bold mb-6 text-center text-white">Calorie Guide</Text>
            {calorieOptions().map((opt) => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setFormData((prev) => ({
                  ...prev,
                  calories_target: opt.calories,
                  calorie_strategy: opt.strategy,
                }))}
                className={`p-4 rounded-lg mb-3 border ${
                  formData.calories_target === opt.calories
                    ? 'bg-white border-white'
                    : 'bg-gray-600 border-gray-400'
                }`}
              >
                <Text className={`text-lg font-semibold ${
                  formData.calories_target === opt.calories ? 'text-black' : 'text-white'
                }`}>
                  {opt.label}: {opt.calories} kcal
                </Text>
                <Text className="text-gray-300 text-sm">{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View className="flex-row justify-between items-center p-4 border-t border-gray-500">
            <TouchableOpacity
              onPress={goBack}
              className="w-12 h-12 rounded-full bg-gray-500 justify-center items-center"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              className="flex-1 ml-4 bg-purple-600 py-4 rounded-lg"
            >
              <Text className="text-white text-center font-bold text-lg">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : step < questions.length ? (
        <View className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
            <Text className="text-2xl font-bold mb-6 text-center text-white">
              {typeof current.question === 'function' ? current.question(username) : current.question}
            </Text>

            {current.key === 'personal_info' ? (
              <>
                <View className="flex-row justify-center gap-4 mb-4">
                  {['Male', 'Female'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      className={`flex-1 py-4 rounded-lg border ${
                        formData.sex === option.toLowerCase() ? 'bg-white border-white' : 'bg-gray-600 border-gray-400'
                      }`}
                      onPress={() => handleSelect('sex', option)}
                    >
                      <Text className={`text-center font-semibold text-lg ${
                        formData.sex === option.toLowerCase() ? 'text-black' : 'text-white'
                      }`}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  placeholder="Enter your age"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  value={formData.age || ''}
                  onChangeText={(val) => setFormData((prev) => ({ ...prev, age: val }))}
                  className="border border-gray-400 rounded-lg p-4 text-lg text-white mb-4"
                />
                <TextInput
                  placeholder="How tall are you (cm)?"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  value={formData.height_cm || ''}
                  onChangeText={(val) => setFormData((prev) => ({ ...prev, height_cm: val }))}
                  className="border border-gray-400 rounded-lg p-4 text-lg text-white mb-4"
                />
                <TextInput
                placeholder="How much do you weigh (kg)?"
                placeholderTextColor="#ccc"
                keyboardType="numeric"
                value={formData.weight_kg || ''}
                onChangeText={(val) => setFormData((prev) => ({ ...prev, weight_kg: val }))}
                className="border border-gray-400 rounded-lg p-4 text-lg text-white"
                />

              </>
            ) : current.options ? (
              current.options.map((opt) => (
                <TouchableOpacity
                  key={opt.label || opt}
                  className={`py-4 px-4 rounded-lg mb-3 border ${
                    formData[current.key] === (opt.label || opt).toLowerCase() ? 'bg-white border-white' : 'bg-gray-600 border-gray-400'
                  }`}
                  onPress={() => handleSelect(current.key, opt.label || opt)}
                >
                  <Text className={`font-semibold text-lg ${
                    formData[current.key] === (opt.label || opt).toLowerCase() ? 'text-black' : 'text-white'
                  }`}>{opt.label || opt}</Text>
                  {opt.info && (
                    <Text className="text-sm text-gray-300 mt-1">{opt.info}</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : current.input ? (
              <TextInput
                placeholder={`Enter your ${current.key.replace('_', ' ')}`}
                placeholderTextColor="#ccc"
                keyboardType={current.inputType || 'default'}
                value={inputValue}
                onChangeText={setInputValue}
                onBlur={handleInputSubmit}
                returnKeyType="done"
                className="border border-gray-400 rounded-lg p-4 text-lg text-white"
              />
            ) : null}
          </ScrollView>

          <View className="flex-row justify-between items-center p-4 border-t border-gray-500">
            <TouchableOpacity
              onPress={goBack}
              className="w-12 h-12 rounded-full bg-gray-500 justify-center items-center"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goNext}
              className="flex-1 ml-4 bg-purple-600 py-4 rounded-lg"
            >
              <Text className="text-white text-center font-bold text-lg">
                {step === questions.length - 1 ? 'Finish' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
