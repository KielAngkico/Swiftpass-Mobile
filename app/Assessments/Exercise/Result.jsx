import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from '../../../backend-api/services/api';
import ExerciseCard from './ExerciseCard';
import SimpleHeader from '../../../components/SimpleHeader';
import OverviewTab from './OverviewTab';
import WorkoutTab from './WorkoutTab';
import Learn from './Learn';
import TrainerTab from './TrainerTab';

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

export default function ExerciseResult() {
  // State
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [rfidTag, setRfidTag] = useState(null);
  const [availableSplits, setAvailableSplits] = useState([]);
  const [completedDays, setCompletedDays] = useState({});
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const params = useLocalSearchParams();

  // Computed values
  const currentDate = addDays(getTodayMidnight(), currentDayIndex);
  const dateKey = formatDateKey(currentDate);
  const mondayDate = getMonday(currentDate);

  // Modal handlers
  const openExerciseModal = (exercise) => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  const closeExerciseModal = () => {
    setSelectedExercise(null);
    setModalVisible(false);
  };

  // Load RFID tag
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

  // Fetch completed days from DB
  const fetchCompletedDaysFromDB = async (rfid) => {
    try {
      const res = await API.get(`/exercise-completed-days/${rfid}`);
      if (res.status === 200) {
        const completedData = res.data;
        setCompletedDays(completedData);
        await AsyncStorage.setItem("completedDays", JSON.stringify(completedData));
      }
    } catch (error) {
      console.warn("Failed to fetch completed days from DB", error);
    }
  };

  // Fetch workout plan
  useEffect(() => {
    if (!rfidTag) return;

    const fetchWorkoutPlanAndCompletedDays = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/results-routes/${rfidTag}`);
        const data = res.data;
       console.log("🔍 Full API response:", JSON.stringify(data, null, 2));
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

  // Mark workout complete
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

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <View className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-white mt-4 text-center font-medium">Loading your workout plan...</Text>
        </View>
      </View>
    );
  }


  return (
    <ScrollView className="bg-gray-900 flex-1">
      <SimpleHeader title="Workout Plan" />
      
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-12 pb-6 px-6 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold mb-2">Your Workout Plan</Text>
        <Text className="text-blue-100 text-sm opacity-80">Split-based training schedule</Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row mx-6 mt-4 bg-gray-800 rounded-xl p-1">
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'overview' ? 'bg-blue-500' : ''}`}
          onPress={() => setActiveTab('overview')}
        >
          <Text className={`text-center font-medium ${activeTab === 'overview' ? 'text-white' : 'text-gray-400'}`}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'workout' ? 'bg-blue-500' : ''}`}
          onPress={() => setActiveTab('workout')}
        >
          <Text className={`text-center font-medium ${activeTab === 'workout' ? 'text-white' : 'text-gray-400'}`}>
            Workout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'logs' ? 'bg-blue-500' : ''}`}
          onPress={() => setActiveTab('logs')}
        >
          <Text className={`text-center font-medium ${activeTab === 'logs' ? 'text-white' : 'text-gray-400'}`}>
            Learn
          </Text>
        </TouchableOpacity>
                <TouchableOpacity 
          className={`flex-1 py-3 rounded-lg ${activeTab === 'trainer' ? 'bg-blue-500' : ''}`}
          onPress={() => setActiveTab('trainer')}
        >
          <Text className={`text-center font-medium ${activeTab === 'trainer' ? 'text-white' : 'text-gray-400'}`}>
            Trainer
          </Text>
        </TouchableOpacity>
        
      </View>
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          availableSplits={availableSplits}
          workoutPlan={workoutPlan}
          completedDays={completedDays}
          mondayDate={mondayDate}
        />
      )}

      {activeTab === 'workout' && (
        <WorkoutTab
          currentDate={currentDate}
          currentDayIndex={currentDayIndex}
          setCurrentDayIndex={setCurrentDayIndex}
          selectedSplit={selectedSplit}
          setSelectedSplit={setSelectedSplit}
          workoutPlan={workoutPlan}
          completedDays={completedDays}
          availableSplits={availableSplits}
          dateKey={dateKey}
          markWorkoutComplete={markWorkoutComplete}
          openExerciseModal={openExerciseModal}
          mondayDate={mondayDate}
        />
      )}

      {activeTab === 'logs' && (
        <Learn
          completedDays={completedDays}
          workoutPlan={workoutPlan}
          availableSplits={availableSplits}
          mondayDate={mondayDate}
          onNavigateToCoach={() => setActiveTab('trainer')}
        />
      )}
      {activeTab === "trainer" && <TrainerTab />}

      {/* Exercise Modal */}
      <ExerciseCard
        visible={modalVisible}
        exercise={selectedExercise}
        onClose={closeExerciseModal}
      />
    </ScrollView>
  );
}