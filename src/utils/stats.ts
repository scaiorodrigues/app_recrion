/**
 * Atributos finais da carta.
 *
 * O Crion traz os valores base; o desempenho do dia soma por cima. Dois dias
 * com o mesmo Crion produzem cartas com números diferentes — é o que dá
 * sentido a colecionar a mesma criatura mais de uma vez.
 */

import { RARITY_ORDER } from '@/constants/theme';
import { SUBJECT_ELEMENT_MAP, SUBJECT_WEIGHTS } from '@/constants/game';
import type {
  AcademicSubject,
  Crion,
  ElementContribution,
  FinalStats,
  PlayableElement,
  Rarity,
  Subject,
  SubjectScores,
} from '@/types';

/** Quanto cada degrau de raridade acrescenta a ataque e defesa. */
const RARITY_STEP_BONUS = 4;

/** Teto do ganho vindo do XP do dia, para os números não escaparem da arte. */
const MAX_XP_BONUS = 20;

/** Divisor que converte XP do dia em pontos de atributo. */
const XP_PER_POINT = 12;

/**
 * Atributos finais = base do Crion + degrau da raridade + XP do dia.
 * O ataque recebe o ganho cheio; a defesa, metade — cartas de dia bom são
 * mais agressivas do que resistentes.
 */
export function calculateFinalStats(
  crion: Crion,
  rarity: Rarity,
  xp: number,
): FinalStats {
  const rarityBonus = RARITY_ORDER.indexOf(rarity) * RARITY_STEP_BONUS;
  const xpBonus = Math.min(MAX_XP_BONUS, Math.floor(xp / XP_PER_POINT));

  const bonusAtk = rarityBonus + xpBonus;
  const bonusDef = Math.floor((rarityBonus + xpBonus) / 2);

  return {
    hp: crion.baseHP + bonusAtk,
    atk: crion.baseAtk + bonusAtk,
    def: crion.baseDef + bonusDef,
    spd: crion.baseSpd + Math.floor(xpBonus / 2),
    bonusAtk,
    bonusDef,
  };
}

/**
 * Traduz as notas do dia na lista de matérias exibida na carta,
 * da que mais contribuiu para a que menos contribuiu.
 */
export function buildContributions(
  scores: SubjectScores,
  primaryElement: PlayableElement,
  behaviorApproved: boolean,
  /** XP fixo que o comportamento aprovado vale, para exibir a Luz. */
  lightValue = 100,
): ElementContribution[] {
  const academic = (Object.entries(scores) as [AcademicSubject, number][])
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([subject, value]) => ({
      subject: subject as Subject,
      element: SUBJECT_ELEMENT_MAP[subject].element,
      value,
      weighted: value * SUBJECT_WEIGHTS[subject],
    }))
    .sort((a, b) => b.weighted - a.weighted);

  const list: ElementContribution[] = academic.map(({ subject, element, value }) => ({
    subject,
    element,
    value,
    primary: element === primaryElement,
  }));

  // Comportamento não tem nota: entra como presença de Luz quando aprovado.
  if (behaviorApproved) {
    list.push({
      subject: 'comportamento',
      element: 'LIGHT',
      value: lightValue,
      primary: primaryElement === 'LIGHT',
    });
  }

  // Garante que a matéria do elemento da carta apareça em primeiro lugar.
  return list.sort((a, b) => Number(b.primary) - Number(a.primary));
}
