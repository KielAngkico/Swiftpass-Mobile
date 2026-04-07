import React from "react";
import { View, Text } from "react-native";

// Utility functions
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDateKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const getTodayMidnight = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

export default function OverviewTab({ 
  availableSplits, 
  workoutPlan, 
  completedDays, 
  mondayDate 
}) {
  // Calculate stats
  const totalExercises = Object.values(workoutPlan).reduce(
    (acc, exercises) => acc + exercises.length, 
    0
  );

  // Calculate completed workouts this week
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(mondayDate, i);
    weekDates.push(formatDateKey(day));
  }

  const completedSplitsThisWeek = weekDates
    .map((d) => completedDays[d])
    .filter(Boolean);

  const currentWeekWorkouts = completedSplitsThisWeek.length;
  const uniqueCompletedSplits = [...new Set(completedSplitsThisWeek)];
  const allSplitsDoneThisWeek = availableSplits.length > 0 && 
    uniqueCompletedSplits.length === availableSplits.length;

  const progressPercentage = availableSplits.length > 0 
    ? Math.round((currentWeekWorkouts / availableSplits.length) * 100)
    : 0;

  return (
    <View className="px-6">
      {/* Stats Cards */}


      {/* Weekly Progress Card */}
      <View className="bg-gradient-to-r from-blue-600 to-blue-600 rounded-2xl p-6 shadow-xl mb-6 mt-6 bg-gray-800">
        <Text className="text-white text-lg font-bold mb-3 text-center">Weekly Progress</Text>
        <View className="flex-row justify-between mb-4">
          <Text className="text-blue-100 text-sm">
            Completed: {currentWeekWorkouts} / {availableSplits.length}
          </Text>
          <Text className="text-blue-100 text-sm">
            {progressPercentage}%
          </Text>
        </View>
        <View className="bg-white/20 rounded-full h-2 mb-3">
          <View 
            className="bg-white rounded-full h-2" 
            style={{ width: `${progressPercentage}%` }} 
          />
        </View>
        <Text className="text-blue-100 text-sm leading-5">
          {allSplitsDoneThisWeek ? 
            "🎉 Amazing! You've completed all workouts this week!" :
            "Keep it up! Stay consistent with your split schedule."
          }
        </Text>
      </View>

      {/* Weekly Schedule */}
      <View className="bg-gray-800 rounded-2xl p-6 shadow-xl mb-6">
        <Text className="text-white text-lg font-bold mb-4">Weekly Schedule</Text>
        {availableSplits.map((split, index) => {
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const dayDate = addDays(mondayDate, index);
          const dayDateKey = formatDateKey(dayDate);
          const isCompleted = Boolean(completedDays[dayDateKey]); 
          const isToday = formatDateKey(getTodayMidnight()) === dayDateKey;
          
          return (
            <View key={split} className="bg-gray-700 rounded-lg p-4 mb-3 last:mb-0">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white font-semibold text-base mr-2">
                      Day {index + 1} - {dayNames[index]}
                    </Text>
                    {isToday && (
                      <View className="bg-blue-500 px-2 py-1 rounded">
                        <Text className="text-white text-xs font-bold">TODAY</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-blue-400 text-sm font-medium">{split}</Text>
                  <Text className="text-gray-400 text-sm">
                    {workoutPlan[split]?.length || 0} exercises • {formatDateLabel(dayDate)}
                  </Text>
                </View>
                <View className="items-center">
                  <View className={`w-3 h-3 rounded-full ${
                    isCompleted ? 'bg-green-500' : isToday ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <Text className="text-gray-400 text-xs mt-1">
                    {isCompleted ? 'Done' : isToday ? 'Today' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}