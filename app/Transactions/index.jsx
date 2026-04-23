import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
      <Text className="text-white text-sm font-semibold mx-4 mt-4">{item.date}</Text>
      {item.entries.map((entry, idx) => {
        const isSubscription = system_type === 'subscription';
        const isPrepaid = system_type === 'prepaid_entry';

        // Check transaction type
        const isTopUp = entry.transaction_type === 'top_up';
        const isGymEntry = entry.transaction_type === 'gym_entry' || entry.amount < 0;
        const isFee = entry.transaction_type === 'new_member' || 
                      entry.transaction_type === 'rfid_replacement' ||
                      entry.transaction_type === 'new_subscription' ||
                      entry.transaction_type === 'renew_subscription';

        // Amount formatting and color
        let amountText;
        let amountColorClass;

        if (isSubscription) {
          // Subscription: always white, no +/- sign
          amountText = `₱${Math.abs(entry.amount)}`;
          amountColorClass = 'text-gray-100';
        } else if (isPrepaid) {
          if (isTopUp) {
            // Top up: green with + sign
            amountText = `+₱${entry.amount}`;
            amountColorClass = 'text-green-500';
          } else if (isGymEntry) {
            // Gym entry: red with - sign
            amountText = `-₱${Math.abs(entry.amount)}`;
            amountColorClass = 'text-red-500';
          } else if (isFee) {
            // Fees (membership, rfid replacement): white, no sign
            amountText = `₱${Math.abs(entry.amount)}`;
            amountColorClass = 'text-gray-100';
          } else {
            // Fallback
            amountText = entry.amount >= 0 ? `+₱${entry.amount}` : `-₱${Math.abs(entry.amount)}`;
            amountColorClass = entry.amount >= 0 ? 'text-green-500' : 'text-red-500';
          }
        }

        const labelText = entry.subscription_type && !entry.label.includes(entry.subscription_type)
          ? `${entry.label}: ${entry.subscription_type}`
          : entry.label;

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
          rfid_tag={rfid_tag}
          system_type={system_type}
          admin_id={admin_id}
        />
      </View>
    </View>
  );
}