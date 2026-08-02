/**
 * Atividades disponíveis do dia, com limite por tier e pausa obrigatória.
 */

import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import Screen from '@/components/ui/Screen';
import { DAILY_ACTIVITY_RULES, SUBJECT_ELEMENT_MAP, SUBSCRIPTION_PLANS } from '@/constants/game';
import { THEME, TIER_INFO } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { today } from '@/utils/profile';
import type { AcademicSubject } from '@/types';

const BREAK_MS = DAILY_ACTIVITY_RULES.breakBetweenActivitiesMinutes * 60 * 1000;

/** Matérias que já têm tela pronta. As demais aparecem como "em breve". */
const IMPLEMENTED: AcademicSubject[] = ['portugues'];

const ORDER: AcademicSubject[] = [
  'portugues', 'matematica', 'ingles', 'ciencias', 'logica', 'arte', 'musica',
];

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function ChildActivities() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const activities = useAppStore((s) => s.activities);
  const subscription = useAppStore((s) => s.subscription);

  const date = today();
  const [now, setNow] = useState(Date.now());

  const todayActivities = useMemo(
    () => activities.filter((a) => a.childId === child?.id && a.date === date),
    [activities, child?.id, date],
  );

  /** Fim da pausa: 15 minutos após a última atividade concluída. */
  const breakEndsAt = useMemo(() => {
    const timestamps = todayActivities
      .filter((a) => a.completedAt)
      .map((a) => new Date(a.completedAt!).getTime());

    return timestamps.length > 0 ? Math.max(...timestamps) + BREAK_MS : 0;
  }, [todayActivities]);

  const onBreak = now < breakEndsAt;

  // O contador só roda enquanto a pausa está ativa.
  useEffect(() => {
    if (!onBreak) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [onBreak]);

  if (!child) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
          <Text style={{ fontSize: 56 }}>🔑</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: THEME.colors.text, textAlign: 'center' }}>
            Entre com o código do papai ou da mamãe para começar.
          </Text>
        </View>
      </Screen>
    );
  }

  const tier = TIER_INFO[child.tier];
  const maxToday = DAILY_ACTIVITY_RULES.maxActivitiesPerDay[child.tier];
  const duration = DAILY_ACTIVITY_RULES.activityDurationMinutes[child.tier];
  const startedToday = todayActivities.length;
  const reachedLimit = startedToday >= maxToday;

  const unlockedSubjects =
    subscription.tier === 'bundle'
      ? ORDER
      : subscription.tier === 'subject'
        ? subscription.activeSubjects
        : SUBSCRIPTION_PLANS.free.subjects;

  return (
    <Screen>
      <Text style={{ fontSize: 25, fontWeight: '900', color: THEME.colors.secondary }}>
        Oi, {child.name}! 👋
      </Text>
      <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '700', marginTop: 2 }}>
        {tier.emoji} {tier.label} • {startedToday} de {maxToday} atividades hoje
      </Text>

      {onBreak && (
        <View
          style={{
            marginTop: 18,
            padding: 20,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: '#DBEAFE',
            borderWidth: 2.5,
            borderColor: '#3B82F6',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Text style={{ fontSize: 44 }}>🧘</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#1D4ED8' }}>
            Hora de descansar!
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '900', color: '#1D4ED8' }}>
            {formatCountdown(breakEndsAt - now)}
          </Text>
          <Text style={{ fontSize: 13, color: '#1D4ED8', fontWeight: '700', textAlign: 'center' }}>
            Beba água, estique as perninhas. Já já você volta!
          </Text>
        </View>
      )}

      {reachedLimit && !onBreak && (
        <View
          style={{
            marginTop: 18,
            padding: 20,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: '#DCFCE7',
            borderWidth: 2.5,
            borderColor: THEME.colors.success,
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Text style={{ fontSize: 44 }}>🏆</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#15803D' }}>
            Você já fez tudo hoje!
          </Text>
          <Text style={{ fontSize: 13, color: '#15803D', fontWeight: '700', textAlign: 'center' }}>
            Volte amanhã para novas atividades. Que tal ver suas tarefas? ✨
          </Text>
        </View>
      )}

      <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text, marginTop: 26, marginBottom: 12 }}>
        Escolha uma matéria
      </Text>

      <View style={{ gap: 10 }}>
        {ORDER.map((subject) => {
          const info = SUBJECT_ELEMENT_MAP[subject];
          const activity = todayActivities.find((a) => a.subject === subject);
          const locked = !unlockedSubjects.includes(subject);
          const comingSoon = !IMPLEMENTED.includes(subject);

          // Uma atividade por matéria por dia — depois disso, mostra o status.
          const doneToday = Boolean(activity);
          const blocked = locked || comingSoon || doneToday || onBreak || reachedLimit;

          const statusText = locked
            ? '🔒 Disponível na assinatura'
            : comingSoon
              ? '🚧 Em breve'
              : activity?.status === 'PENDING_VALIDATION'
                ? '⏳ Aguardando o papai/mamãe'
                : activity?.status === 'APPROVED'
                  ? '✅ Aprovada!'
                  : activity?.status === 'PARTIALLY_APPROVED'
                    ? '🟡 Aprovada em parte'
                    : activity?.status === 'PENDING_REDO'
                      ? '🔄 Refazer'
                      : `${duration.min}–${duration.max} minutos`;

          return (
            <Pressable
              key={subject}
              onPress={() => {
                if (blocked) return;
                router.push('/(child)/activities/syllables');
              }}
              disabled={blocked}
              accessibilityRole="button"
              accessibilityState={{ disabled: blocked }}
              accessibilityLabel={`${info.subjectLabel}: ${statusText}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                backgroundColor: THEME.colors.card,
                borderRadius: THEME.borderRadius.card,
                padding: 16,
                borderWidth: 2.5,
                borderColor: blocked ? THEME.colors.border : info.color,
                opacity: blocked ? 0.55 : 1,
              }}
            >
              <Text style={{ fontSize: 32 }}>{info.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text }}>
                  {info.subjectLabel}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: info.color }}>
                  {statusText}
                </Text>
              </View>
              {!blocked && <Text style={{ fontSize: 22, color: info.color }}>›</Text>}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
