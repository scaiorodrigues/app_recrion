import { Stack } from 'expo-router';

import { THEME } from '@/constants/theme';

export default function ParentBehaviorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: THEME.colors.background },
      }}
    />
  );
}
