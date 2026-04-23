import { View, Text, ScrollView } from "react-native";

export default function FoodsTab({ specificFoods }) {
  const SpecificFoodItem = ({ food }) => {
    const categoryColors = {
      'Protein': 'bg-gray-500/20 border-gray-400',
      'Carb': 'bg-gray-500/20 border-gray-400',
      'Fruit': 'bg-gray-500/20 border-gray-400',
      'Vegetable': 'bg-gray-500/20 border-gray-400'
    };

    return (
      <View className={`${categoryColors[food.macro_type]} border rounded-lg p-4 mb-3`}>
        <View className="flex-row items-start">
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
    if (!acc[food.macro_type]) acc[food.macro_type] = [];
    acc[food.macro_type].push(food);
    return acc;
  }, {});

  return (
    <ScrollView
      className="px-4"
      contentContainerStyle={{ paddingBottom: 60 }} // <-- extra space at bottom
    >
      {specificFoods.length > 0 ? (
        <View className="bg-gray-800 rounded-2xl p-5 mt-6 shadow-xl">
          <Text className="text-white text-lg font-bold mb-4">Your Personalized Foods</Text>
          {Object.entries(groupedFoods).map(([macroType, foods]) => (
            <View key={macroType} className="mb-5">
              <Text className="text-gray-300 font-semibold text-base mb-2 border-b border-gray-600 pb-1">
                {macroType} ({foods.length} food{foods.length !== 1 ? 's' : ''})
              </Text>
              {foods.map((food, index) => (
                <SpecificFoodItem key={`${food.food_id}-${index}`} food={food} />
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View className="bg-gray-800 rounded-2xl p-6 mt-6 shadow-xl items-center">
          <Text className="text-white text-lg font-bold mb-4">Your Personalized Foods</Text>
          <Text className="text-6xl mb-3">🍽️</Text>
          <Text className="text-gray-400 text-center">
            No specific food selections found.{'\n'}
            Your macro targets are ready to guide your meal planning!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
