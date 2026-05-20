import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NavigationBar from '../../components/NavigationBar';
import SimpleHeader from '../../components/SimpleHeader';
import API from '../../backend-api/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ActivityHistoryScreen() {
  const router = useRouter();
const { email = '', member_id = '', rfid_tag = '', system_type = '', admin_id = '' } = useLocalSearchParams();  const [logs, setLogs] = useState([]);
const [selectedDate, setSelectedDate] = useState(null);
const [showDatePicker, setShowDatePicker] = useState(false);
const [allLogs, setAllLogs] = useState([]);
const [loading, setLoading] = useState(true);

  const groupByDate = (activities) => {
    const grouped = {};
    activities.forEach((item) => {
      const key = new Date(item.timestamp).toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return Object.entries(grouped).map(([date, entries]) => ({ date, entries }));
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const fetchLogs = async () => {
try {
        const resolvedMemberId = member_id || await AsyncStorage.getItem('member_id');
        if (!resolvedMemberId) throw new Error('Member ID is required.');
        const res = await API.get(
          `/transactions/activity-history?member_id=${resolvedMemberId}&system_type=${system_type}&admin_id=${admin_id}`
        );
        const activities = res.data.activities || [];
        console.log('RAW activities:', JSON.stringify(activities));
const mapped = activities.map((item) => ({
          ...item,
          label: item.label || `Visited ${item.gym_name} Gym`,
          timestamp: item.timestamp || item.entry_time,
          exit_time: item.exit_time,
        }));
        setAllLogs(mapped);
setLogs(groupByDate(mapped));
      } catch (err) {
        console.error('Activity Log Error:', err.message);
        Alert.alert('Error', err.message || 'Failed to load activity history.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [member_id]);

useEffect(() => {
  let filtered = [...allLogs];

  if (selectedDate) {
    filtered = filtered.filter(l =>
      new Date(l.timestamp).toDateString() === selectedDate.toDateString()
    );
  }

  setLogs(groupByDate(filtered));
}, [selectedDate, allLogs]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-400">Loading activity history...</Text>
      </View>
    );
  }
  return (
    <View className="flex-1 bg-gray-900">
      <SimpleHeader title="Activity History" />
<View className="px-4 pt-3 pb-2 bg-gray-900">
<TouchableOpacity
    onPress={() => setShowDatePicker(!showDatePicker)}
    className="bg-gray-800 rounded-xl px-4 py-3 mb-3 border border-gray-700 flex-row justify-between items-center"
  >
    <Text className={selectedDate ? 'text-white' : 'text-gray-500'}>
      {selectedDate
        ? selectedDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        : 'Filter by date...'}
    </Text>
    {selectedDate && (
      <TouchableOpacity onPress={() => setSelectedDate(null)}>
        <Text className="text-red-400 text-sm">Clear</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>

<Modal
  visible={showDatePicker}
  transparent
  animationType="fade"
  onRequestClose={() => setShowDatePicker(false)}
>
  <View className="flex-1 bg-black/30 justify-center items-center px-6">
    
    <View className="bg-gray-800 rounded-3xl p-4 border border-gray-700 w-full">

      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-lg font-bold">
          Select Date
        </Text>

        <Text
          onPress={() => setShowDatePicker(false)}
          className="text-red-400 font-semibold"
        >
          Close
        </Text>
      </View>

      {/* Calendar */}
      <Calendar
        theme={{
          backgroundColor: '#1f2937',
          calendarBackground: '#1f2937',

          textSectionTitleColor: '#9ca3af',
          monthTextColor: '#ffffff',
          dayTextColor: '#ffffff',
          todayTextColor: '#3b82f6',

          selectedDayBackgroundColor: '#2563eb',
          selectedDayTextColor: '#ffffff',

          arrowColor: '#3b82f6',
          textDisabledColor: '#4b5563',
        }}
        markedDates={
          selectedDate
            ? {
                [selectedDate.toISOString().split('T')[0]]: {
                  selected: true,
                },
              }
            : {}
        }
        onDayPress={(day) => {
          setSelectedDate(new Date(day.timestamp));
          setShowDatePicker(false);
        }}
      />
    </View>
  </View>
</Modal>
</View>
      <FlatList
        data={logs}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className="px-5 py-3">
            <Text className="text-gray-300 text-sm font-semibold mb-2">{item.date}</Text>

            {item.entries.map((log, idx) => (
              <View key={idx} className="mb-3">
                <View className="bg-gray-800 border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
                  {log.type === 'training' && (
                    <Text className="text-[11px] font-bold text-white bg-yellow-500 px-2 py-0.5 mb-2 w-fit rounded-full">
                      TRAINING
                    </Text>
                  )}
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center space-x-2">
                      <MaterialCommunityIcons name="door" size={20} color="#D1D5DB" />
                      <Text className="text-white text-base font-semibold">{log.label}</Text>
                    </View>
                  </View>
                  
                  {/* Entry and Exit Times */}
                  <View className="flex-row justify-between items-center mt-2">
                    <View className="flex-row items-center space-x-2">
                      <MaterialCommunityIcons name="login" size={16} color="#10B981" />
                      <Text className="text-gray-400 text-sm">Entry: {formatTime(log.timestamp)}</Text>
                    </View>
                    {log.exit_time ? (
                      <View className="flex-row items-center space-x-2">
                        <MaterialCommunityIcons name="logout" size={16} color="#EF4444" />
                        <Text className="text-gray-400 text-sm">Exit: {formatTime(log.exit_time)}</Text>
                      </View>
                    ) : (
                      <Text className="text-yellow-500 text-sm">Still inside</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-gray-400 text-lg">No activity logs found.</Text>
          </View>
        }
      />

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
<NavigationBar
          email={email}
          member_id={member_id}
          rfid_tag={rfid_tag}
          system_type={system_type}
          admin_id={admin_id}
        />
      </View>
    </View>
  );
}