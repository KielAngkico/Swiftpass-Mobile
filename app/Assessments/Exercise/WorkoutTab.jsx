import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { getFullPhotoUrl } from "../../../backend-api/services/Exercise_host";

// Utility functions
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDateLabel = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatDateKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayMidnight = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// NEW: Get the next split to do based on completed workouts this week
const getNextSplitForDate = (completedDays, availableSplits, currentDate, mondayDate) => {
  if (availableSplits.length === 0) return null;

  const currentDateKey = formatDateKey(currentDate);
  
  // If this date is already completed, return the completed split
  if (completedDays[currentDateKey]) {
    return completedDays[currentDateKey];
  }

  // Get all completed workouts for this week (Monday to current date)
  const completedThisWeek = [];
  const currentDay = new Date(currentDate);
  
  for (let checkDate = new Date(mondayDate); checkDate <= currentDay; checkDate.setDate(checkDate.getDate() + 1)) {
    const dateKey = formatDateKey(checkDate);
    if (completedDays[dateKey] && dateKey !== currentDateKey) {
      completedThisWeek.push(completedDays[dateKey]);
    }
  }

  // Find the next split that hasn't been completed this week
  for (const split of availableSplits) {
    if (!completedThisWeek.includes(split)) {
      return split;
    }
  }

  // If all splits are done, cycle back to the first one
  return availableSplits[0];
};

const getCurrentDayName = (date) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[date.getDay()] || '';
};

