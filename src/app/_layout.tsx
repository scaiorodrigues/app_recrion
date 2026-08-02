import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';
import { requestNotificationPermission } from '@/services/notifications';

import '../global.css';

export default function RootLayout() {
  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: THEME.colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(parent)" />
          <Stack.Screen name="(child)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
