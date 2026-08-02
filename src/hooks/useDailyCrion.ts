/**
 * Monta as entradas do dia (notas aprovadas + comportamento) e gera o Crion.
 */

import { useMemo } from 'react';

import { EARLY_COMPLETION_HOUR, SUBSCRIPTION_PLANS } from '@/constants/game';
import { useAppStore } from '@/stores/useAppStore';
import type { AcademicSubject, Rarity, SubjectScores } from '@/types';
import { summarizeBehaviorDay } from '@/utils/behavior';
import { generateDailyCrion, type GenerationResult } from '@/utils/generation';
import { calculateBonuses } from '@/utils/xp';

/** Teto de raridade e multiplicadores de cada plano. */
const PLAN_LIMITS = {
  free: { maxRarity: 'UNCOMMON' as Rarity, xpMultiplier: 1, lightMultiplier: 1 },
  subject: { maxRarity: 'EPIC' as Rarity, xpMultiplier: 1, lightMultiplier: 1 },
  bundle: {
    maxRarity: 'LEGENDARY' as Rarity,
    xpMultiplier: SUBSCRIPTION_PLANS.bundle.bonusXP,
    lightMultiplier: SUBSCRIPTION_PLANS.bundle.bonusBehaviorXP,
  },
};

export function useDailyCrion(date: string): GenerationResult | null {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const activities = useAppStore((s) => s.activities);
  const duties = useAppStore((s) => s.duties);
  const dutyRecords = useAppStore((s) => s.dutyRecords);
  const subscription = useAppStore((s) => s.subscription);

  return useMemo(() => {
    if (!child) return null;

    const limits = PLAN_LIMITS[subscription.tier];

    const dayActivities = activities.filter(
      (a) => a.childId === child.id && a.date === date,
    );

    const approved = dayActivities.filter(
      (a) => a.status === 'APPROVED' || a.status === 'PARTIALLY_APPROVED',
    );

    // Ainda há atividade esperando o pai? O Crion só nasce no fim do dia.
    const stillPending = dayActivities.some(
      (a) => a.status === 'PENDING_VALIDATION' || a.status === 'IN_PROGRESS',
    );
    if (stillPending) return null;

    const scores: SubjectScores = {};
    for (const activity of approved) {
      const value = activity.validatedScore ?? activity.score;
      scores[activity.subject as AcademicSubject] = value;
    }

    const behavior = summarizeBehaviorDay(
      child.id,
      date,
      duties.filter((d) => d.childId === child.id),
      dutyRecords.filter((r) => r.childId === child.id && r.date === date),
      limits.lightMultiplier,
    );

    // Bônus de conclusão antecipada: última aprovação antes das 18h.
    const lastCompletion = approved
      .map((a) => (a.completedAt ? new Date(a.completedAt).getHours() : 24))
      .sort((a, b) => b - a)[0];

    const bonuses = calculateBonuses({
      earlyCompletion: approved.length > 0 && lastCompletion < EARLY_COMPLETION_HOUR,
      allSubjects: approved.length > 0 && approved.length === dayActivities.length,
      behaviorAllDone: behavior.allApproved,
    });

    return generateDailyCrion({
      childId: child.id,
      childName: child.name,
      tier: child.tier,
      date,
      scores,
      bonuses,
      behaviorApproved: behavior.allApproved,
      maxRarity: limits.maxRarity,
      xpMultiplier: limits.xpMultiplier,
    });
  }, [child, activities, duties, dutyRecords, subscription.tier, date]);
}

export default useDailyCrion;
