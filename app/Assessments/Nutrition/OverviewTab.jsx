import { View, Text } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

export default function OverviewTab({ result, specificFoods }) {
  const { protein_grams, carbs_grams, fats_grams, calories_target } = result;
  
  const totalMacros = (protein_grams || 0) + (carbs_grams || 0) + (fats_grams || 0);
  const proteinPercent = ((protein_grams || 0) / totalMacros) * 100;
  const carbsPercent = ((carbs_grams || 0) / totalMacros) * 100;
  const fatsPercent = ((fats_grams || 0) / totalMacros) * 100;

  const MacroCard = ({ title, grams, percentage, color, bgColor, icon }) => (
    <View className={`${bgColor} rounded-xl p-4 flex-1 mx-1 shadow-lg`}>
      <View className="flex-row items-center mb-2">
        <Text className="text-2xl mr-2">{icon}</Text>
        <Text className={`${color} font-semibold text-xs`}>{title}</Text>
      </View>
      <Text className="text-white text-2xl font-bold">{grams}g</Text>
      <Text className="text-gray-300 text-xs">{percentage.toFixed(1)}%</Text>
    </View>
  );

  const totals = specificFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + Number(food.calories ?? 0),
      protein: acc.protein + Number(food.protein ?? 0),
      carbs: acc.carbs + Number(food.carbs ?? 0),
      fats: acc.fats + Number(food.fats ?? 0),
      weight: acc.weight + Number(food.portion_grams ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, weight: 0 }
  );

  return (
    <View className="px-6">
      <View className="bg-gradient-to-r from-blue-600 to-blue-600 rounded-2xl p-6 mt-6 shadow-xl bg-gray-800">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-blue-100 text-sm font-medium mb-1">Daily Target</Text>
            <Text className="text-white text-3xl font-bold">{calories_target}</Text>
            <Text className="text-blue-100 text-sm">calories</Text>
          </View>
          <Text className="text-6xl opacity-20">🎯</Text>
        </View>
      </View>

      <View className="flex-row mt-6 mb-2">
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

      {specificFoods.length > 0 && (
        <View className="bg-gradient-to-r from-blue-600 to-blue-600 rounded-2xl p-6 mt-4 mb-4 shadow-xl bg-gray-800">
          <Text className="text-white text-lg font-bold mb-3 text-center ">Total Daily Nutrition</Text>
          <View>
            <View className="flex-row justify-between mb-3">
              <View className="items-center flex-1">
                <Text className="text-white text-xl font-bold">{Math.round(totals.calories)}</Text>
                <Text className="text-blue-100 text-sm">Calories</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-white text-xl font-bold">{totals.weight.toFixed(0)}g</Text>
                <Text className="text-blue-100 text-sm">Total Food</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-red-300 text-lg font-bold">{totals.protein.toFixed(1)}g</Text>
                <Text className="text-blue-100 text-xs">Protein</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-blue-300 text-lg font-bold">{totals.carbs.toFixed(1)}g</Text>
                <Text className="text-blue-100 text-xs">Carbs</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-yellow-300 text-lg font-bold">{totals.fats.toFixed(1)}g</Text>
                <Text className="text-blue-100 text-xs">Fats</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className="bg-gray-800 rounded-2xl p-4 shadow-xl mb-20">
        <Text className="text-white text-lg font-bold mb-4 text-center">Macro Distribution</Text>
        <View className="items-center mb-4">
          <Svg width={140} height={140} viewBox="0 0 140 140">
            <G rotation="-90" origin="70,70">
              <Circle 
                cx="70" 
                cy="70" 
                r={50} 
                stroke="#374151" 
                strokeWidth={20} 
                fill="none" 
              />
              <Circle 
                cx="70" 
                cy="70" 
                r={50} 
                stroke="#EF4444" 
                strokeWidth={20} 
                fill="none"
                strokeDasharray={`${(proteinPercent / 100) * (2 * Math.PI * 50)} ${2 * Math.PI * 50}`} 
                strokeDashoffset={0}
                strokeLinecap="round"
              />
              <Circle 
                cx="70" 
                cy="70" 
                r={50} 
                stroke="#3B82F6" 
                strokeWidth={20} 
                fill="none"
                strokeDasharray={`${(carbsPercent / 100) * (2 * Math.PI * 50)} ${2 * Math.PI * 50}`} 
                strokeDashoffset={-((proteinPercent / 100) * (2 * Math.PI * 50))}
                strokeLinecap="round"
              />
              <Circle 
                cx="70" 
                cy="70" 
                r={50} 
                stroke="#EAB308" 
                strokeWidth={20} 
                fill="none"
                strokeDasharray={`${(fatsPercent / 100) * (2 * Math.PI * 50)} ${2 * Math.PI * 50}`} 
                strokeDashoffset={-(((proteinPercent + carbsPercent) / 100) * (2 * Math.PI * 50))}
                strokeLinecap="round"
              />
            </G>
            <SvgText x="70" y="65" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
              Total
            </SvgText>
            <SvgText x="70" y="78" textAnchor="middle" fill="#9CA3AF" fontSize="10">
              {totalMacros}g
            </SvgText>
          </Svg>
        </View>
        <View className="flex-row justify-around">
          <View className="items-center">
            <View className="w-3 h-3 bg-red-500 rounded-full mb-1" />
            <Text className="text-red-400 font-medium text-xs">Protein</Text>
            <Text className="text-gray-400 text-xs">{proteinPercent.toFixed(1)}%</Text>
          </View>
          <View className="items-center">
            <View className="w-3 h-3 bg-blue-500 rounded-full mb-1" />
            <Text className="text-blue-400 font-medium text-xs">Carbs</Text>
            <Text className="text-gray-400 text-xs">{carbsPercent.toFixed(1)}%</Text>
          </View>
          <View className="items-center">
            <View className="w-3 h-3 bg-yellow-500 rounded-full mb-1" />
            <Text className="text-yellow-400 font-medium text-xs">Fats</Text>
            <Text className="text-gray-400 text-xs">{fatsPercent.toFixed(1)}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}