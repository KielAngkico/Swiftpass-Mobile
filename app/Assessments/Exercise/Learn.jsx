import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";

// Import all images at the top
const exerciseImage = require('../../../assets/images/exercise.jpg');
const setsRepsImage = require('../../../assets/images/setsReps.png');
const splitsImage = require('../../../assets/images/splits.jpg');
const warmupCooldownImage = require('../../../assets/images/warmupCooldown.png');
const stretchingImage = require('../../../assets/images/stretching.jpg');
const properFormImage = require('../../../assets/images/properForm.jpeg');
const mythsFactsImage = require('../../../assets/images/mythsFacts.jpg');

export default function Learn({ onNavigateToCoach }) {
  return (
    <ScrollView className="px-6 py-6">
      
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <View className="flex-row items-center mb-3">
          <Text className="text-white text-lg font-bold flex-1 text-center">
            Professional Coaching Recommended
          </Text>
        </View>
        <Text className="text-white text-sm leading-5 mb-4">
          This exercise guidance was developed in collaboration with our partnered Certified Gym Instructor (CGI). 
          For safe and personalized training, we recommend consulting with our licensed coach to ensure each workout 
          matches your fitness level and goals.
        </Text>
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-3 px-4 items-center"
          onPress={onNavigateToCoach}
        >
          <Text className="text-white font-bold text-sm">
            View Our Partnered Coach →
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-5">
        <Text className="text-white text-2xl font-bold text-center">
          Introduction to Exercise & Training
        </Text>
        <Text className="text-blue-100 text-sm  mt-2">
          Building strength and improving health through movement
        </Text>
      </View>

      {/* What is Exercise? */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-2 text-center">
          What is Exercise?
        </Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600">
          <Image 
            source={exerciseImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 text-sm leading-5 mt-3">
          Exercise is any physical activity that strengthens your body and improves overall health. 
          It helps boost energy, reduce stress, and enhance daily performance.{"\n\n"}
          Consistent training, paired with proper rest and recovery, is the foundation for long-term results.
        </Text>
      </View>

      {/* Understanding Reps and Sets */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-2 text-center">
          Understanding Reps and Sets
        </Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600">
          <Image 
            source={setsRepsImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 text-sm leading-5 mt-3">
          A <Text className="font-semibold text-gray-100">rep (repetition)</Text> is one complete movement of an exercise, 
          while a <Text className="font-semibold text-gray-100">set</Text> is a group of reps performed consecutively.{"\n\n"}
          For example, <Text className="font-semibold text-gray-100">3 x 12</Text> means you will perform 3 sets of 12 repetitions 
          — you do the exercise 12 times, rest, then repeat that 3 times total.{"\n\n"}
          Different exercises and goals may use varying rep and set combinations, but maintaining good form and proper 
          control during each rep is always most important.
        </Text>
      </View>

      {/* What Are Workout Splits? */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl ">
        <Text className="text-white text-lg font-bold mb-2 text-center">
          What Are Workout Splits?
        </Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600">
          <Image 
            source={splitsImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 text-sm leading-5 mt-3">
          A workout split is how your exercises are organized throughout your training days. 
          Each split focuses on specific muscle groups to ensure balanced development and proper recovery.{"\n\n"}
          It is based on the workout days you prefer. For example, the most common is 6 days per week using Push Pull Legs 
          — where Day 1 is Push (chest, triceps, shoulders), Day 2 is Pull (back, biceps), and Day 3 is Legs 
          (quads, hamstrings, glutes, calves), then the cycle repeats.{"\n\n"}
          In the SwiftPass system, workouts are personalized based on your chosen split, allowing you to train 
          efficiently while matching your fitness goals and preferences.
        </Text>
      </View>

      {/* Warm-Up and Cooldown */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-2 text-center">
          Warm-Up and Cooldown
        </Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600">
          <Image 
            source={warmupCooldownImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 text-sm leading-5 mt-3">
          Before starting your first set, always warm up your muscles to prevent injury and improve performance. 
          Begin with light movements or perform the same exercise using lighter weights to help your body adapt 
          before lifting heavier loads.{"\n\n"}
          After your workout, take a few minutes to cool down with gentle static stretches to relax your muscles 
          and reduce soreness.
        </Text>
      </View>

      {/* Stretching: Dynamic and Static */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-2 text-center">
          Stretching: Dynamic and Static
        </Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600">
          <Image 
            source={stretchingImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 text-sm leading-5 mt-3">
          Stretching helps improve flexibility, prevent injury, and prepare your body for movement.{"\n\n"}
          <Text className="font-semibold text-gray-100">Dynamic Stretching</Text> — Performed before workouts, 
          these are active movements (like arm circles, leg swings, or torso twists) that gently prepare your muscles 
          and joints for exercise.{"\n\n"}
          <Text className="font-semibold text-gray-100">Static Stretching</Text> — Performed after workouts, 
          these involve holding a stretch in place for 15–30 seconds (like touching your toes or stretching your shoulders) 
          to relax muscles and improve flexibility.
        </Text>
      </View>

      {/* Proper Form and Recovery */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-2 text-center">
          Proper Form and Recovery
        </Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600">
          <Image 
            source={properFormImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 text-sm leading-5 mt-3">
          Maintaining proper form ensures that the right muscles are being trained and reduces the risk of injury.{"\n\n"}
          Recovery is just as important as training — muscles grow and repair during rest, not during the workout itself.{"\n\n"}
          Listen to your body and allow time for recovery between sessions to achieve the best results.
        </Text>
      </View>

      {/* ❌ Exercise Myths & Facts */}
      <View className="bg-gray-800 rounded-2xl p-5 mb-10 shadow-xl">
        <Text className="text-white text-lg font-bold mb-3 text-center">❌ Exercise Myths & Facts</Text>
        <View className="bg-gray-700 rounded-xl overflow-hidden border-2 border-gray-600 mb-3">
          <Image 
            source={mythsFactsImage}
            className="w-full h-64"
            resizeMode="cover"
          />
        </View>
        <Text className="text-gray-300 text-sm leading-5">
          Myth: More workouts mean faster results.{"\n"}
          Truth: Overtraining can cause fatigue and injuries. Rest and recovery are essential for progress.{"\n\n"}
          
          Myth: Lifting weights makes you bulky.{"\n"}
          Truth: Strength training builds lean, toned muscle and improves overall body composition.{"\n\n"}
          
          Myth: You need long workouts to see progress.{"\n"}
          Truth: Quality matters more than duration. Consistent, focused workouts with proper form deliver the best results.
        </Text>
      </View>

    </ScrollView>
  );
}