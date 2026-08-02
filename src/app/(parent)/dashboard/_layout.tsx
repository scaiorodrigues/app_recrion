import { Stack } from 'expo-router';

import { THEME } from '@/constants/theme';

export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: THEME.colors.background },
      }}
    />
  );
}