export default function WorkoutTab({
  currentDate,
  currentDayIndex,
  setCurrentDayIndex,
  selectedSplit,
  setSelectedSplit,
  workoutPlan,
  completedDays,
  availableSplits,
  dateKey,
  markWorkoutComplete,
  openExerciseModal,
  mondayDate
}) {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const displayedDate = formatDateLabel(currentDate);
  const hasCompletedWorkoutToday = Boolean(completedDays[dateKey]);

  // Calculate if all splits are done this week
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(mondayDate, i);
    weekDates.push(formatDateKey(day));
  }

  const completedSplitsThisWeek = weekDates
    .map((d) => completedDays[d])
    .filter(Boolean);

  const uniqueCompletedSplits = [...new Set(completedSplitsThisWeek)];
  const allSplitsDoneThisWeek = availableSplits.length > 0 && 
    uniqueCompletedSplits.length === availableSplits.length;

  // Auto-select split based on date and completion status
  useEffect(() => {
    if (availableSplits.length === 0) return;

    const nextSplit = getNextSplitForDate(completedDays, availableSplits, currentDate, mondayDate);
    if (nextSplit) {
      setSelectedSplit(nextSplit);
    }
  }, [dateKey, completedDays, availableSplits, currentDate, mondayDate]);

  const handleConfirmDate = (date) => {
    setDatePickerVisibility(false);
    const today = getTodayMidnight();
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((selected - today) / (1000 * 60 * 60 * 24));
    setCurrentDayIndex(diffDays);
  };

  const exercises = workoutPlan[selectedSplit] || [];

  return (
    <View className="px-6 pb-10">
      {/* Date Navigation */}
      <View className="bg-gray-800 rounded-2xl p-4 mt-6 mb-4 shadow-xl">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity 
            onPress={() => setCurrentDayIndex(currentDayIndex - 1)}
            className="bg-gray-700 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">← Prev</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setDatePickerVisibility(true)}
            className="bg-blue-600 px-6 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">{displayedDate}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setCurrentDayIndex(currentDayIndex + 1)}
            className="bg-gray-700 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Next →</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-3 pt-3 border-t border-gray-700">
          <Text className="text-gray-400 text-sm text-center">
            {getCurrentDayName(currentDate)}
          </Text>
          {selectedSplit && (
            <Text className="text-blue-400 text-sm text-center font-medium">
              {selectedSplit}
            </Text>
          )}
        </View>
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
        date={currentDate}
      />

      {/* Content based on conditions */}
      {allSplitsDoneThisWeek && !hasCompletedWorkoutToday ? (
        <View className="flex-1 justify-center items-center bg-gray-800 rounded-2xl p-8 mt-5">
          <Text className="text-white text-xl font-bold text-center mb-2">
            Week Complete!
          </Text>
          <Text className="text-gray-400 mb-4">
            You have completed your workout plan for the week!
          </Text>
          <Text className="text-white text-sm">
            You can navigate to previous days to view your completed workouts.
          </Text>
        </View>
      ) : !selectedSplit ? (
        <View className="flex-1 justify-center items-center bg-gray-800 rounded-2xl p-8 mt-20">
          <Text className="text-6xl mb-4">📅</Text>
          <Text className="text-white text-xl font-bold text-center mb-2">
            No Workout Scheduled
          </Text>
          <Text className="text-gray-400 text-center">
            This date is outside your workout schedule.
          </Text>
        </View>
      ) : (
        <>
          {/* Exercise List */}
          <View className="bg-gray-800 rounded-2xl p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-white text-lg font-bold">
                  {selectedSplit}
                </Text>
                <Text className="text-gray-400 text-sm">
                  {exercises.length} Exercises
                </Text>
              </View>
              {hasCompletedWorkoutToday && (
                <View className="bg-green-600 px-3 py-1 rounded">
                  <Text className="text-white text-xs font-bold">COMPLETED</Text>
                </View>
              )}
            </View>
            
            {exercises.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-6xl mb-3">💪</Text>
                <Text className="text-gray-400 text-center">
                  No exercises found for this split.
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-gray-300 text-sm mb-4">
                  Today's workout plan:
                </Text>
                {exercises.map((exercise, index) => {
                  const imageUrl = getFullPhotoUrl(exercise.image_url);
                  
                  return (
                    <TouchableOpacity
                      key={exercise.id}
                      onPress={() => openExerciseModal(exercise)}
                      className="bg-gray-700 rounded-xl p-4 mb-3 last:mb-0"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center">
                        {/* Exercise Image with Play Button Overlay */}
                        <View className="relative">
                          <Image
                            source={{ uri: imageUrl }}
                            style={{ 
                              width: 64, 
                              height: 64, 
                              borderRadius: 8,
                              backgroundColor: '#4B5563'
                            }}
                            resizeMode="cover"
                          />
                          {/* Play Button Overlay */}
                          <View 
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: 'rgba(0, 0, 0, 0.3)',
                              borderRadius: 8,
                            }}
                          >
                            <View className="bg-white/90 rounded-full w-8 h-8 items-center justify-center">
                              <MaterialCommunityIcons 
                                name="play" 
                                size={20} 
                                color="#3B82F6" 
                              />
                            </View>
                          </View>
                        </View>
                        
                        {/* Exercise Info */}
                        <View className="flex-1 ml-3">
                          <Text className="text-white text-lg font-semibold mb-1">
                            {index + 1}. {exercise.name}
                          </Text>
                          {exercise.muscle_group && (
                            <Text className="text-blue-400 text-sm capitalize">
                              {exercise.muscle_group}
                            </Text>
                          )}
                        </View>

                        {/* Completion Checkmark */}
                        <View className="ml-2">
                          <View className={`w-6 h-6 rounded-full border-2 ${
                            hasCompletedWorkoutToday 
                              ? 'bg-green-500 border-green-500' 
                              : 'bg-gray-600 border-gray-500'
                          }`}>
                            {hasCompletedWorkoutToday && (
                              <Text className="text-white text-center text-sm">✓</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>

          {/* Complete Workout Button */}
          {exercises.length > 0 && (
            <TouchableOpacity
              onPress={markWorkoutComplete}
              className={`py-4 rounded-2xl items-center mt-6 mb-3 border-2 shadow-xl ${
                hasCompletedWorkoutToday
                  ? "bg-green-600 border-green-700"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500"
              }`}
              disabled={hasCompletedWorkoutToday}
            >
              <Text className="text-white font-bold text-lg">
                {hasCompletedWorkoutToday ? "WORKOUT COMPLETED ✓" : "MARK WORKOUT AS COMPLETE"}
              </Text>
              {!hasCompletedWorkoutToday && (
                <Text className="text-blue-100 text-sm mt-1">
                  Tap when you finish all exercises
                </Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}