import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import { View, Text, Animated } from "react-native";

export default function Layout() {
  const toastConfig = {
    info: ({ text1, text2, ...rest }) => {
      return (
        <Animated.View
          {...rest}
          style={{
            backgroundColor: '#1F2937', // gray-800
            borderColor: '#fff',
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            minWidth: 20,
            maxWidth: '80%',
            alignSelf: 'center',
          }}
        >
          {text1 && <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{text1}</Text>}
          {text2 && <Text style={{ color: '#D1D5DB', fontSize: 14 }}>{text2}</Text>}
        </Animated.View>
      );
    },
    error: ({ text1, text2, ...rest }) => {
      return (
        <Animated.View
          {...rest}
          style={{
            backgroundColor: '#1F2937',
            borderColor: '#fff',
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            minWidth: 20,
            maxWidth: '80%',
            alignSelf: 'center',
          }}
        >
          {text1 && <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{text1}</Text>}
          {text2 && <Text style={{ color: '#D1D5DB', fontSize: 14 }}>{text2}</Text>}
        </Animated.View>
      );
    },
  };

  return (
    <>
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }} />
<Toast config={toastConfig} position="center" topOffset={100} bottomOffset={0} />
    </>
  );
}
