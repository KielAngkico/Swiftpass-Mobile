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

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        if (!rfid_tag) throw new Error('RFID tag is required.');
        const res = await API.get(
          `/activity-history?rfid_tag=${rfid_tag}&system_type=${system_type}&admin_id=${admin_id}`
        );
        const activities = res.data.activities || [];
        const mapped = activities.map((item) => ({
          ...item,
          label: item.label || `Visited ${item.gym_name} Gym`,
          timestamp: item.timestamp || item.entry_time,
          exit_time: item.exit_time,
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
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-400">Loading activity history...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <SimpleHeader title="Activity History" />

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
          rfid_tag={rfid_tag}
          system_type={system_type}
          admin_id={admin_id}
        />
      </View>
    </View>
  );
}