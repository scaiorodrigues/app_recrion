/**
 * Lógica do módulo de comportamento (elemento Luz).
 * Comportamento nunca é pontuado — é validado pelos pais, tudo ou nada.
 */

import { LIGHT_ALL_DONE_BONUS, LIGHT_BONUS_XP } from '@/constants/game';
import type {
  DailyBehaviorSummary,
  DailyDutyRecord,
  DayOfWeek,
  Duty,
  Tier,
} from '@/types';
import { SUGGESTED_DUTIES } from '@/data/duties';

const DAY_KEYS: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** Dia da semana de uma data 'YYYY-MM-DD', em horário local. */
export function dayOfWeekFor(date: string): DayOfWeek {
  const [year, month, day] = date.split('-').map(Number);
  return DAY_KEYS[new Date(year, month - 1, day).getDay()];
}

/** Obrigações que valem para a data pedida. */
export function dutiesForDate(duties: Duty[], date: string): Duty[] {
  const weekday = dayOfWeekFor(date);
  return duties.filter((d) => d.isActive && d.activeDays.includes(weekday));
}

/** Sugestões da lista pronta filtradas pela faixa etária da criança. */
export function suggestedDutiesForTier(tier: Tier) {
  return SUGGESTED_DUTIES.filter((d) => d.tiers.includes(tier));
}

/**
 * Resumo do dia.
 * SKIPPED não conta como obrigação: o pai marcou como não aplicável,
 * então não penaliza nem bonifica a criança.
 */
export function summarizeBehaviorDay(
  childId: string,
  date: string,
  duties: Duty[],
  records: DailyDutyRecord[],
  /** Multiplicador de XP de Luz do plano (bundle = 1.3). */
  lightMultiplier = 1,
): DailyBehaviorSummary {
  const applicable = dutiesForDate(duties, date);
  const byDutyId = new Map(records.map((r) => [r.dutyId, r]));

  const counted = applicable.filter(
    (d) => byDutyId.get(d.id)?.status !== 'SKIPPED',
  );

  const completedByChild = counted.filter(
    (d) => byDutyId.get(d.id)?.markedDoneByChild === true,
  ).length;

  const approvedByParent = counted.filter(
    (d) => byDutyId.get(d.id)?.status === 'APPROVED',
  ).length;

  const totalDuties = counted.length;
  const allApproved = totalDuties > 0 && approvedByParent === totalDuties;

  // O bônus extra exige que nada tenha ficado pendente nem rejeitado.
  const nothingPending = counted.every(
    (d) => byDutyId.get(d.id)?.status === 'APPROVED',
  );

  const lightBonusXP = allApproved
    ? Math.round(
        (LIGHT_BONUS_XP + (nothingPending ? LIGHT_ALL_DONE_BONUS : 0)) * lightMultiplier,
      )
    : 0;

  return {
    childId,
    date,
    totalDuties,
    completedByChild,
    approvedByParent,
    allApproved,
    lightBonusXP,
  };
}

/** true quando a criança marcou tudo e pode avisar os pais. */
export function canSubmitToParent(duties: Duty[], records: DailyDutyRecord[], date: string): boolean {
  const applicable = dutiesForDate(duties, date);
  if (applicable.length === 0) return false;

  const byDutyId = new Map(records.map((r) => [r.dutyId, r]));
  return applicable.every((d) => {
    const record = byDutyId.get(d.id);
    return record?.markedDoneByChild === true || record?.status === 'SKIPPED';
  });
}

/**
 * Dias consecutivos com comportamento 100% aprovado, contando de trás pra frente.
 * Alimenta o streak exibido no painel do pai e os Crions de Luz raros.
 */
export function calculateBehaviorStreak(summaries: DailyBehaviorSummary[]): number {
  const sorted = [...summaries].sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const summary of sorted) {
    if (!summary.allApproved) break;
    streak++;
  }
  return streak;
}

/** Obrigações que a criança mais esquece — base dos insights pedagógicos. */
export function hardestDuties(
  duties: Duty[],
  allRecords: DailyDutyRecord[],
  limit = 3,
): { duty: Duty; missRate: number }[] {
  return duties
    .map((duty) => {
      const records = allRecords.filter((r) => r.dutyId === duty.id);
      if (records.length === 0) return { duty, missRate: 0 };

      const missed = records.filter(
        (r) => r.status !== 'APPROVED' && r.status !== 'SKIPPED',
      ).length;

      return { duty, missRate: missed / records.length };
    })
    .filter((entry) => entry.missRate > 0)
    .sort((a, b) => b.missRate - a.missRate)
    .slice(0, limit);
}
