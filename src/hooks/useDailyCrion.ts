/**
 * Monta as entradas do dia (atividades aprovadas + comportamento) e gera o Crion.
 */

import { useMemo } from 'react';

import {
  DAILY_ACTIVITY_RULES,
  EARLY_COMPLETION_HOUR,
  IMPLEMENTED_SUBJECTS,
} from '@/constants/game';
import { useAppStore } from '@/stores/useAppStore';
import type {
  AcademicSubject,
  DailyBehaviorSummary,
  DayPerformance,
  SubjectScores,
} from '@/types';
import { calculateBehaviorStreak, summarizeBehaviorDay } from '@/utils/behavior';
import {
  generateDailyCrion,
  type CompletedActivity,
  type GenerationResult,
} from '@/utils/generation';
import { resolveAccess } from '@/utils/subscription';
import { calculateBonuses } from '@/utils/xp';

/** Quantos dias para trás olhar ao calcular a constância. */
const STREAK_WINDOW_DAYS = 60;

/** Datas dos últimos N dias, da mais recente para a mais antiga. */
function recentDates(upTo: string, days: number): string[] {
  const [y, m, d] = upTo.split('-').map(Number);
  const end = new Date(y, m - 1, d);

  return Array.from({ length: days }, (_, i) => {
    const day = new Date(end);
    day.setDate(day.getDate() - i);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  });
}

export function useDailyCrion(date: string): GenerationResult | null {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const activities = useAppStore((s) => s.activities);
  const duties = useAppStore((s) => s.duties);
  const dutyRecords = useAppStore((s) => s.dutyRecords);
  const subscription = useAppStore((s) => s.subscription);

  return useMemo(() => {
    if (!child) return null;

    const access = resolveAccess(subscription);

    const childDuties = duties.filter((d) => d.childId === child.id);

    const dayActivities = activities.filter(
      (a) => a.childId === child.id && a.date === date,
    );

    const approved = dayActivities.filter(
      (a) => a.status === 'APPROVED' || a.status === 'PARTIALLY_APPROVED',
    );

    // Ainda há atividade esperando o responsável? O Crion só nasce no fim do dia.
    const stillPending = dayActivities.some(
      (a) => a.status === 'PENDING_VALIDATION' || a.status === 'IN_PROGRESS',
    );
    if (stillPending) return null;

    const scores: SubjectScores = {};
    for (const activity of approved) {
      scores[activity.subject as AcademicSubject] = activity.validatedScore ?? activity.score;
    }

    const behavior = summarizeBehaviorDay(
      child.id,
      date,
      childDuties,
      dutyRecords.filter((r) => r.childId === child.id && r.date === date),
      access.lightMultiplier,
    );

    // Constância: dias seguidos com o comportamento fechado, olhando para trás.
    const summaries: DailyBehaviorSummary[] = recentDates(date, STREAK_WINDOW_DAYS).map((d) =>
      summarizeBehaviorDay(
        child.id,
        d,
        childDuties,
        dutyRecords.filter((r) => r.childId === child.id && r.date === d),
      ),
    );
    const streak = calculateBehaviorStreak(summaries);

    // "100% do dia" é o que o app REALMENTE ofereceu hoje: o limite da faixa
    // etária, limitado pelas matérias que a criança tem liberadas e que já
    // possuem atividade pronta. Nunca o quanto ela resolveu tentar — senão
    // bastaria fazer uma atividade e parar para colher a raridade máxima.
    const offerable = access.subjects.filter((s) => IMPLEMENTED_SUBJECTS.includes(s));
    const available = Math.min(
      DAILY_ACTIVITY_RULES.maxActivitiesPerDay[child.tier],
      offerable.length,
    );

    const averageScore =
      approved.length > 0
        ? approved.reduce((sum, a) => sum + (a.validatedScore ?? a.score), 0) / approved.length
        : 0;

    const performance: DayPerformance = {
      available,
      approved: approved.length,
      averageScore,
      behaviorApproved: behavior.allApproved,
      behaviorRequired: behavior.totalDuties > 0,
      streak,
    };

    const lastCompletionHour = approved
      .map((a) => (a.completedAt ? new Date(a.completedAt).getHours() : 24))
      .sort((a, b) => b - a)[0];

    const bonuses = calculateBonuses({
      streak7Days: streak >= 7,
      earlyCompletion: approved.length > 0 && lastCompletionHour < EARLY_COMPLETION_HOUR,
      allSubjects: approved.length > 0 && approved.length === available,
      behaviorAllDone: behavior.allApproved,
    });

    const completed: CompletedActivity[] = approved.map((a) => ({
      subject: a.subject,
      completedAt: a.completedAt,
      durationSeconds: a.durationSeconds,
    }));

    return generateDailyCrion({
      childId: child.id,
      childName: child.name,
      tier: child.tier,
      date,
      scores,
      bonuses,
      behaviorApproved: behavior.allApproved,
      activities: completed,
      performance,
      maxRarity: access.maxRarity,
      xpMultiplier: access.xpMultiplier,
    });
  }, [child, activities, duties, dutyRecords, subscription, date]);
}

export default useDailyCrion;
