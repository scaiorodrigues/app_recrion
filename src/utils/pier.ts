/**
 * Métricas do método do professor Pierluigi Piazzi.
 *
 * O professor Pier organizava o estudo em três pilares — concentração,
 * repetição e organização — e defendia duas práticas: "aula dada, aula
 * estudada hoje" e aprendizagem ativa (escrever, não só ler).
 *
 * Estas métricas traduzem esses princípios em números que o responsável
 * consegue ler no painel. Elas medem HÁBITO, não volume: uma criança que
 * estuda pouco todo dia pontua melhor do que uma que faz tudo num dia só.
 */

import { BEHAVIOR_CATEGORIES, DAILY_ACTIVITY_RULES } from '@/constants/game';
import type {
  DailyActivity,
  DailyDutyRecord,
  Duty,
  Tier,
} from '@/types';

/** Um indicador do painel: uma nota de 0 a 100 e os números que a produziram. */
export interface PierIndicator {
  /** 0 a 100. */
  score: number;
  /** Quantos casos entraram no numerador. */
  count: number;
  /** Quantos casos entraram no denominador. */
  total: number;
}

export interface PierMetrics {
  /** Pilar 1 — atividades feitas dentro do tempo recomendado da faixa. */
  concentration: PierIndicator;
  /** Pilar 2 — quantos dias do período tiveram estudo. */
  repetition: PierIndicator;
  /** Pilar 3 — tarefas de estudo (mochila, caderno, lição) cumpridas. */
  organization: PierIndicator;
  /** "Aula dada, aula estudada hoje" — feito no dia, sem deixar acumular. */
  sameDay: PierIndicator;
  /** Acertou de primeira, sem precisar refazer. */
  firstTry: PierIndicator;
  /** Dias consecutivos de estudo até hoje. */
  currentStreak: number;
  /** Maior sequência do período. */
  longestStreak: number;
  /** Média dos cinco indicadores. */
  overall: number;
}

/** Uma nota segura mesmo quando não há casos para medir. */
function indicator(count: number, total: number): PierIndicator {
  return { score: total > 0 ? Math.round((count / total) * 100) : 0, count, total };
}

/** Só as atividades que o responsável já validou entram nas métricas. */
function validated(activities: DailyActivity[]): DailyActivity[] {
  return activities.filter(
    (a) => a.status === 'APPROVED' || a.status === 'PARTIALLY_APPROVED',
  );
}

/**
 * Pilar 1 — Concentração.
 * Mede se a criança fica na atividade o tempo que ela pede. Rápido demais
 * indica chute; devagar demais indica dispersão. Os dois contam contra.
 */
export function concentrationIndicator(
  activities: DailyActivity[],
  tier: Tier,
): PierIndicator {
  const done = validated(activities).filter(
    (a) => typeof a.durationSeconds === 'number' && a.durationSeconds > 0,
  );

  const range = DAILY_ACTIVITY_RULES.activityDurationMinutes[tier];
  const minSeconds = range.min * 60;
  // Uma folga acima do teto evita punir quem só foi caprichoso.
  const maxSeconds = range.max * 60 * 1.5;

  const withinRange = done.filter(
    (a) => a.durationSeconds! >= minSeconds && a.durationSeconds! <= maxSeconds,
  ).length;

  return indicator(withinRange, done.length);
}

/**
 * Pilar 2 — Repetição.
 * O coração do método: constância. Mede em quantos dias do período houve
 * estudo, não quantas atividades foram feitas no total.
 */
export function repetitionIndicator(
  activities: DailyActivity[],
  datesInPeriod: string[],
): PierIndicator {
  const studiedDates = new Set(validated(activities).map((a) => a.date));
  const studied = datesInPeriod.filter((d) => studiedDates.has(d)).length;

  return indicator(studied, datesInPeriod.length);
}

/**
 * Pilar 3 — Organização.
 * Usa as obrigações da categoria Estudo do módulo de comportamento:
 * organizar a mochila, revisar o caderno, fazer a lição.
 */
export function organizationIndicator(
  duties: Duty[],
  records: DailyDutyRecord[],
): PierIndicator {
  const studyDutyIds = new Set(
    duties.filter((d) => d.category === BEHAVIOR_CATEGORIES.STUDY.id).map((d) => d.id),
  );

  const relevant = records.filter(
    (r) => studyDutyIds.has(r.dutyId) && r.status !== 'SKIPPED',
  );
  const approved = relevant.filter((r) => r.status === 'APPROVED').length;

  return indicator(approved, relevant.length);
}

/**
 * "Aula dada, aula estudada hoje".
 * Mede se a criança conclui a atividade no próprio dia em que a começou,
 * em vez de deixar pendente para depois.
 */
export function sameDayIndicator(activities: DailyActivity[]): PierIndicator {
  const done = validated(activities).filter((a) => a.completedAt);

  const sameDay = done.filter((a) => {
    const completed = new Date(a.completedAt!);
    const localDate = `${completed.getFullYear()}-${String(completed.getMonth() + 1).padStart(2, '0')}-${String(completed.getDate()).padStart(2, '0')}`;
    return localDate === a.date;
  }).length;

  return indicator(sameDay, done.length);
}

/**
 * Acerto de primeira.
 * Atividade aprovada sem o responsável ter mandado refazer nenhuma vez.
 * É a mesma exigência que libera a carta Lendária.
 */
export function firstTryIndicator(activities: DailyActivity[]): PierIndicator {
  const done = validated(activities);
  const firstTry = done.filter(
    (a) => (a.redoCount ?? 0) === 0 && a.status === 'APPROVED',
  ).length;

  return indicator(firstTry, done.length);
}

/** Sequência atual e maior sequência de dias com estudo. */
export function studyStreaks(
  activities: DailyActivity[],
  /** Datas do período, da mais recente para a mais antiga. */
  datesDesc: string[],
): { current: number; longest: number } {
  const studied = new Set(validated(activities).map((a) => a.date));

  let current = 0;
  for (const date of datesDesc) {
    if (!studied.has(date)) break;
    current++;
  }

  let longest = 0;
  let run = 0;
  for (const date of datesDesc) {
    if (studied.has(date)) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  return { current, longest };
}

export interface PierMetricsInput {
  activities: DailyActivity[];
  duties: Duty[];
  dutyRecords: DailyDutyRecord[];
  tier: Tier;
  /** Datas do período, da mais recente para a mais antiga. */
  datesDesc: string[];
}

/** Monta o painel completo das métricas do professor Pier. */
export function calculatePierMetrics(input: PierMetricsInput): PierMetrics {
  const { activities, duties, dutyRecords, tier, datesDesc } = input;

  const concentration = concentrationIndicator(activities, tier);
  const repetition = repetitionIndicator(activities, datesDesc);
  const organization = organizationIndicator(duties, dutyRecords);
  const sameDay = sameDayIndicator(activities);
  const firstTry = firstTryIndicator(activities);
  const streaks = studyStreaks(activities, datesDesc);

  const scores = [concentration, repetition, organization, sameDay, firstTry].map(
    (i) => i.score,
  );

  return {
    concentration,
    repetition,
    organization,
    sameDay,
    firstTry,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    overall: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
  };
}

/** Leitura em português do indicador, para o responsável. */
export function readIndicator(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Excelente', color: '#16A34A' };
  if (score >= 70) return { label: 'Bom', color: '#22C55E' };
  if (score >= 50) return { label: 'Em construção', color: '#F59E0B' };
  if (score > 0) return { label: 'Precisa de atenção', color: '#EF4444' };
  return { label: 'Sem dados ainda', color: '#9CA3AF' };
}
