/**
 * Painel de comportamento: calendário do mês, streak e insights pedagógicos.
 */

import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { BEHAVIOR_CATEGORIES } from '@/constants/game';
import { THEME } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import {
  calculateBehaviorStreak,
  dutiesForDate,
  hardestDuties,
  summarizeBehaviorDay,
} from '@/utils/behavior';
import { today } from '@/utils/profile';

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Todas as datas do mês corrente até hoje, em 'YYYY-MM-DD'. */
function daysOfCurrentMonth(reference = new Date()): string[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: lastDay }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    return `${year}-${String(month + 1).padStart(2, '0')}-${day}`;
  });
}

export default function ParentBehaviorDashboard() {
  const activeChildId = useAppStore((s) => s.activeChildId);
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const allDuties = useAppStore((s) => s.duties);
  const allRecords = useAppStore((s) => s.dutyRecords);

  const duties = useMemo(
    () => allDuties.filter((d) => d.childId === activeChildId),
    [allDuties, activeChildId],
  );

  const date = today();
  const monthDays = useMemo(() => daysOfCurrentMonth(), []);

  /** Resumo de cada dia do mês, usado no calendário e no streak. */
  const summaries = useMemo(() => {
    if (!activeChildId) return [];
    return monthDays
      .filter((d) => d <= date)
      .map((d) =>
        summarizeBehaviorDay(
          activeChildId,
          d,
          duties,
          allRecords.filter((r) => r.childId === activeChildId && r.date === d),
        ),
      );
  }, [activeChildId, monthDays, date, duties, allRecords]);

  const streak = useMemo(() => calculateBehaviorStreak(summaries), [summaries]);
  const insights = useMemo(
    () => hardestDuties(duties, allRecords.filter((r) => r.childId === activeChildId)),
    [duties, allRecords, activeChildId],
  );

  const todayDuties = dutiesForDate(duties, date);
  const todayRecords = allRecords.filter((r) => r.childId === activeChildId && r.date === date);
  const awaitingValidation = todayRecords.some(
    (r) => r.markedDoneByChild && r.status === 'PENDING',
  );

  if (!child) {
    return (
      <Screen>
        <Text style={{ fontSize: 16, fontWeight: '700', color: THEME.colors.text }}>
          Selecione um filho no painel para ver o comportamento.
        </Text>
        <View style={{ marginTop: 16 }}>
          <Button label="Ir ao painel" onPress={() => router.push('/(parent)/dashboard')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ fontSize: 26, fontWeight: '900', color: THEME.colors.primary }}>
        Comportamento ✨
      </Text>
      <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '600', marginTop: 2 }}>
        {child.name} • sempre gratuito, em todos os planos
      </Text>

      {awaitingValidation && (
        <View
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: '#FEF3C7',
            borderWidth: 2,
            borderColor: THEME.colors.secondary,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#92400E' }}>
            {child.name} marcou as tarefas de hoje!
          </Text>
          <Button
            label="Validar agora"
            icon="✅"
            onPress={() => router.push('/(parent)/behavior/validate')}
          />
        </View>
      )}

      {/* Streak */}
      <View
        style={{
          marginTop: 18,
          padding: 18,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: '#FEFCE8',
          borderWidth: 2,
          borderColor: '#FDE047',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Text style={{ fontSize: 34 }}>{streak >= 7 ? '🔥' : '✨'}</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#A16207' }}>
          {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
        </Text>
        <Text style={{ fontSize: 13, color: '#A16207', fontWeight: '600', textAlign: 'center' }}>
          {streak === 0
            ? 'Comece hoje a sequência de tarefas completas!'
            : `${child.name} está mandando muito bem!`}
        </Text>
      </View>

      {/* Calendário do mês */}
      <Text style={styles.section}>Este mês</Text>
      <View
        style={{
          backgroundColor: THEME.colors.card,
          borderRadius: THEME.borderRadius.card,
          padding: 14,
          borderWidth: 1,
          borderColor: THEME.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {WEEKDAY_LABELS.map((label, i) => (
            <Text
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 11,
                fontWeight: '800',
                color: THEME.colors.textLight,
              }}
            >
              {label}
            </Text>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {/* Espaços vazios até o primeiro dia cair no dia da semana certo */}
          {Array.from({ length: new Date(monthDays[0]).getUTCDay() }).map((_, i) => (
            <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, height: 38 }} />
          ))}

          {monthDays.map((day) => {
            const summary = summaries.find((s) => s.date === day);
            const future = day > date;

            const mark = future
              ? ''
              : summary?.allApproved
                ? '✅'
                : summary && summary.completedByChild > 0
                  ? '⚠️'
                  : summary && summary.totalDuties > 0
                    ? '❌'
                    : '';

            return (
              <View
                key={day}
                style={{ width: `${100 / 7}%`, height: 38, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 10, color: THEME.colors.textLight, fontWeight: '700' }}>
                  {Number(day.slice(-2))}
                </Text>
                <Text style={{ fontSize: 13 }}>{mark}</Text>
              </View>
            );
          })}
        </View>

        <Text style={{ fontSize: 11, color: THEME.colors.textLight, marginTop: 8, fontWeight: '600' }}>
          ✅ tudo aprovado • ⚠️ parcial • ❌ não feito
        </Text>
      </View>

      {/* Insights */}
      {insights.length > 0 && (
        <>
          <Text style={styles.section}>Onde {child.name} tem mais dificuldade</Text>
          <View style={{ gap: 8 }}>
            {insights.map(({ duty, missRate }) => (
              <View
                key={duty.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: THEME.colors.card,
                  borderRadius: THEME.borderRadius.card,
                  padding: 13,
                  borderWidth: 1,
                  borderColor: THEME.colors.border,
                }}
              >
                <Text style={{ fontSize: 24 }}>{duty.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: THEME.colors.text }}>
                    {duty.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: BEHAVIOR_CATEGORIES[duty.category].color, fontWeight: '700' }}>
                    {BEHAVIOR_CATEGORIES[duty.category].label} • esquece {Math.round(missRate * 100)}% das vezes
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ marginTop: 26, gap: 10 }}>
        <Button
          label={todayDuties.length === 0 ? 'Configurar tarefas' : 'Editar tarefas'}
          icon="⚙️"
          fullWidth
          onPress={() => router.push('/(parent)/behavior/config')}
        />
        <Button
          label="Validar tarefas de hoje"
          icon="✅"
          variant="secondary"
          fullWidth
          onPress={() => router.push('/(parent)/behavior/validate')}
        />
      </View>
    </Screen>
  );
}

const styles = {
  section: {
    fontSize: 17,
    fontWeight: '900' as const,
    color: THEME.colors.text,
    marginTop: 26,
    marginBottom: 10,
  },
};
