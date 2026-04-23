import { View, Text, ScrollView, Image } from "react-native";

const RND = require('../../../assets/images/MaamThina.png');

export default function RNDTab() {
  return (
    <ScrollView className="px-6 py-6">
      <View className="bg-gray-800 rounded-2xl p-6 mb-5 shadow-xl items-center">
        <Text className="text-white text-2xl font-bold mb-2 text-center">Registered Nutritionist-Dietitian</Text>
        <Text className="text-gray-400 text-center text-sm mb-4">
          The nutritional guidance and educational materials in this module were developed 
          in collaboration with a licensed Registered Nutritionist-Dietitian (RND).
        </Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <View className="bg-gray-700 rounded-xl overflow-hidden mb-3">
          <Image 
            source={RND}
            className="w-full h-[400px]"
            resizeMode="cover"
          />
        </View>
        <Text className="text-white text-lg font-bold text-center mb-1">Ms. Christina A. Gonzales, LPT, RND</Text>
        <Text className="text-gray-300 text-center text-sm leading-5 mb-4">
          A licensed professional teacher and registered nutritionist-dietitian dedicated to 
          promoting science-based wellness, balanced eating, and practical nutrition education.
        </Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-3 text-center">Professional Background</Text>
        <Text className="text-gray-300 text-sm leading-5 mb-3">
          Ms. Gonzales holds a Bachelor of Science in Nutrition and Dietetics from the 
          Polytechnic University of the Philippines. She successfully passed the Board 
          Examination for Nutritionist-Dietitians under the Philippine Regulatory Commission 
          in August 1998 (License No. 0009903) and the Licensure Examination for Teachers—Secondary 
          Level in August 2000 (License No. 663251).
        </Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-3 text-center">Career Experience</Text>
        <Text className="text-gray-300 text-sm leading-5">
          Over the course of her career, Ms. Gonzales has worked with renowned organizations 
          and companies, including Unilab, Nestle Philippines, Pascual Laboratory, Active One 
          Health Inc., American Express, Maxicare, and Medicard. She has served as a nutritionist, 
          wellness coach, and motivational speaker, helping individuals and communities improve 
          their health through proper nutrition, lifestyle education, and personal empowerment.
        </Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-xl">
        <Text className="text-white text-lg font-bold mb-3 text-center">Approach & Philosophy</Text>
        <Text className="text-gray-300 text-sm leading-5">
          Her dynamic and practical approach makes her a sought-after resource in both corporate 
          and community settings. With her combined expertise in education and nutrition, 
          Ms. Gonzales offers a unique and inspiring perspective that empowers people to make 
          healthier, more informed lifestyle choices.
        </Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-5 mb-10 shadow-xl">
        <Text className="text-white text-lg font-bold text-center mb-2 text-center">Special Thanks</Text>
        <Text className="text-gray-300 text-center text-sm leading-5">
          Special thanks to Ms. Christina A. Gonzales, LPT, RND for providing expert advice and ensuring 
          the accuracy of all nutrition content featured in SwiftPass. Your contribution has helped create 
          a more informed and health-conscious community.
        </Text>
      </View>
    </ScrollView>
  );
}