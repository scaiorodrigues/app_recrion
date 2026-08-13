/**
 * Atividade de Português — Palavras e Sílabas.
 * Sete campos escritos à mão; a criança confere cada um e envia para validação.
 */

import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import HandwritingCanvas, { type Stroke } from '@/components/activities/HandwritingCanvas';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { answersFor, wordsForTier } from '@/data/words';
import { notifyActivityCompleted } from '@/services/notifications';
import { useAppStore } from '@/stores/useAppStore';
import { today } from '@/utils/profile';
import { pickBySeed } from '@/utils/random';
import type { DailyActivity } from '@/types';

const FIELDS = [
  { key: 'fullWord', label: 'Escreva a palavra completa', hint: 'Capriche na letra!' },
  { key: 'firstLetter', label: 'Qual é a PRIMEIRA letra?', hint: '' },
  { key: 'lastLetter', label: 'Qual é a ÚLTIMA letra?', hint: '' },
  { key: 'firstVowel', label: 'Qual é a PRIMEIRA vogal?', hint: 'a, e, i, o, u' },
  { key: 'lastVowel', label: 'Qual é a ÚLTIMA vogal?', hint: 'a, e, i, o, u' },
  { key: 'letterCount', label: 'Quantas LETRAS tem?', hint: 'Escreva o número' },
  { key: 'syllableCount', label: 'Quantas SÍLABAS tem?', hint: 'Bata palmas para contar!' },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

/** Estado inicial com uma entrada por campo. */
function emptyRecord<T>(initial: () => T): Record<FieldKey, T> {
  return FIELDS.reduce(
    (acc, field) => {
      acc[field.key] = initial();
      return acc;
    },
    {} as Record<FieldKey, T>,
  );
}

export default function SyllablesActivity() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const upsertActivity = useAppStore((s) => s.upsertActivity);

  const date = today();
  const [startedAt] = useState(() => Date.now());

  const words = wordsForTier(child?.tier ?? 'TIER_1');
  const word = useMemo(
    () => pickBySeed(words, `${date}:${child?.id ?? 'demo'}`),
    [words, date, child?.id],
  );
  const answers = useMemo(() => answersFor(word), [word]);

  const [strokes, setStrokes] = useState<Record<FieldKey, Stroke[]>>(emptyRecord<Stroke[]>(() => []));

  /**
   * A criança confere o próprio campo. Escrita à mão não é corrigida
   * automaticamente — quem valida de verdade é o responsável.
   */
  const [confirmed, setConfirmed] = useState<Record<FieldKey, boolean>>(emptyRecord(() => false));

  const [sent, setSent] = useState(false);

  const doneCount = FIELDS.filter((f) => confirmed[f.key]).length;
  const allDone = doneCount === FIELDS.length;

  const clearField = useCallback((key: FieldKey) => {
    setStrokes((prev) => ({ ...prev, [key]: [] }));
    setConfirmed((prev) => ({ ...prev, [key]: false }));
  }, []);

  const confirmField = useCallback((key: FieldKey) => {
    setConfirmed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  function send() {
    if (!child || !allDone) return;

    const score = Math.round((doneCount / FIELDS.length) * 100);
    const activity: DailyActivity = {
      id: `act_${child.id}_${date}_portugues`,
      childId: child.id,
      date,
      subject: 'portugues',
      tier: child.tier,
      status: 'PENDING_VALIDATION',
      score,
      completedAt: new Date().toISOString(),
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
    };

    upsertActivity(activity);
    void notifyActivityCompleted(child.name, 'Português');
    setSent(true);
  }

  if (sent) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', paddingTop: 70, gap: 14 }}>
          <Text style={{ fontSize: 76 }}>🎉</Text>
          <Text style={{ fontSize: 25, fontWeight: '900', color: THEME.colors.primary, textAlign: 'center' }}>
            Enviado para o papai/mamãe!
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: THEME.colors.textLight,
              textAlign: 'center',
              fontWeight: '600',
              paddingHorizontal: 20,
            }}
          >
            Assim que a atividade for aprovada, seu Crion de hoje vai ficar mais forte!
          </Text>
          <View style={{ marginTop: 14 }}>
            <Button label="Voltar às atividades" onPress={() => router.replace('/(child)/activities')} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 23, fontWeight: '900', color: THEME.colors.primary }}>
          Palavras e Sílabas 🌿
        </Text>
        <Button label="Sair" size="sm" variant="ghost" onPress={() => router.back()} />
      </View>

      <View style={{ marginTop: 12 }}>
        <ProgressBar
          progress={doneCount / FIELDS.length}
          color={THEME.colors.primary}
          label={`${doneCount} de ${FIELDS.length} campos prontos`}
          showStars
          totalStars={FIELDS.length}
        />
      </View>

      {/* Palavra do dia */}
      <View
        style={{
          marginTop: 20,
          padding: 22,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: '#DCFCE7',
          borderWidth: 3,
          borderColor: '#22C55E',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 82 }}>{word.emoji}</Text>
        <Text style={{ fontSize: 34, fontWeight: '900', color: '#15803D', letterSpacing: 2 }}>
          {word.word.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 14, color: '#15803D', fontWeight: '700' }}>
          {word.syllables.join(' - ')}
        </Text>
      </View>

      {/* Campos */}
      <View style={{ marginTop: 22, gap: 18 }}>
        {FIELDS.map((field, index) => {
          const isConfirmed = confirmed[field.key];
          const fieldStrokes = strokes[field.key];
          const hasWriting = fieldStrokes.length > 0;

          return (
            <View key={field.key} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: isConfirmed ? THEME.colors.success : THEME.colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
                    {isConfirmed ? '✓' : index + 1}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.colors.text }}>
                    {field.label}
                  </Text>
                  {field.hint !== '' && (
                    <Text style={{ fontSize: 12, color: THEME.colors.textLight, fontWeight: '600' }}>
                      {field.hint}
                    </Text>
                  )}
                </View>
              </View>

              <HandwritingCanvas
                strokes={fieldStrokes}
                onStrokesChange={(next) => setStrokes((prev) => ({ ...prev, [field.key]: next }))}
                disabled={isConfirmed}
                height={field.key === 'fullWord' ? 130 : 100}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => clearField(field.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Apagar ${field.label}`}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: THEME.borderRadius.button,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: THEME.colors.border,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '800', color: THEME.colors.textLight }}>🧽 Apagar</Text>
                </Pressable>

                <Pressable
                  onPress={() => confirmField(field.key)}
                  disabled={!hasWriting}
                  accessibilityRole="button"
                  accessibilityState={{ checked: isConfirmed, disabled: !hasWriting }}
                  accessibilityLabel={`Marcar ${field.label} como feito`}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: THEME.borderRadius.button,
                    backgroundColor: isConfirmed ? THEME.colors.success : THEME.colors.primary,
                    alignItems: 'center',
                    opacity: hasWriting ? 1 : 0.4,
                  }}
                >
                  <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>
                    {isConfirmed ? '✅ Feito!' : '👍 Feito'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ marginTop: 26 }}>
        <Button
          label="Enviar para o papai/mamãe"
          icon="📤"
          size="lg"
          fullWidth
          disabled={!allDone}
          onPress={send}
        />
        {!allDone && (
          <Text
            style={{
              marginTop: 10,
              fontSize: 13,
              color: THEME.colors.textLight,
              textAlign: 'center',
              fontWeight: '600',
            }}
          >
            Complete os {FIELDS.length} campos para enviar.
          </Text>
        )}
      </View>
    </Screen>
  );
}
