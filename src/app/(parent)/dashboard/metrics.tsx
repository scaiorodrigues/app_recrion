/**
 * Painel de métricas do método do professor Pierluigi Piazzi.
 * Mostra ao responsável se a criança está criando HÁBITO, não volume.
 */

import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import {
  calculatePierMetrics,
  readIndicator,
  type PierIndicator,
} from '@/utils/pier';
import { today } from '@/utils/profile';

/** Janela de análise do painel. */
const PERIOD_DAYS = 30;

/** Datas do período, da mais recente para a mais antiga. */
function periodDates(upTo: string, days: number): string[] {
  const [y, m, d] = upTo.split('-').map(Number);
  const end = new Date(y, m - 1, d);

  return Array.from({ length: days }, (_, i) => {
    const day = new Date(end);
    day.setDate(day.getDate() - i);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  });
}

function IndicatorCard({
  emoji,
  title,
  subtitle,
  indicator,
  unit,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  indicator: PierIndicator;
  unit: string;
}) {
  const reading = readIndicator(indicator.score);

  return (
    <View
      style={{
        backgroundColor: THEME.colors.card,
        borderRadius: THEME.borderRadius.card,
        padding: 16,
        borderWidth: 2,
        borderColor: THEME.colors.border,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 26 }}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: THEME.colors.text }}>
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: THEME.colors.textLight, fontWeight: '600' }}>
            {subtitle}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: reading.color }}>
            {indicator.total > 0 ? `${indicator.score}%` : '—'}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '800', color: reading.color }}>
            {reading.label}
          </Text>
        </View>
      </View>

      <ProgressBar progress={indicator.score / 100} color={reading.color} height={10} />

      <Text style={{ fontSize: 12, color: THEME.colors.textLight, fontWeight: '600' }}>
        {indicator.total > 0
          ? `${indicator.count} de ${indicator.total} ${unit}`
          : 'Ainda não há dados suficientes.'}
      </Text>
    </View>
  );
}

export default function PierMetrics() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const allActivities = useAppStore((s) => s.activities);
  const allDuties = useAppStore((s) => s.duties);
  const allRecords = useAppStore((s) => s.dutyRecords);

  const date = today();
  const datesDesc = useMemo(() => periodDates(date, PERIOD_DAYS), [date]);

  const metrics = useMemo(() => {
    if (!child) return null;

    const dates = new Set(datesDesc);

    return calculatePierMetrics({
      activities: allActivities.filter((a) => a.childId === child.id && dates.has(a.date)),
      duties: allDuties.filter((d) => d.childId === child.id),
      dutyRecords: allRecords.filter((r) => r.childId === child.id && dates.has(r.date)),
      tier: child.tier,
      datesDesc,
    });
  }, [child, allActivities, allDuties, allRecords, datesDesc]);

  if (!child || !metrics) {
    return (
      <Screen>
        <Text style={{ fontSize: 16, fontWeight: '700', color: THEME.colors.text }}>
          Selecione um filho no painel para ver as métricas.
        </Text>
        <View style={{ marginTop: 16 }}>
          <Button label="Ir ao painel" onPress={() => router.push('/(parent)/dashboard')} />
        </View>
      </Screen>
    );
  }

  const overallReading = readIndicator(metrics.overall);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: THEME.colors.primary }}>
          Método Prof. Pier
        </Text>
        <Button label="Voltar" size="sm" variant="ghost" onPress={() => router.back()} />
      </View>

      <Text style={{ fontSize: 13, color: THEME.colors.textLight, fontWeight: '600', marginTop: 4 }}>
        {child.name} • últimos {PERIOD_DAYS} dias
      </Text>

      {/* Nota geral */}
      <View
        style={{
          marginTop: 18,
          padding: 20,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: '#F5F3FF',
          borderWidth: 2.5,
          borderColor: THEME.colors.primary,
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '800', color: THEME.colors.textLight }}>
          HÁBITO DE ESTUDO
        </Text>
        <Text style={{ fontSize: 46, fontWeight: '900', color: overallReading.color }}>
          {metrics.overall}%
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '900', color: overallReading.color }}>
          {overallReading.label}
        </Text>

        <View style={{ flexDirection: 'row', gap: 18, marginTop: 10 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: THEME.colors.primary }}>
              {metrics.currentStreak}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.colors.textLight }}>
              dias seguidos
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: THEME.colors.secondary }}>
              {metrics.longestStreak}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.colors.textLight }}>
              melhor sequência
            </Text>
          </View>
        </View>
      </View>

      <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text, marginTop: 26, marginBottom: 4 }}>
        Os três pilares
      </Text>
      <Text style={{ fontSize: 12, color: THEME.colors.textLight, fontWeight: '600', marginBottom: 12 }}>
        Concentração, repetição e organização — a base do método.
      </Text>

      <View style={{ gap: 12 }}>
        <IndicatorCard
          emoji="🎯"
          title="Concentração"
          subtitle="Fica na atividade o tempo que ela pede"
          indicator={metrics.concentration}
          unit="atividades no tempo certo"
        />
        <IndicatorCard
          emoji="🔁"
          title="Repetição"
          subtitle="Estuda um pouco todo dia, sem acumular"
          indicator={metrics.repetition}
          unit="dias com estudo"
        />
        <IndicatorCard
          emoji="🎒"
          title="Organização"
          subtitle="Mochila, caderno e lição em ordem"
          indicator={metrics.organization}
          unit="tarefas de estudo cumpridas"
        />
      </View>

      <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text, marginTop: 26, marginBottom: 12 }}>
        As duas práticas
      </Text>

      <View style={{ gap: 12 }}>
        <IndicatorCard
          emoji="📅"
          title="Aula dada, aula estudada hoje"
          subtitle="Conclui no mesmo dia, sem deixar para depois"
          indicator={metrics.sameDay}
          unit="atividades feitas no dia"
        />
        <IndicatorCard
          emoji="✍️"
          title="Acerto de primeira"
          subtitle="Escreve com atenção e não precisa refazer"
          indicator={metrics.firstTry}
          unit="atividades certas de saída"
        />
      </View>

      <View
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: '#FEFCE8',
          borderWidth: 2,
          borderColor: '#FDE047',
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '900', color: '#A16207' }}>
          Por que medimos assim?
        </Text>
        <Text style={{ fontSize: 13, color: '#A16207', fontWeight: '600', marginTop: 6, lineHeight: 19 }}>
          O professor Pierluigi Piazzi defendia que estudar pouco, com profundidade
          e constância, rende mais do que maratonar. Por isso estes números medem
          hábito — e não quantas horas seu filho passou no app.
        </Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Button
          label="Ver comportamento"
          icon="✨"
          variant="secondary"
          fullWidth
          onPress={() => router.push('/(parent)/behavior')}
        />
      </View>
    </Screen>
  );
}
