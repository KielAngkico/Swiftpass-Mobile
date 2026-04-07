import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";

// Import all images at the top
const pinggangPinoyImage = require('../../../assets/images/pinggangPinoy.png');
const foodPyramidImage = require('../../../assets/images/foodPyramid.jpg');
const mythsFactsImage = require('../../../assets/images/mythsFacts.jpg');
const prePostWorkoutImage = require('../../../assets/images/prePostWorkout.jpg');
const foodLabelsImage = require('../../../assets/images/foodLabels.jpg');

export default function Learn({ onNavigateToRND }) {
  return (
    <ScrollView className="px-6 py-6">
      
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <View className="flex-row items-center mb-3">
          <Text className="text-white text-lg font-bold flex-1">
            Professional Guidance Recommended
          </Text>
        </View>
        <Text className="text-white text-sm leading-5 mb-4">
          This nutrition guidance was created in collaboration with our partnered Registered Nutritionist-Dietitian (RND). 
          For personalized meal plans and dietary advice tailored to your specific health needs and best results, 
          we strongly recommend consulting with our licensed RND.
        </Text>
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-3 px-4 items-center"
          onPress={onNavigateToRND}
        >
          <Text className="text-white font-bold text-sm">
            View Our Partnered RND →
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-5">
        <Text className="text-white text-2xl font-bold text-center">
          Introduction to Diet & Nutrition
        </Text>
        <Text className="text-blue-100 text-sm text-center mt-2">
          Understanding the basics of healthy eating
        </Text>
      </View>

      {/* What is a Diet? */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-2 text-center">
          What is a Diet?
        </Text>
        <Text className="text-gray-300 text-sm leading-5">
          A diet simply means the food you regularly eat. A <Text className="font-semibold text-gray-100">balanced diet</Text> provides 
          all the nutrients your body needs — including carbohydrates, proteins, fats, vitamins, and minerals — in proper 
          proportions to stay healthy and energetic.
        </Text>
      </View>

      {/* What are Calories? */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-2 text-center">
          What are Calories?
        </Text>
        <Text className="text-gray-300 text-sm leading-5">
          <Text className="font-semibold text-gray-100">Calories</Text> are units of energy that your body uses to function and move. 
          Think of them as fuel for your body.{"\n\n"}
          {"\u2022"} Eating more calories than you burn leads to weight gain{"\n"}
          {"\u2022"} Eating fewer calories than you burn leads to weight loss{"\n"}
          {"\u2022"} Eating the right amount maintains your weight
        </Text>
      </View>

      {/* What are Macronutrients? */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-3 text-center">
          What are Macronutrients?
        </Text>
        <Text className="text-gray-300 text-sm leading-5 mb-4">
          Macronutrients (or "macros") are the three main nutrients your body needs in large amounts to function properly. 
          They provide energy and support vital body functions.
        </Text>

        {/* Carbohydrates */}
        <View className="bg-gray-700/50 rounded-xl p-4 mb-3">
          <Text className="text-white text-base font-bold mb-1">
             Carbohydrates
          </Text>
          <Text className="text-gray-300 text-sm leading-5">
            Your main energy source — they fuel your brain and muscles.{"\n"}
            Found in: rice, bread, pasta, fruits, and vegetables
          </Text>
        </View>

        {/* Proteins */}
        <View className="bg-gray-700/50 rounded-xl p-4 mb-3">
          <Text className="text-white text-base font-bold mb-1">
            Proteins
          </Text>
          <Text className="text-gray-300 text-sm leading-5">
            Help build and repair muscles, tissues, and cells in your body.{"\n"}
            Found in: meat, fish, eggs, beans, tofu, and dairy
          </Text>
        </View>

        {/* Fats */}
        <View className="bg-gray-700/50 rounded-xl p-4">
          <Text className="text-white text-base font-bold mb-1">
            Fats
          </Text>
          <Text className="text-gray-300 text-sm leading-5">
            Support hormone production, brain function, and nutrient absorption.{"\n"}
            Choose healthy fats: olive oil, nuts, avocado, and fish
          </Text>
        </View>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-2 text-center">
          Pinggang Pinoy & Healthy Plate
        </Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600">
          <Image 
            source={pinggangPinoyImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 mt-3 text-sm leading-5">
          Learn how to build a balanced meal using Pinggang Pinoy — half your plate for fruits and vegetables, 
          one-fourth for protein-rich foods, and one-fourth for whole grains or carbohydrates.
        </Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-2 text-center">Food Pyramid</Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600">
          <Image 
            source={foodPyramidImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 mt-3 text-sm leading-5">
          The food pyramid shows the recommended proportions of food groups — grains at the base, 
          followed by fruits and vegetables, protein, and small amounts of fats and oils.
        </Text>
      </View>

      {/* ❌ Nutrition Myths */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-3 text-center">❌ Nutrition Myths</Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600 mb-3">
          <Image 
            source={mythsFactsImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 text-sm leading-5">
          Myth: Carbs make you fat.{"\n"}
          Truth: Excess calories, not carbs, lead to weight gain. Choose whole grains for energy.{"\n\n"}
          Myth: Skipping meals helps you lose weight.{"\n"}
          Truth: Skipping meals can slow metabolism and increase cravings.
        </Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-3 text-center">Pre- and Post-Workout Meals</Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600 mb-3">
          <Image 
            source={prePostWorkoutImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 text-sm leading-5">
          Pre-workout: Eat complex carbs and protein 1–2 hours before exercise.{"\n"}
          Post-workout: Replenish with protein and carbs to repair muscles and restore glycogen.
        </Text>
      </View>

      {/* 🔍 Reading Food Labels */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-10 shadow-xl">
        <Text className="text-white text-lg font-bold mb-3 text-center">🔍 Reading Food Labels</Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600 mb-3">
          <Image 
            source={foodLabelsImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 text-sm leading-5">
          Check serving size, calories, and nutrients per serving.{"\n"}
          Watch out for added sugars and high sodium levels in packaged foods.
        </Text>
      </View>
    </ScrollView>
  );
}