import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NavigationBar from '../../components/NavigationBar';
import SimpleHeader from '../../components/SimpleHeader';
import API from '../../backend-api/services/api';

export default function TransactionsScreen() {
  const router = useRouter();
  const { email = '', admin_id = '', rfid_tag = '', system_type = '' } = useLocalSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const groupByDate = (items) => {
    const grouped = {};
    items.forEach((item) => {
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

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (!rfid_tag) throw new Error('RFID tag is missing.');
        const res = await API.get(`/transactions/activity-log?rfid_tag=${rfid_tag}&system_type=${system_type}`);
        const items = res.data.transactions || [];
        setTransactions(groupByDate(items));
      } catch (err) {
        console.error('Transaction Fetch Error:', err.message);
        Alert.alert('Error', err.message || 'Failed to load transactions.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [rfid_tag, system_type]);

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderItem = ({ item }) => (
    <View>
      <Text className="text-black text-sm font-semibold mx-4 mt-4">{item.date}</Text>
      {item.entries.map((entry, idx) => {
        const isSubscription = system_type === 'subscription';

        const amountText = isSubscription
          ? `₱${Math.abs(entry.amount)}`
          : entry.amount >= 0
          ? `+₱${entry.amount}`
          : `-₱${Math.abs(entry.amount)}`;

        const amountColorClass = isSubscription
          ? 'text-gray-800'
          : entry.amount >= 0
          ? 'text-green-600'
          : 'text-red-600';

const labelText = entry.subscription_type && !entry.label.includes(entry.subscription_type)
  ? `${entry.label}: ${entry.subscription_type}`
  : entry.label;


        return (
          <View key={idx} className="mx-4 my-2">
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-semibold text-gray-800">{labelText}</Text>
                <Text className={`text-base font-bold ${amountColorClass}`}>{amountText}</Text>
              </View>
              <Text className="text-sm text-gray-500 mt-1">{formatTime(entry.timestamp)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FACC15" />
        <Text className="mt-4 text-gray-600">Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SimpleHeader title="Transactions" />
      <Text className="text-2xl font-bold text-black mx-4 mt-2 mb-1">Transaction History</Text>
      {transactions.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg font-bold text-gray-500">No transactions found.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
      )}
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
