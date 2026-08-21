/**
 * Raridade da carta do dia — padrão Magic.
 *
 * A raridade NÃO vem do volume de estudo. Ela vem de quanto do dia a criança
 * fechou e com que qualidade. Como o número de atividades por dia é limitado
 * por faixa etária, é impossível "farmar" raridade estudando o dia inteiro:
 * o teto do dia é fechar o que foi proposto, e fechar bem.
 *
 * Isso segue o método do professor Pierluigi Piazzi — pouco, com profundidade
 * e constância, vale mais do que muito e superficial.
 */

import { RARITY_ORDER } from '@/constants/theme';
import type { DayPerformance, Rarity } from '@/types';

/** Nota média mínima para o dia contar como perfeito. */
export const PERFECT_SCORE = 100;

/** Nota média mínima para alcançar Mítica sem ter fechado o dia perfeito. */
const MYTHIC_MIN_AVERAGE = 90;

/** Frações de conclusão que definem cada degrau de raridade. */
const COMPLETION_STEPS: { minRate: number; rarity: Rarity }[] = [
  { minRate: 1, rarity: 'EPIC' },
  { minRate: 0.75, rarity: 'RARE' },
  { minRate: 0.5, rarity: 'UNCOMMON' },
  { minRate: 0, rarity: 'COMMON' },
];

export interface RarityOutcome {
  rarity: Rarity;
  /** Carta holográfica — exclusiva do dia perfeito. */
  foil: boolean;
  /** Fração aprovada do dia, de 0 a 1. */
  completionRate: number;
  /** true quando a criança fechou tudo com nota máxima. */
  perfectDay: boolean;
}

/** Fração do dia que foi aprovada. Dia sem atividade acadêmica devolve 0. */
export function completionRateOf(performance: DayPerformance): number {
  if (performance.available <= 0) return 0;
  return Math.min(1, performance.approved / performance.available);
}

/**
 * Dia perfeito: todas as atividades propostas aprovadas com nota máxima,
 * TODAS certas de primeira — sem o responsável mandar refazer nenhuma — e,
 * se havia obrigações de comportamento, todas validadas também.
 *
 * A exigência do acerto de primeira é o que separa a Lendária da Mítica:
 * insistir até acertar é mérito, mas acertar de saída é outro patamar.
 */
export function isPerfectDay(performance: DayPerformance): boolean {
  const allActivitiesDone =
    performance.available > 0 && performance.approved === performance.available;

  const maxScore = performance.averageScore >= PERFECT_SCORE;

  const behaviorOk = !performance.behaviorRequired || performance.behaviorApproved;

  return allActivitiesDone && maxScore && performance.allFirstTry && behaviorOk;
}

/**
 * Raridade do dia.
 *
 * Dia perfeito entrega Lendária holográfica, independente de XP — é a
 * recompensa por fechar o dia inteiro, não por acumular tempo de tela.
 */
export function determineRarity(performance: DayPerformance): RarityOutcome {
  const completionRate = completionRateOf(performance);
  const perfectDay = isPerfectDay(performance);

  if (perfectDay) {
    return { rarity: 'LEGENDARY', foil: true, completionRate, perfectDay };
  }

  // Dia só de comportamento (fim de semana, férias): Luz garante o mínimo.
  if (performance.available === 0) {
    const rarity: Rarity = performance.behaviorApproved ? 'UNCOMMON' : 'COMMON';
    return { rarity, foil: false, completionRate, perfectDay };
  }

  const step = COMPLETION_STEPS.find((s) => completionRate >= s.minRate);
  let rarity: Rarity = step ? step.rarity : 'COMMON';

  // Fechou o dia mas não tirou nota máxima: Mítica exige média alta.
  if (rarity === 'EPIC' && performance.averageScore < MYTHIC_MIN_AVERAGE) {
    rarity = 'RARE';
  }

  return { rarity, foil: false, completionRate, perfectDay };
}

/** Limita a raridade ao teto do plano. */
export function capRarity(rarity: Rarity, max: Rarity): Rarity {
  return RARITY_ORDER.indexOf(rarity) > RARITY_ORDER.indexOf(max) ? max : rarity;
}

/** Compara duas raridades: negativo se `a` for menor que `b`. */
export function compareRarity(a: Rarity, b: Rarity): number {
  return RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b);
}
