import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textLight,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: THEME.colors.border },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Painel',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="behavior"
        options={{
          title: 'Comportamento',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Filhos',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Assinatura',
          tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
