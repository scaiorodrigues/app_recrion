/**
 * Ler e entender — Ordenar as palavras da frase.
 *
 * As palavras da frase chegam embaralhadas e a criança toca nelas na ordem certa.
 * A figura fica à vista o tempo todo: ela é a pista do sentido, e é o sentido que
 * diz qual palavra vem antes.
 *
 * Tocar fora de ordem conta um erro e a palavra volta para o monte — a frase nunca
 * fica errada montada na tela, porque ler a própria frase errada atrapalha quem
 * ainda está fixando a forma escrita.
 */

import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import ExerciseResult from '@/components/activities/ExerciseResult';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { sentencesForTier } from '@/data/sentences';
import { useAppStore } from '@/stores/useAppStore';
import { buildAutoGradedActivity, scoreFromMistakes } from '@/utils/exercise';
import { today } from '@/utils/profile';
import { pickManyBySeed, shuffleBySeed } from '@/utils/random';

/** Quantas frases a criança monta por rodada. */
const ROUNDS = 3;

/** Palavra no monte, com a posição que ela ocupa na frase. */
interface Chip {
  key: string;
  word: string;
  position: number;
}

export default function SentenceOrderActivity() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const upsertActivity = useAppStore((s) => s.upsertActivity);

  const date = today();
  const [startedAt] = useState(() => Date.now());
  const tier = child?.tier ?? 'TIER_1';
  const seed = `${date}:${child?.id ?? 'demo'}:ordenar-frase`;

  const rounds = useMemo(
    () => pickManyBySeed(sentencesForTier(tier), ROUNDS, `${seed}:frases`),
    [tier, seed],
  );

  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<Chip[]>([]);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [sent, setSent] = useState(false);

  const round = rounds[index];

  /** As palavras embaralhadas. A mesma palavra pode repetir, daí a chave. */
  const chips = useMemo(() => {
    if (!round) return [];
    const all: Chip[] = round.words.map((word, position) => ({
      key: `${round.id}_${position}`,
      word,
      position,
    }));
    return shuffleBySeed(all, `${seed}:${round.id}`);
  }, [round, seed]);

  const remaining = chips.filter((c) => !placed.some((p) => p.key === c.key));

  function tapChip(chip: Chip) {
    if (!round) return;

    // A próxima palavra da frase é a que ocupa a posição já preenchida.
    if (chip.position !== placed.length) {
      // Insistir na mesma palavra errada não conta de novo: criança de 7 anos
      // toca duas vezes sem querer, e isso não é um erro novo de leitura.
      if (wrongKey !== chip.key) setMistakes((n) => n + 1);
      setWrongKey(chip.key);
      return;
    }

    const next = [...placed, chip];
    setWrongKey(null);

    if (next.length < round.words.length) {
      setPlaced(next);
      return;
    }

    // Frase completa: próxima rodada, ou fecha a atividade.
    if (index + 1 < rounds.length) {
      setIndex((i) => i + 1);
      setPlaced([]);
      return;
    }

    setPlaced(next);
    if (!child) return;
    upsertActivity(
      buildAutoGradedActivity({
        childId: child.id,
        date,
        subject: 'portugues',
        tier: child.tier,
        exerciseId: 'ordenar-frase',
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
          <Text style={{ fontSize: 56 }}>🧩</Text>
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
          Monte a frase 🧩
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

      {/* A cena, que é a pista do sentido */}
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <Text style={{ fontSize: 66 }}>{round.scene}</Text>
      </View>

      {/* A frase sendo montada */}
      <View
        style={{
          marginTop: 16,
          minHeight: 92,
          padding: 16,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: '#DCFCE7',
          borderWidth: 3,
          borderColor: '#22C55E',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {placed.length === 0 ? (
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#15803D' }}>
            Toque nas palavras na ordem certa
          </Text>
        ) : (
          placed.map((chip) => (
            <Text
              key={chip.key}
              style={{ fontSize: 21, fontWeight: '900', color: '#15803D', letterSpacing: 1 }}
            >
              {chip.word}
            </Text>
          ))
        )}
      </View>

      {/* O monte de palavras */}
      <View
        style={{
          marginTop: 24,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'center',
        }}
      >
        {remaining.map((chip) => {
          const isWrong = wrongKey === chip.key;

          return (
            <Pressable
              key={chip.key}
              onPress={() => tapChip(chip)}
              accessibilityRole="button"
              accessibilityLabel={`Palavra ${chip.word}`}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderRadius: THEME.borderRadius.button,
                backgroundColor: isWrong ? '#FEE2E2' : '#FFFFFF',
                borderWidth: 3,
                borderColor: isWrong ? '#DC2626' : THEME.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 21,
                  fontWeight: '900',
                  letterSpacing: 1,
                  color: isWrong ? '#B91C1C' : THEME.colors.text,
                }}
              >
                {chip.word}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {wrongKey && (
        <Text
          style={{
            marginTop: 18,
            fontSize: 14,
            color: THEME.colors.textLight,
            textAlign: 'center',
            fontWeight: '700',
          }}
        >
          Essa palavra ainda não. Olhe a figura e pense em como a frase começa. 🔎
        </Text>
      )}
    </Screen>
  );
}
