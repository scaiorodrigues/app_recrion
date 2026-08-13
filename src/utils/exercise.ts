/**
 * Regras dos exercícios que se corrigem sozinhos.
 *
 * Nesses exercícios não há espera pelo responsável: a criança toca, descobre na
 * hora se acertou, e a atividade já nasce aprovada. Quem faz o papel do "refazer"
 * é o próprio erro — cada tentativa errada conta, e uma atividade sem nenhum erro
 * é o que o método do professor Pier chama de acerto de primeira.
 */

import type { AcademicSubject, DailyActivity, Tier } from '@/types';

/** Quanto cada erro custa na nota, em pontos. */
const PENALTY_PER_MISTAKE = 12;

/** Piso da nota: errar muito não zera o esforço de ter terminado. */
const MIN_SCORE = 40;

/**
 * Nota de 0 a 100 a partir dos erros cometidos. Terminar sem erro nenhum vale
 * 100; cada erro desconta, até o piso.
 */
export function scoreFromMistakes(mistakes: number): number {
  return Math.max(MIN_SCORE, 100 - mistakes * PENALTY_PER_MISTAKE);
}

export interface AutoGradedResult {
  childId: string;
  date: string;
  subject: AcademicSubject;
  tier: Tier;
  /** Identifica o exercício dentro da matéria, ex: 'ligar-palavra'. */
  exerciseId: string;
  mistakes: number;
  startedAt: number;
}

/**
 * Monta a atividade já aprovada. Diferente dos exercícios manuscritos, aqui a
 * correção é do próprio app: `validatedScore` sai igual ao `score`, e o
 * `redoCount` guarda os erros para alimentar o indicador de acerto de primeira.
 */
export function buildAutoGradedActivity(result: AutoGradedResult): DailyActivity {
  const score = scoreFromMistakes(result.mistakes);
  const now = new Date().toISOString();

  return {
    id: `act_${result.childId}_${result.date}_${result.subject}`,
    childId: result.childId,
    date: result.date,
    subject: result.subject,
    tier: result.tier,
    status: 'APPROVED',
    score,
    validatedScore: score,
    completedAt: now,
    validatedAt: now,
    durationSeconds: Math.round((Date.now() - result.startedAt) / 1000),
    redoCount: result.mistakes,
  };
}
