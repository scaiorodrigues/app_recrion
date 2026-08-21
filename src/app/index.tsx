/**
 * Porta de entrada: escolhe entre o app do pai e o app da criança.
 */

import { Text, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Atalho de teste: entra direto nas atividades com uma criança de 7 anos,
 * sem passar pelo cadastro do responsável e pelo código de convite. A idade é
 * calculada na hora para o tier não envelhecer junto com o calendário.
 */
const DEMO_CHILD_NAME = 'Sofia (teste)';

function demoBirthDate(reference = new Date()): string {
  const year = reference.getFullYear() - 7;
  return `${year}-03-10`;
}

export default function Landing() {
  const setRole = useAppStore((s) => s.setRole);
  const children = useAppStore((s) => s.children);
  const addChild = useAppStore((s) => s.addChild);
  const setActiveChild = useAppStore((s) => s.setActiveChild);

  function enterAsParent() {
    setRole('parent');
    router.push('/(auth)/parent-login');
  }

  function enterAsChild() {
    setRole('child');
    router.push('/(auth)/child-login');
  }

  function testActivities() {
    setRole('child');
    const existing = children.find((c) => c.name === DEMO_CHILD_NAME);
    const child =
      existing ??
      addChild({ name: DEMO_CHILD_NAME, birthDate: demoBirthDate(), avatarEmoji: '👧' });
    setActiveChild(child.id);
    router.push('/(child)/activities');
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingTop: 48, gap: 10 }}>
        <Text style={{ fontSize: 82 }}>✨</Text>

        <Text style={{ fontSize: 46, fontWeight: '900', color: THEME.colors.primary }}>
          Recrion
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

      <View style={{ marginTop: 40, alignItems: 'center', gap: 4 }}>
        <Button
          label="Testar as atividades"
          icon="📚"
          variant="ghost"
          onPress={testActivities}
        />
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
