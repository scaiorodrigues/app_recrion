/**
 * Ler e entender — Ligar a palavra à figura.
 *
 * Quatro palavras e quatro figuras, embaralhadas. A criança toca numa palavra e
 * depois na figura que combina. O par certo trava em verde; o errado devolve as
 * duas e conta um erro.
 *
 * É o exercício mais simples de leitura com sentido: a criança precisa decodificar
 * a palavra inteira, porque as figuras estão todas ali disputando.
 */

import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import ExerciseResult from '@/components/activities/ExerciseResult';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { wordsForTier, type WordEntry } from '@/data/words';
import { useAppStore } from '@/stores/useAppStore';
import { buildAutoGradedActivity, scoreFromMistakes } from '@/utils/exercise';
import { today } from '@/utils/profile';
import { pickManyBySeed, shuffleBySeed } from '@/utils/random';

/** Quantos pares a criança liga por rodada. */
const PAIRS = 4;

export default function WordPictureActivity() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const upsertActivity = useAppStore((s) => s.upsertActivity);

  const date = today();
  const [startedAt] = useState(() => Date.now());
  const tier = child?.tier ?? 'TIER_1';
  const seed = `${date}:${child?.id ?? 'demo'}:ligar-palavra`;

  /** Os pares do dia, estáveis: sair e voltar reencontra o mesmo exercício. */
  const pairs = useMemo(
    () => pickManyBySeed(wordsForTier(tier), PAIRS, seed),
    [tier, seed],
  );
  const pictures = useMemo(() => shuffleBySeed(pairs, `${seed}:figuras`), [pairs, seed]);

  const [linked, setLinked] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [sent, setSent] = useState(false);

  const allLinked = linked.length === pairs.length;

  function tapWord(id: string) {
    if (linked.includes(id)) return;
    setWrongPair(null);
    setSelectedWord(id === selectedWord ? null : id);
  }

  function tapPicture(entry: WordEntry) {
    if (linked.includes(entry.id) || !selectedWord) return;

    if (entry.id === selectedWord) {
      setLinked((prev) => [...prev, entry.id]);
      setSelectedWord(null);
      setWrongPair(null);
      return;
    }

    // Errou: devolve a palavra e marca a figura por um instante.
    setMistakes((n) => n + 1);
    setWrongPair(entry.id);
    setSelectedWord(null);
  }

  function finish() {
    if (!child || !allLinked) return;

    upsertActivity(
      buildAutoGradedActivity({
        childId: child.id,
        date,
        subject: 'portugues',
        tier: child.tier,
        exerciseId: 'ligar-palavra',
        mistakes,
        startedAt,
      }),
    );
    setSent(true);
  }

  if (sent) {
    return <ExerciseResult mistakes={mistakes} score={scoreFromMistakes(mistakes)} />;
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 23, fontWeight: '900', color: THEME.colors.primary }}>
          Ligue à figura 🔗
        </Text>
        <Button label="Sair" size="sm" variant="ghost" onPress={() => router.back()} />
      </View>

      <View style={{ marginTop: 12 }}>
        <ProgressBar
          progress={linked.length / pairs.length}
          color={THEME.colors.primary}
          label={`${linked.length} de ${pairs.length} ligados`}
          showStars
          totalStars={pairs.length}
        />
      </View>

      <Text
        style={{
          marginTop: 18,
          fontSize: 15,
          fontWeight: '800',
          color: THEME.colors.text,
          textAlign: 'center',
        }}
      >
        {selectedWord
          ? 'Agora toque na figura dessa palavra'
          : 'Toque numa palavra para começar'}
      </Text>

      {/* Palavras */}
      <View style={{ marginTop: 16, gap: 10 }}>
        {pairs.map((entry) => {
          const isLinked = linked.includes(entry.id);
          const isSelected = selectedWord === entry.id;

          return (
            <Pressable
              key={entry.id}
              onPress={() => tapWord(entry.id)}
              disabled={isLinked}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isLinked }}
              accessibilityLabel={`Palavra ${entry.word}${isLinked ? ', já ligada' : ''}`}
              style={{
                paddingVertical: 16,
                borderRadius: THEME.borderRadius.card,
                backgroundColor: isLinked ? '#DCFCE7' : '#FFFFFF',
                borderWidth: 3,
                borderColor: isLinked
                  ? THEME.colors.success
                  : isSelected
                    ? THEME.colors.primary
                    : THEME.colors.border,
                alignItems: 'center',
              }}
            >
              {/* Só o texto: desenho ao lado da palavra entregaria a leitura. */}
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '900',
                  letterSpacing: 2,
                  color: isLinked ? '#15803D' : THEME.colors.text,
                }}
              >
                {entry.word.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Figuras */}
      <View
        style={{
          marginTop: 22,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'center',
        }}
      >
        {pictures.map((entry) => {
          const isLinked = linked.includes(entry.id);
          const isWrong = wrongPair === entry.id;

          return (
            <Pressable
              key={entry.id}
              onPress={() => tapPicture(entry)}
              disabled={isLinked || !selectedWord}
              accessibilityRole="button"
              accessibilityState={{ disabled: isLinked }}
              accessibilityLabel={`Figura ${entry.word}`}
              style={{
                width: 132,
                height: 108,
                borderRadius: THEME.borderRadius.card,
                backgroundColor: isLinked ? '#DCFCE7' : isWrong ? '#FEE2E2' : '#FFFFFF',
                borderWidth: 3,
                borderColor: isLinked
                  ? THEME.colors.success
                  : isWrong
                    ? '#DC2626'
                    : THEME.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLinked ? 0.55 : 1,
              }}
            >
              <Text style={{ fontSize: 52 }}>{entry.emoji}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 26 }}>
        <Button
          label="Terminei!"
          icon="🎯"
          size="lg"
          fullWidth
          disabled={!allLinked}
          onPress={finish}
        />
        {!allLinked && (
          <Text
            style={{
              marginTop: 10,
              fontSize: 13,
              color: THEME.colors.textLight,
              textAlign: 'center',
              fontWeight: '600',
            }}
          >
            Ligue as {pairs.length} palavras para terminar.
          </Text>
        )}
      </View>
    </Screen>
  );
}
