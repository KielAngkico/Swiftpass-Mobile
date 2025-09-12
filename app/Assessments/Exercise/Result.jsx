import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import API from '../../../backend-api/services/api';
import ExerciseCard from './ExerciseCard';

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


const getSplitDayIndex = (date, mondayDate) => {
  const diffTime = date - mondayDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getSplitForDay = (splitDayIndex, availableSplits) => {
  if (splitDayIndex < 0 || splitDayIndex >= availableSplits.length) {
    return null;
  }
  return availableSplits[splitDayIndex];
};

const getNextAvailableSplitDay = (currentDate, mondayDate, completedDays, availableSplits) => {
  const weekDates = [];
  for (let i = 0; i < availableSplits.length; i++) {
    const day = addDays(mondayDate, i);
    if (day <= currentDate) {
      weekDates.push({
        date: day,
        dateKey: formatDateKey(day),
        splitIndex: i,
        split: availableSplits[i]
      });
    }
  }
 
  for (const dayInfo of weekDates) {
    if (!completedDays[dayInfo.dateKey]) {
      return dayInfo;
    }
  }
  
  return null;
};

export default function ExerciseResult() {
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [rfidTag, setRfidTag] = useState(null);
  const [availableSplits, setAvailableSplits] = useState([]);
  const [completedDays, setCompletedDays] = useState({});
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const router = useRouter();
  const params = useLocalSearchParams();

  const currentDate = addDays(getTodayMidnight(), currentDayIndex);
  const dateKey = formatDateKey(currentDate);
  const displayedDate = formatDateLabel(currentDate);
  const mondayDate = getMonday(currentDate);

  const openExerciseModal = (exercise) => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  const closeExerciseModal = () => {
    setSelectedExercise(null);
    setModalVisible(false);
  };

  useEffect(() => {
    if (params?.rfid) {
      setRfidTag(params.rfid);
    } else {
      (async () => {
        try {
          const tag = await AsyncStorage.getItem("rfid_tag");
          if (tag) setRfidTag(tag);
        } catch (e) {
          console.warn("Failed to load RFID tag from AsyncStorage", e);
        }
      })();
    }
  }, [params]);

  const fetchCompletedDaysFromDB = async (rfid) => {
    try {
      const res = await API.get(`/exercise-completed-days/${rfid}`);
      if (res.status === 200) {
        const completedData = res.data;
        console.log("📊 Completed days data received:", completedData);
        
        setCompletedDays(completedData);
        await AsyncStorage.setItem("completedDays", JSON.stringify(completedData));
      }
    } catch (error) {
      console.warn("Failed to fetch completed days from DB", error);
    }
  };

  useEffect(() => {
    if (!rfidTag) return;

    const fetchWorkoutPlanAndCompletedDays = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/results-routes/${rfidTag}`);
        const data = res.data;

        setWorkoutPlan(data.workoutPlan || {});
        const splits = Object.keys(data.workoutPlan || {});
        setAvailableSplits(splits);

        await fetchCompletedDaysFromDB(rfidTag);
      } catch (err) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutPlanAndCompletedDays();
  }, [rfidTag]);

  useEffect(() => {
    if (availableSplits.length === 0) return;

    const splitDayIndex = getSplitDayIndex(currentDate, mondayDate);
    const scheduledSplit = getSplitForDay(splitDayIndex, availableSplits);
    
    console.log(`📅 Date: ${dateKey}, Split Day Index: ${splitDayIndex}, Scheduled Split: ${scheduledSplit}`);

    if (completedDays[dateKey]) {
      setSelectedSplit(completedDays[dateKey]);
      return;
    }

    if (splitDayIndex >= availableSplits.length) {
      setSelectedSplit(null);
      return;
    }

    if (currentDate <= getTodayMidnight()) {
      const nextAvailableDay = getNextAvailableSplitDay(currentDate, mondayDate, completedDays, availableSplits);
      
      if (nextAvailableDay && formatDateKey(nextAvailableDay.date) === dateKey) {
        setSelectedSplit(nextAvailableDay.split);
      } else if (scheduledSplit) {
 
        setSelectedSplit(scheduledSplit);
      } else {
        setSelectedSplit(null);
      }
    } else {

      setSelectedSplit(scheduledSplit);
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

  const markWorkoutComplete = async () => {
    if (!selectedSplit) return;

    try {

      await API.post("/exercise-day-complete", {
        rfid_tag: rfidTag,
        split_name: selectedSplit,
        completion_date: dateKey,
      });

      setCompletedDays(prev => ({
        ...prev,
        [dateKey]: selectedSplit
      }));

      await AsyncStorage.setItem("completedDays", JSON.stringify({
        ...completedDays,
        [dateKey]: selectedSplit
      }));

      Alert.alert(
        "Workout Complete!",
        "Great job completing today's workout! 💪"
      );
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to mark workout as complete");
    }
  };

  const splitDayIndex = getSplitDayIndex(currentDate, mondayDate);
  const weekDates = [];
  for (let i = 0; i < availableSplits.length; i++) {
    const day = addDays(mondayDate, i);
    weekDates.push(formatDateKey(day));
  }

  const completedSplitsThisWeek = weekDates
    .map((d) => completedDays[d])
    .filter(Boolean);

  const allSplitsDoneThisWeek = availableSplits.length > 0 && completedSplitsThisWeek.length === availableSplits.length;
  const isCurrentDateBeyondWorkoutDays = splitDayIndex >= availableSplits.length;
  const showWeekCompleteMessage = allSplitsDoneThisWeek || isCurrentDateBeyondWorkoutDays;
  

  const hasCompletedWorkoutToday = Boolean(completedDays[dateKey]);

  const getCurrentDayName = () => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return dayNames[splitDayIndex] || '';
  };

  const exercises = workoutPlan[selectedSplit] || [];

  const totalExercises = Object.values(workoutPlan).reduce((acc, exercises) => acc + exercises.length, 0);
  const completedWorkouts = Object.keys(completedDays).length;
  const currentWeekWorkouts = completedSplitsThisWeek.length;

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <View className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-white mt-4 text-center font-medium">Loading your workout plan...</Text>
        </View>
      </View>
    );
  }

  if (availableSplits.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <View className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <Text className="text-white text-xl font-bold mb-2">No Workout Plan Found</Text>
          <Text className="text-gray-400 mb-4">Start from Assessment to get your personalized plan.</Text>
          <TouchableOpacity
            onPress={() => router.push("/Assessments/Exercise")}
            className="bg-purple-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-bold">Go to Assessment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="bg-gray-900 flex-1">

      <View className="bg-gradient-to-r from-purple-600 to-indigo-600 pt-12 pb-6 px-6 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold mb-2">Your Workout Plan</Text>
        <Text className="text-purple-100 text-sm opacity-80">Split-based training schedule</Text>
      </View>
      <View className="flex-row mx-6 mt-4 bg-gray-800 rounded-xl p-1">
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'overview' ? 'bg-purple-600' : ''}`}
          onPress={() => setActiveTab('overview')}
        >
          <Text className={`text-center font-medium ${activeTab === 'overview' ? 'text-white' : 'text-gray-400'}`}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'workout' ? 'bg-purple-600' : ''}`}
          onPress={() => setActiveTab('workout')}
        >
          <Text className={`text-center font-medium ${activeTab === 'workout' ? 'text-white' : 'text-gray-400'}`}>
            Workout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'logs' ? 'bg-purple-600' : ''}`}
          onPress={() => setActiveTab('logs')}
        >
          <Text className={`text-center font-medium ${activeTab === 'logs' ? 'text-white' : 'text-gray-400'}`}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' ? (
        <View className="px-6">
          <View className="flex-row mt-6 mb-6">
            <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 flex-1 mx-1 shadow-lg">
              <View className="flex-row items-center mb-2">
                <Text className="text-2xl mr-2">💪</Text>
                <Text className="text-blue-100 font-semibold text-sm">Total Splits</Text>
              </View>
              <Text className="text-white text-2xl font-bold">{availableSplits.length}</Text>
              <Text className="text-blue-100 text-sm">workout days</Text>
            </View>
            
            <View className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 flex-1 mx-1 shadow-lg">
              <View className="flex-row items-center mb-2">
                <Text className="text-2xl mr-2">🎯</Text>
                <Text className="text-green-100 font-semibold text-sm">Exercises</Text>
              </View>
              <Text className="text-white text-2xl font-bold">{totalExercises}</Text>
              <Text className="text-green-100 text-sm">total moves</Text>
            </View>
            
            <View className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 flex-1 mx-1 shadow-lg">
              <View className="flex-row items-center mb-2">
                <Text className="text-2xl mr-2">🔥</Text>
                <Text className="text-orange-100 font-semibold text-sm">This Week</Text>
              </View>
              <Text className="text-white text-2xl font-bold">{currentWeekWorkouts}</Text>
              <Text className="text-orange-100 text-sm">completed</Text>
            </View>
          </View>

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
                          <View className="bg-purple-600 px-2 py-1 rounded">
                            <Text className="text-white text-xs font-bold">TODAY</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-purple-400 text-sm font-medium">{split}</Text>
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

          <View className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl mb-6">
            <Text className="text-white text-lg font-bold mb-3">📊 Weekly Progress</Text>
            <View className="flex-row justify-between mb-4">
              <Text className="text-purple-100 text-sm">
                Completed: {currentWeekWorkouts} / {availableSplits.length}
              </Text>
              <Text className="text-purple-100 text-sm">
                {Math.round((currentWeekWorkouts / availableSplits.length) * 100)}%
              </Text>
            </View>
            <View className="bg-white/20 rounded-full h-2 mb-3">
              <View 
                className="bg-white rounded-full h-2" 
                style={{ width: `${(currentWeekWorkouts / availableSplits.length) * 100}%` }} 
              />
            </View>
            <Text className="text-purple-100 text-sm leading-5">
              {allSplitsDoneThisWeek ? 
                "🎉 Amazing! You've completed all workouts this week!" :
                "Keep it up! Stay consistent with your split schedule."
              }
            </Text>
          </View>
        </View>
      ) : activeTab === 'workout' ? (
        <View className="px-6">
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
                className="bg-purple-600 px-6 py-2 rounded-lg"
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

            {splitDayIndex >= 0 && splitDayIndex < availableSplits.length && (
              <View className="mt-3 pt-3 border-t border-gray-700">
                <Text className="text-gray-400 text-sm text-center">
                  Day {splitDayIndex + 1} of {availableSplits.length} • {getCurrentDayName()}
                </Text>
                {selectedSplit && (
                  <Text className="text-purple-400 text-sm text-center font-medium">
                    {selectedSplit}
                  </Text>
                )}
              </View>
            )}
          </View>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={() => setDatePickerVisibility(false)}
            date={currentDate}
          />

          {showWeekCompleteMessage && !hasCompletedWorkoutToday ? (
            <View className="flex-1 justify-center items-center bg-gray-800 rounded-2xl p-8 mt-20">
              <Text className="text-6xl mb-4">🎉</Text>
              <Text className="text-white text-xl font-bold text-center mb-2">
                {allSplitsDoneThisWeek ? "Week Complete!" : "All Workouts Done!"}
              </Text>
              <Text className="text-gray-400 text-center mb-4">
                {allSplitsDoneThisWeek 
                  ? "You have completed your workout plan for the week!"
                  : "You have completed all scheduled workouts. Great job!"
                }
              </Text>
              <Text className="text-purple-400 text-center text-sm">
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

              <View className="bg-gray-800 rounded-2xl p-6 shadow-xl">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-white text-lg font-bold">
                      {selectedSplit}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      Day {splitDayIndex + 1} • {exercises.length} Exercises
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
                    {exercises.map((exercise, index) => (
                      <View
                        key={exercise.id}
                        className="bg-gray-700 rounded-xl p-4 mb-3 last:mb-0"
                      >
                        <View className="flex-row items-center justify-between">
                          <TouchableOpacity 
                            onPress={() => openExerciseModal(exercise)}
                            className="flex-1"
                          >
                            <Text className="text-white text-lg font-semibold mb-2">
                              {index + 1}. {exercise.name}
                            </Text>
                            {exercise.muscle_group && (
                              <Text className="text-purple-400 text-sm capitalize">
                                {exercise.muscle_group}
                              </Text>
                            )}
                          </TouchableOpacity>
                          <View className="ml-4">
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
                      </View>
                    ))}
                  </>
                )}
              </View>

              {exercises.length > 0 && (
                <TouchableOpacity
                  onPress={markWorkoutComplete}
                  className={`py-4 rounded-2xl items-center mt-6 mb-6 shadow-xl ${
                    hasCompletedWorkoutToday 
                      ? "bg-green-600" 
                      : "bg-gradient-to-r from-purple-600 to-indigo-600"
                  }`}
                  disabled={hasCompletedWorkoutToday}
                >
                  <Text className="text-white font-bold text-lg">
                    {hasCompletedWorkoutToday ? "WORKOUT COMPLETED ✓" : "MARK WORKOUT AS COMPLETE"}
                  </Text>
                  {!hasCompletedWorkoutToday && (
                    <Text className="text-purple-100 text-sm mt-1">
                      Tap when you finish all exercises
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ) : (
        <View className="px-6">

          <View className="bg-gray-800 rounded-2xl p-6 mt-6 shadow-xl">
            <Text className="text-white text-lg font-bold mb-4">Workout History</Text>
            
            {Object.keys(completedDays).length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-6xl mb-3">📈</Text>
                <Text className="text-gray-400 text-center">
                  No completed workouts yet.{'\n'}Start completing your daily workouts to track your progress!
                </Text>
              </View>
            ) : (
              <View>
                {Object.entries(completedDays)
                  .sort(([a], [b]) => new Date(b) - new Date(a))
                  .map(([date, split]) => (
                    <View key={date} className="bg-gray-700 rounded-lg p-4 mb-3 last:mb-0">
                      <View className="flex-row justify-between items-center">
                        <View>
                          <Text className="text-white font-semibold">
                            {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                          <Text className="text-purple-400 font-medium">{split}</Text>
                          <Text className="text-gray-400 text-sm">
                            {workoutPlan[split]?.length || 0} exercises completed
                          </Text>
                        </View>
                        <View className="w-3 h-3 bg-green-500 rounded-full" />
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>

        </View>
      )}


      <ExerciseCard
        visible={modalVisible}
        exercise={selectedExercise}
        onClose={closeExerciseModal}
      />
    </ScrollView>
  );
} 