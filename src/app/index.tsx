/**
 * Porta de entrada: escolhe entre o app do pai e o app da criança.
 */

import { Text, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';

export default function Landing() {
  const setRole = useAppStore((s) => s.setRole);

  function enterAsParent() {
    setRole('parent');
    router.push('/(auth)/parent-login');
  }

  function enterAsChild() {
    setRole('child');
    router.push('/(auth)/child-login');
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingTop: 48, gap: 10 }}>
        <Text style={{ fontSize: 82 }}>✨</Text>

        <Text style={{ fontSize: 46, fontWeight: '900', color: THEME.colors.primary }}>
          Recriô
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: THEME.colors.textLight,
            textAlign: 'center',
            fontWeight: '600',
            paddingHorizontal: 24,
          }}
        >
          Estude, cumpra suas tarefas e descubra o Crion que nasce do seu dia.
        </Text>
      </View>

      <View style={{ marginTop: 56, gap: 14 }}>
        <Button label="Sou pai ou mãe" icon="👨‍👩‍👧" size="lg" fullWidth onPress={enterAsParent} />
        <Button
          label="Sou criança"
          icon="🧒"
          size="lg"
          variant="secondary"
          fullWidth
          onPress={enterAsChild}
        />
      </View>

      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <Button
          label="Ver demonstração das cartas"
          icon="🃏"
          variant="ghost"
          onPress={() => router.push('/card-lab')}
        />
      </View>
    </Screen>
  );
}
