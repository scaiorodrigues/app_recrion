import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';

export default function ChildLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.secondary,
        tabBarInactiveTintColor: THEME.colors.textLight,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: THEME.colors.border, height: 62 },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Atividades',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="behavior"
        options={{
          title: 'Tarefas',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Coleção',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: 'Tabuleiro',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
