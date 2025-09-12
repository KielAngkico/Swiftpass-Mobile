import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useState } from "react";
import { Calendar } from "react-native-calendars";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

export default function Header({ currentDate, setCurrentDate }) {
  const navigation = useNavigation();
  const [showCalendar, setShowCalendar] = useState(false);

  const goToPreviousDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  return (
    <View className="bg-black py-3 px-4 shadow-md">

      <View className="flex-row justify-between items-center mb-2">

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowCalendar(true)}>
          <Feather name="calendar" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <Modal transparent visible={showCalendar} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-4 w-80">
            <Calendar
              current={currentDate.toISOString().split("T")[0]}
              onDayPress={(day) => {
                setCurrentDate(new Date(day.dateString));
                setShowCalendar(false);
              }}
              theme={{
                selectedDayBackgroundColor: "#000",
                arrowColor: "#000",
                todayTextColor: "#000",
              }}
            />
            <TouchableOpacity onPress={() => setShowCalendar(false)} className="mt-2 self-end">
              <Text className="text-black font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
