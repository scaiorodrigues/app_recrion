/**
 * Fecho dos exercícios que se corrigem sozinhos.
 *
 * A criança descobre aqui como foi, sem esperar ninguém. O texto muda conforme
 * os erros: quem acertou tudo de primeira precisa saber que isso tem nome e
 * vale alguma coisa, porque é a condição da carta Lendária.
 */

import { Text, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';

interface ExerciseResultProps {
  /** Erros cometidos no exercício inteiro. */
  mistakes: number;
  /** Nota final, de 0 a 100. */
  score: number;
}

function messageFor(mistakes: number): { emoji: string; title: string; note: string } {
  if (mistakes === 0) {
    return {
      emoji: '🌟',
      title: 'Tudo certo de primeira!',
      note: 'Você não errou nenhuma. É assim que nasce uma carta Lendária.',
    };
  }
  if (mistakes <= 2) {
    return {
      emoji: '🎉',
      title: 'Muito bem!',
      note: 'Você tropeçou pouquinho e chegou lá. Amanhã tem mais.',
    };
  }
  return {
    emoji: '💪',
    title: 'Terminou!',
    note: 'Teve erro pelo caminho, e tudo bem — errar é parte de aprender a ler.',
  };
}

export function ExerciseResult({ mistakes, score }: ExerciseResultProps) {
  const { emoji, title, note } = messageFor(mistakes);

  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingTop: 60, gap: 14 }}>
        <Text style={{ fontSize: 76 }}>{emoji}</Text>

        <Text
          style={{
            fontSize: 25,
            fontWeight: '900',
            color: THEME.colors.primary,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            gap: 26,
            marginTop: 4,
            padding: 18,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: THEME.colors.card,
            borderWidth: 2.5,
            borderColor: THEME.colors.border,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 30, fontWeight: '900', color: THEME.colors.success }}>
              {score}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: THEME.colors.textLight }}>
              pontos
            </Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 30,
                fontWeight: '900',
                color: mistakes === 0 ? THEME.colors.success : THEME.colors.secondary,
              }}
            >
              {mistakes}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: THEME.colors.textLight }}>
              {mistakes === 1 ? 'erro' : 'erros'}
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 15,
            color: THEME.colors.textLight,
            textAlign: 'center',
            fontWeight: '600',
            paddingHorizontal: 20,
          }}
        >
          {note}
        </Text>

        <View style={{ marginTop: 14 }}>
          <Button
            label="Voltar às atividades"
            onPress={() => router.replace('/(child)/activities')}
          />
        </View>
      </View>
    </Screen>
  );
}

export default ExerciseResult;
