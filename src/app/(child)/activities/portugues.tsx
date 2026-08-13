/**
 * Escolha do exercício de Português do dia.
 *
 * Vale uma atividade de Português por dia, então o que a criança escolher aqui é
 * o exercício do dia. Os três primeiros se corrigem sozinhos e ela descobre na
 * hora como foi; o de escrever à mão vai para o responsável conferir — a tela
 * avisa a diferença, para a criança saber o que esperar antes de entrar.
 */

import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { PORTUGUESE_EXERCISES } from '@/data/exercises';

export default function PortugueseExercises() {
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 23, fontWeight: '900', color: THEME.colors.primary }}>
          Português 🌿
        </Text>
        <Button label="Sair" size="sm" variant="ghost" onPress={() => router.back()} />
      </View>

      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          color: THEME.colors.textLight,
          fontWeight: '700',
        }}
      >
        Escolha um exercício. Você faz um por dia.
      </Text>

      <View style={{ marginTop: 20, gap: 12 }}>
        {PORTUGUESE_EXERCISES.map((exercise) => (
          <Pressable
            key={exercise.id}
            onPress={() => router.push(exercise.route)}
            accessibilityRole="button"
            accessibilityLabel={`${exercise.title}: ${exercise.description}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              backgroundColor: THEME.colors.card,
              borderRadius: THEME.borderRadius.card,
              padding: 16,
              borderWidth: 2.5,
              borderColor: THEME.colors.border,
            }}
          >
            <Text style={{ fontSize: 34 }}>{exercise.emoji}</Text>

            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text }}>
                {exercise.title}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: THEME.colors.textLight }}>
                {exercise.description}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: exercise.autoGraded ? THEME.colors.success : THEME.colors.secondary,
                }}
              >
                {exercise.autoGraded
                  ? '✅ Você vê o resultado na hora'
                  : '⏳ O papai ou a mamãe confere depois'}
              </Text>
            </View>

            <Text style={{ fontSize: 22, color: THEME.colors.primary }}>›</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
