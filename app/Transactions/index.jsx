import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NavigationBar from '../../components/NavigationBar';
import SimpleHeader from '../../components/SimpleHeader';
import API from '../../backend-api/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function TransactionsScreen() {
  const router = useRouter();
const { email = '', member_id = '', admin_id = '', rfid_tag = '', system_type = '' } = useLocalSearchParams();  const [transactions, setTransactions] = useState([]);
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
        const resolvedMemberId = member_id || await AsyncStorage.getItem('member_id');
        if (!resolvedMemberId) throw new Error('Member ID is missing.');
        const res = await API.get(`/transactions/activity-log?member_id=${resolvedMemberId}&system_type=${system_type}`);
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
  }, [member_id, system_type]);

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderItem = ({ item }) => (
    <View>
      <Text className="text-white text-sm font-semibold mx-4 mt-4">{item.date}</Text>
      {item.entries.map((entry, idx) => {
// Check transaction type
        const isTopUp = entry.transaction_type === 'top_up';
        const isGymEntry = entry.transaction_type === 'gym_entry' || entry.amount < 0;

        // Amount formatting and color
        let amountText;
        let amountColorClass;

        if (isTopUp) {
          // Top up: always green + (prepaid only)
          amountText = `+₱${Number(entry.amount).toFixed(2)}`;
          amountColorClass = 'text-green-500';
        } else if (isGymEntry) {
          // Gym entry: always red - (prepaid only)
          amountText = `-₱${Math.abs(Number(entry.amount)).toFixed(2)}`;
          amountColorClass = 'text-red-500';
        } else {
          // Everything else: new_member, renew_subscription, rfid_replacement — neutral white
          amountText = `₱${Math.abs(Number(entry.amount)).toFixed(2)}`;
          amountColorClass = 'text-gray-100';
        }

const labelText = entry.label;

        return (
          <View key={entry.transaction_id || `entry-${idx}`} className="mx-4 my-2">
            <View className="bg-gray-800 border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
              {/* First Row: Label and Amount */}
              <View className="flex-row justify-between items-center">
                <Text className="text-white text-base font-semibold flex-1">{labelText}</Text>
                <Text className={`text-base font-bold ${amountColorClass}`}>{amountText}</Text>
              </View>
              
              {/* Second Row: Time and Transaction ID */}
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-gray-400 text-sm">{formatTime(entry.timestamp)}</Text>
                {entry.transaction_id ? (
                  <Text className="text-gray-400 text-xs">Transaction ID: {entry.transaction_id}</Text>
                ) : (
                  <Text className="text-gray-400 text-xs">Entry Log</Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-400">Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <SimpleHeader title="Transaction History" />

      {transactions.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg font-bold text-gray-400">
            No transactions found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 70 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View className="bg-white border-t border-gray-200 safe-area-bottom">
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