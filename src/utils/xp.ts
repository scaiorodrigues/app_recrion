/**
 * Cálculo de XP diário e determinação de elementos.
 * A raridade da carta mora em utils/rarity.ts — ela vem do desempenho do dia,
 * não do XP acumulado.
 */

import {
  BONUS_ALL_SUBJECTS,
  BONUS_BEHAVIOR_ALL_DONE,
  BONUS_BEHAVIOR_COMPLETE,
  BONUS_EARLY_COMPLETION,
  BONUS_STREAK_7_DAYS,
  SUBJECT_ELEMENT_MAP,
  SUBJECT_WEIGHTS,
} from '@/constants/game';
import type {
  AcademicSubject,
  Bonuses,
  PlayableElement,
  SubjectScores,
} from '@/types';

/** Diferença máxima entre 1º e 2º lugar para o Crion sair híbrido. */
const HYBRID_THRESHOLD = 10;

/** Pontuação de cada matéria já multiplicada pelo seu peso, da maior para a menor. */
function weightedEntries(
  scores: SubjectScores,
): { subject: AcademicSubject; element: PlayableElement; weightedScore: number }[] {
  return (Object.entries(scores) as [AcademicSubject, number][])
    .filter(([, score]) => typeof score === 'number' && score > 0)
    .map(([subject, score]) => ({
      subject,
      element: SUBJECT_ELEMENT_MAP[subject].element,
      weightedScore: score * SUBJECT_WEIGHTS[subject],
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore);
}

/** Soma dos bônus conquistados no dia. */
export function calculateBonuses(flags: {
  streak7Days?: boolean;
  earlyCompletion?: boolean;
  allSubjects?: boolean;
  behaviorAllDone?: boolean;
}): Bonuses {
  const streak7Days = flags.streak7Days ?? false;
  const earlyCompletion = flags.earlyCompletion ?? false;
  const allSubjects = flags.allSubjects ?? false;
  const behaviorAllDone = flags.behaviorAllDone ?? false;

  const total =
    (streak7Days ? BONUS_STREAK_7_DAYS : 0) +
    (earlyCompletion ? BONUS_EARLY_COMPLETION : 0) +
    (allSubjects ? BONUS_ALL_SUBJECTS : 0) +
    (behaviorAllDone ? BONUS_BEHAVIOR_ALL_DONE : 0);

  return { streak7Days, earlyCompletion, allSubjects, behaviorAllDone, total };
}

/**
 * XP total do dia.
 * Comportamento não entra na soma ponderada — vale um bônus fixo quando aprovado.
 */
export function calculateDailyXP(
  scores: SubjectScores,
  bonuses: Bonuses,
  behaviorApproved: boolean,
  /** Multiplicador do plano de assinatura (bundle dá +20%). */
  xpMultiplier = 1,
): number {
  const weightedScore = weightedEntries(scores).reduce(
    (acc, { weightedScore: ws }) => acc + ws,
    0,
  );

  const behaviorXP = behaviorApproved ? BONUS_BEHAVIOR_COMPLETE : 0;

  return Math.round((weightedScore + behaviorXP + bonuses.total) * xpMultiplier);
}

/**
 * Elemento primário do dia.
 * Luz vence quando não houve atividade acadêmica mas o comportamento foi aprovado —
 * é o que permite gerar Crion em fins de semana e férias.
 */
export function determinePrimaryElement(
  scores: SubjectScores,
  behaviorApproved: boolean,
): PlayableElement | null {
  const ranked = weightedEntries(scores);

  if (ranked.length === 0) {
    return behaviorApproved ? 'LIGHT' : null;
  }

  return ranked[0].element;
}

/**
 * Elemento secundário — só existe se a 2ª matéria ficou a menos de
 * HYBRID_THRESHOLD pontos ponderados da 1ª.
 */
export function determineSecondaryElement(
  scores: SubjectScores,
  primary: PlayableElement,
): PlayableElement | null {
  const ranked = weightedEntries(scores);
  if (ranked.length === 0) return null;

  const primaryScore = ranked[0].weightedScore;
  const runnerUp = ranked.find(({ element }) => element !== primary);
  if (!runnerUp) return null;

  return primaryScore - runnerUp.weightedScore < HYBRID_THRESHOLD
    ? runnerUp.element
    : null;
}
