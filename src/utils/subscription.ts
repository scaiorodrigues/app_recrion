/**
 * Acesso da criança: teste gratuito de 3 dias e planos pagos.
 *
 * O teste dá acesso total — todas as matérias, todas as raridades, todos os
 * mundos — porque a família precisa ver o produto inteiro antes de decidir.
 * O que o teste NÃO afrouxa é o limite diário de atividades: constância é a
 * proposta pedagógica do app, não maratona.
 *
 * Comportamento (elemento Luz) fica gratuito para sempre, mesmo depois que o
 * teste expira. É a âncora de retenção e nunca entra no paywall.
 */

import { SUBSCRIPTION_PLANS, TRIAL_DAYS } from '@/constants/game';
import type { AcademicSubject, AccessState, Rarity, SubscriptionState } from '@/types';

const ALL_SUBJECTS: AcademicSubject[] = [
  'portugues', 'matematica', 'ingles', 'ciencias', 'logica', 'arte', 'musica',
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Dias corridos já consumidos do teste. */
function daysElapsed(startedAt: string, reference: Date): number {
  const start = new Date(startedAt).getTime();
  return Math.floor((reference.getTime() - start) / MS_PER_DAY);
}

/** Quantos dias de teste ainda restam. Zero se já acabou ou nunca começou. */
export function trialDaysLeft(
  subscription: SubscriptionState,
  reference = new Date(),
): number {
  if (!subscription.trialStartedAt) return 0;
  const left = TRIAL_DAYS - daysElapsed(subscription.trialStartedAt, reference);
  return Math.max(0, left);
}

export function isTrialActive(
  subscription: SubscriptionState,
  reference = new Date(),
): boolean {
  return trialDaysLeft(subscription, reference) > 0;
}

/** true quando há assinatura paga válida. */
export function hasPaidPlan(
  subscription: SubscriptionState,
  reference = new Date(),
): boolean {
  if (subscription.tier === 'free') return false;
  if (!subscription.expiresAt) return true;
  return new Date(subscription.expiresAt).getTime() > reference.getTime();
}

/**
 * Resolve o que está liberado agora.
 * Ordem de precedência: plano pago > teste ativo > teste expirado.
 */
export function resolveAccess(
  subscription: SubscriptionState,
  reference = new Date(),
): AccessState {
  const trialActive = isTrialActive(subscription, reference);
  const daysLeft = trialDaysLeft(subscription, reference);
  const paid = hasPaidPlan(subscription, reference);

  if (paid) {
    const bundle = subscription.tier === 'bundle';
    return {
      trialActive: false,
      trialDaysLeft: 0,
      trialExpired: false,
      subjects: bundle ? ALL_SUBJECTS : subscription.activeSubjects,
      maxRarity: (bundle
        ? SUBSCRIPTION_PLANS.bundle.crionRarityMax
        : SUBSCRIPTION_PLANS.subject.crionRarityMax) as Rarity,
      behavior: true,
      boardWorlds: 8,
      xpMultiplier: bundle ? SUBSCRIPTION_PLANS.bundle.bonusXP : 1,
      lightMultiplier: bundle ? SUBSCRIPTION_PLANS.bundle.bonusBehaviorXP : 1,
    };
  }

  if (trialActive) {
    return {
      trialActive: true,
      trialDaysLeft: daysLeft,
      trialExpired: false,
      subjects: ALL_SUBJECTS,
      maxRarity: SUBSCRIPTION_PLANS.free.crionRarityMax as Rarity,
      behavior: true,
      boardWorlds: SUBSCRIPTION_PLANS.free.boardWorlds,
      xpMultiplier: 1,
      lightMultiplier: 1,
    };
  }

  // Teste acabou: só comportamento continua. Nenhuma matéria acadêmica.
  return {
    trialActive: false,
    trialDaysLeft: 0,
    trialExpired: true,
    subjects: [],
    maxRarity: 'LEGENDARY',
    behavior: true,
    boardWorlds: 1,
    xpMultiplier: 1,
    lightMultiplier: 1,
  };
}

/** Marca o início do teste — chamado quando o primeiro filho é cadastrado. */
export function startTrial(
  subscription: SubscriptionState,
  reference = new Date(),
): SubscriptionState {
  if (subscription.trialStartedAt) return subscription;
  return { ...subscription, trialStartedAt: reference.toISOString() };
}
