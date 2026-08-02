/**
 * "Minhas Tarefas de Hoje" — a tela do módulo de comportamento da criança.
 */

import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import DutyItem from '@/components/behavior/DutyItem';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Screen from '@/components/ui/Screen';
import { BEHAVIOR_CATEGORIES } from '@/constants/game';
import { THEME } from '@/constants/theme';
import { notifyBehaviorCompleted } from '@/services/notifications';
import { useAppStore } from '@/stores/useAppStore';
import { canSubmitToParent, dutiesForDate } from '@/utils/behavior';
import { today } from '@/utils/profile';
import type { BehaviorCategoryId } from '@/types';

/** Estrela girando enquanto a criança espera a aprovação. */
function WaitingStar() {
  const spin = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      spin.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1, false);
      return () => {
        spin.value = 0;
      };
    }, [spin]),
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <Animated.Text style={[{ fontSize: 64 }, style]}>🌟</Animated.Text>
  );
}

export default function ChildBehavior() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const allDuties = useAppStore((s) => s.duties);
  const allRecords = useAppStore((s) => s.dutyRecords);
  const toggleDutyDone = useAppStore((s) => s.toggleDutyDone);

  const [submitted, setSubmitted] = useState(false);
  const date = today();

  const duties = useMemo(
    () => (child ? dutiesForDate(allDuties.filter((d) => d.childId === child.id), date) : []),
    [allDuties, child, date],
  );

  const records = useMemo(
    () => allRecords.filter((r) => r.childId === child?.id && r.date === date),
    [allRecords, child?.id, date],
  );

  if (!child) {
    return (
      <Screen>
        <Text style={{ fontSize: 16, fontWeight: '700', color: THEME.colors.text }}>
          Entre com seu código para ver suas tarefas.
        </Text>
      </Screen>
    );
  }

  const doneCount = duties.filter(
    (d) => records.find((r) => r.dutyId === d.id)?.markedDoneByChild,
  ).length;

  const allDone = duties.length > 0 && doneCount === duties.length;
  const canSubmit = canSubmitToParent(
    allDuties.filter((d) => d.childId === child.id),
    records,
    date,
  );

  // O pai já validou tudo? Então a Luz do dia está garantida.
  const allApproved =
    duties.length > 0 &&
    duties.every((d) => records.find((r) => r.dutyId === d.id)?.status === 'APPROVED');

  const waiting = (submitted || records.some((r) => r.markedDoneByChild)) && allDone && !allApproved;

  function submit() {
    setSubmitted(true);
    void notifyBehaviorCompleted(child!.name);
  }

  const byCategory = duties.reduce<Record<string, typeof duties>>((acc, duty) => {
    (acc[duty.category] ??= []).push(duty);
    return acc;
  }, {});

  return (
    <Screen padded={false}>
      <LinearGradient
        colors={['#FEFCE8', '#FDE68A']}
        style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 22 }}
      >
        <Text style={{ fontSize: 25, fontWeight: '900', color: '#A16207' }}>
          Minhas Tarefas de Hoje ✨
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#A16207', marginTop: 4 }}>
          {doneCount} de {duties.length} feitas
        </Text>

        <View style={{ marginTop: 12 }}>
          <ProgressBar
            progress={duties.length > 0 ? doneCount / duties.length : 0}
            color="#F59E0B"
            showStars
            totalStars={Math.min(7, Math.max(1, duties.length))}
          />
        </View>
      </LinearGradient>

      <View style={{ padding: 16, gap: 20 }}>
        {duties.length === 0 && (
          <View style={{ alignItems: 'center', gap: 10, paddingTop: 30 }}>
            <Text style={{ fontSize: 54 }}>🌤️</Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: THEME.colors.text, textAlign: 'center' }}>
              Nenhuma tarefa para hoje!
            </Text>
            <Text style={{ fontSize: 14, color: THEME.colors.textLight, textAlign: 'center', fontWeight: '600' }}>
              Peça para o papai ou a mamãe configurar suas tarefas.
            </Text>
          </View>
        )}

        {allApproved && (
          <View
            style={{
              padding: 20,
              borderRadius: THEME.borderRadius.card,
              backgroundColor: '#DCFCE7',
              borderWidth: 2.5,
              borderColor: THEME.colors.success,
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 46 }}>🎉</Text>
            <Text style={{ fontSize: 19, fontWeight: '900', color: '#15803D' }}>
              Tudo aprovado!
            </Text>
            <Text style={{ fontSize: 14, color: '#15803D', fontWeight: '700', textAlign: 'center' }}>
              Seu Crion de Luz ficou mais forte hoje ✨
            </Text>
          </View>
        )}

        {waiting && (
          <View
            style={{
              padding: 22,
              borderRadius: THEME.borderRadius.card,
              backgroundColor: '#FEF3C7',
              borderWidth: 2.5,
              borderColor: THEME.colors.secondary,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <WaitingStar />
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#92400E' }}>
              Aguardando aprovação...
            </Text>
            <Text style={{ fontSize: 14, color: '#92400E', fontWeight: '700', textAlign: 'center' }}>
              Você mandou muito bem hoje! Já avisamos seus pais.
            </Text>
          </View>
        )}

        {(Object.keys(byCategory) as BehaviorCategoryId[]).map((categoryId) => {
          const category = BEHAVIOR_CATEGORIES[categoryId];

          return (
            <View key={categoryId} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24 }}>{category.emoji}</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: category.color }}>
                  {category.label}
                </Text>
              </View>

              {byCategory[categoryId].map((duty) => {
                const record = records.find((r) => r.dutyId === duty.id);
                return (
                  <DutyItem
                    key={duty.id}
                    emoji={duty.emoji}
                    label={duty.label}
                    color={category.color}
                    done={record?.markedDoneByChild ?? false}
                    locked={allApproved}
                    onToggle={() => toggleDutyDone(child.id, duty.id, date)}
                  />
                );
              })}
            </View>
          );
        })}

        {canSubmit && !waiting && !allApproved && (
          <View style={{ alignItems: 'center', gap: 10, marginTop: 6 }}>
            <Text style={{ fontSize: 40 }}>🎊</Text>
            <Button
              label="Pronto! Avisar o papai/mamãe"
              icon="🌟"
              size="lg"
              variant="secondary"
              fullWidth
              onPress={submit}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
