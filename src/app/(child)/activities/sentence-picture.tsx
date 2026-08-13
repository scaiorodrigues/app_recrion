/**
 * Ler e entender — Ler a frase e escolher a cena.
 *
 * A criança lê uma frase curta e escolhe entre três cenas qual é a que a frase
 * descreve. As cenas erradas trocam só um pedaço da frase — quem faz, o que faz
 * ou onde faz — então acertar exige ler até o fim, e não parar na primeira
 * palavra reconhecida.
 *
 * São três frases por rodada. Errar não trava: a cena errada apaga, conta o erro
 * e a criança tenta de novo até achar a certa.
 */

import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import ExerciseResult from '@/components/activities/ExerciseResult';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { sentencesForTier, sentenceText } from '@/data/sentences';
import { useAppStore } from '@/stores/useAppStore';
import { buildAutoGradedActivity, scoreFromMistakes } from '@/utils/exercise';
import { today } from '@/utils/profile';
import { pickManyBySeed, shuffleBySeed } from '@/utils/random';

/** Quantas frases a criança lê por rodada. */
const ROUNDS = 3;

export default function SentencePictureActivity() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const upsertActivity = useAppStore((s) => s.upsertActivity);

  const date = today();
  const [startedAt] = useState(() => Date.now());
  const tier = child?.tier ?? 'TIER_1';
  const seed = `${date}:${child?.id ?? 'demo'}:ler-frase`;

  const rounds = useMemo(
    () => pickManyBySeed(sentencesForTier(tier), ROUNDS, seed),
    [tier, seed],
  );

  const [index, setIndex] = useState(0);
  const [wrongScenes, setWrongScenes] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [sent, setSent] = useState(false);

  const round = rounds[index];

  /** As três cenas da rodada, em ordem estável. */
  const scenes = useMemo(
    () => (round ? shuffleBySeed([round.scene, ...round.distractors], `${seed}:${round.id}`) : []),
    [round, seed],
  );

  function tapScene(scene: string) {
    if (!round || wrongScenes.includes(scene)) return;

    if (scene !== round.scene) {
      setMistakes((n) => n + 1);
      setWrongScenes((prev) => [...prev, scene]);
      return;
    }

    // Acertou: vai para a próxima frase, ou fecha a atividade.
    if (index + 1 < rounds.length) {
      setIndex((i) => i + 1);
      setWrongScenes([]);
      return;
    }

    if (!child) return;
    upsertActivity(
      buildAutoGradedActivity({
        childId: child.id,
        date,
        subject: 'portugues',
        tier: child.tier,
        exerciseId: 'ler-frase',
        mistakes,
        startedAt,
      }),
    );
    setSent(true);
  }

  if (sent) {
    return <ExerciseResult mistakes={mistakes} score={scoreFromMistakes(mistakes)} />;
  }

  if (!round) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
          <Text style={{ fontSize: 56 }}>📖</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: THEME.colors.text, textAlign: 'center' }}>
            Ainda não há frases para esta idade.
          </Text>
          <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 23, fontWeight: '900', color: THEME.colors.primary }}>
          Leia e escolha 📖
        </Text>
        <Button label="Sair" size="sm" variant="ghost" onPress={() => router.back()} />
      </View>

      <View style={{ marginTop: 12 }}>
        <ProgressBar
          progress={index / rounds.length}
          color={THEME.colors.primary}
          label={`Frase ${index + 1} de ${rounds.length}`}
          showStars
          totalStars={rounds.length}
        />
      </View>

      {/* A frase */}
      <View
        style={{
          marginTop: 22,
          padding: 24,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: '#DCFCE7',
          borderWidth: 3,
          borderColor: '#22C55E',
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: '900',
            color: '#15803D',
            textAlign: 'center',
            letterSpacing: 1.5,
            lineHeight: 36,
          }}
        >
          {sentenceText(round)}
        </Text>
      </View>

      <Text
        style={{
          marginTop: 20,
          fontSize: 15,
          fontWeight: '800',
          color: THEME.colors.text,
          textAlign: 'center',
        }}
      >
        Qual figura mostra o que a frase diz?
      </Text>

      <View style={{ marginTop: 16, gap: 12 }}>
        {scenes.map((scene) => {
          const isWrong = wrongScenes.includes(scene);

          return (
            <Pressable
              key={scene}
              onPress={() => tapScene(scene)}
              disabled={isWrong}
              accessibilityRole="button"
              accessibilityState={{ disabled: isWrong }}
              accessibilityLabel={`Escolher a figura ${scene}`}
              style={{
                paddingVertical: 20,
                borderRadius: THEME.borderRadius.card,
                backgroundColor: isWrong ? '#FEE2E2' : '#FFFFFF',
                borderWidth: 3,
                borderColor: isWrong ? '#DC2626' : THEME.colors.border,
                alignItems: 'center',
                opacity: isWrong ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 54 }}>{scene}</Text>
            </Pressable>
          );
        })}
      </View>

      {wrongScenes.length > 0 && (
        <Text
          style={{
            marginTop: 16,
            fontSize: 14,
            color: THEME.colors.textLight,
            textAlign: 'center',
            fontWeight: '700',
          }}
        >
          Essa não era. Leia a frase de novo com calma e tente outra. 🔎
        </Text>
      )}
    </Screen>
  );
}
