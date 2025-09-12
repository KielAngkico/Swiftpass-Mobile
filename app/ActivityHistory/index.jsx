import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NavigationBar from '../../components/NavigationBar';
import SimpleHeader from '../../components/SimpleHeader';
import API from '../../backend-api/services/api';

export default function ActivityHistoryScreen() {
  const router = useRouter();
  const { email = '', rfid_tag = '', system_type = '', admin_id = '' } = useLocalSearchParams();
  const [logs, setLogs] = useState([]);
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

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        if (!rfid_tag) throw new Error('RFID tag is required.');

        const res = await API.get(`/activity-history?rfid_tag=${rfid_tag}&system_type=${system_type}&admin_id=${admin_id}`);
        const activities = res.data.activities || [];
        const mapped = activities.map(item => ({
          ...item,
          label: item.label || `Visited ${item.gym_name} Gym`,
          timestamp: item.timestamp || item.entry_time,
        }));

        setLogs(groupByDate(mapped));
      } catch (err) {
        console.error('Activity Log Error:', err.message);
        Alert.alert('Error', err.message || 'Failed to load activity history.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [rfid_tag]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        
        <ActivityIndicator size="large" color="#5E17EB" />
        <Text className="mt-4 text-gray-600">Loading activity history...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SimpleHeader title="Activity History" />
<Text className="text-2xl font-bold text-black mx-4 mt-2 mb-1">Activity History</Text>
      <FlatList
        data={logs}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View>
            <Text className="text-gray-700 text-sm font-semibold mx-4 mt-4">{item.date}</Text>

            {item.entries.map((log, idx) => (
              <View key={idx} className="mx-4 my-2">
                <View className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-md">
                  {log.type === 'training' && (
                    <Text className="text-xs font-bold text-white bg-yellow-500 px-2 py-1 mb-2 w-fit rounded-full">
                      TRAINING
                    </Text>
                  )}
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <MaterialCommunityIcons name="door" size={20} color="white" />
                      <Text className="text-black text-base font-semibold">{log.label}</Text>
                    </View>
                    <Text className="text-black text-sm">{formatTime(log.timestamp)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-10">
            <Text className="text-gray-500 text-lg">No activity logs found.</Text>
          </View>
        }
      />

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-6">
        <NavigationBar
          email={email}
          rfid_tag={rfid_tag}
          system_type={system_type}
          admin_id={admin_id}
        />
      </View>
    </View>
  );
}
