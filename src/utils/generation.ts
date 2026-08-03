/**
 * Algoritmo de geração do Crion do dia.
 *
 * Desempenho do dia → raridade → elemento → Crion → slot de ataque → carta.
 *
 * Duas decisões definem qual monstro nasce:
 *  - a PRIMEIRA atividade concluída define o elemento (o que a criança atacou
 *    primeiro define a identidade do dia — "aula dada, aula estudada hoje");
 *  - a atividade MAIS RÁPIDA entra na semente que sorteia a criatura dentro
 *    daquele elemento e raridade.
 */

import { CRIONS } from '@/data/crions';
import { RARITY_ORDER } from '@/constants/theme';
import { SUBJECT_ELEMENT_MAP } from '@/constants/game';
import type {
  AcademicSubject,
  AttackSlot,
  Bonuses,
  Crion,
  CrionCardData,
  DayPerformance,
  Element,
  ElementContribution,
  FinalStats,
  PlayableElement,
  Rarity,
  Subject,
  SubjectScores,
  Tier,
} from '@/types';
import { capRarity, determineRarity } from './rarity';
import { buildContributions, calculateFinalStats } from './stats';
import {
  calculateDailyXP,
  determinePrimaryElement,
  determineSecondaryElement,
} from './xp';

const TIER_ORDER: Tier[] = ['TIER_1', 'TIER_2', 'TIER_3', 'TIER_4'];

/** Crions elegíveis: até o tier da criança e nunca de Gelo (só inimigos usam Gelo). */
function eligibleCrions(element: Element, rarity: Rarity, tier: Tier): Crion[] {
  const maxTierIndex = TIER_ORDER.indexOf(tier);

  return CRIONS.filter(
    (c) =>
      c.element === element &&
      c.rarity === rarity &&
      c.element !== 'ICE_NPC' &&
      TIER_ORDER.indexOf(c.tier) <= maxTierIndex,
  );
}

/**
 * Escolhe um Crion do elemento e raridade pedidos.
 *
 * A faixa etária filtra o acervo do dia a dia, mas não pode confiscar uma
 * raridade que a criança conquistou: os Lendários vivem no TIER_4, e sem essa
 * exceção uma criança do 1º ano nunca receberia a carta do dia perfeito.
 * Por isso a busca é, nesta ordem:
 *   1. a raridade pedida dentro da faixa;
 *   2. a raridade pedida em qualquer faixa — o mérito vale mais que a idade;
 *   3. só então desce a raridade, para nunca deixar a criança sem carta.
 */
export function selectCrion(
  element: PlayableElement,
  rarity: Rarity,
  tier: Tier,
  /** Semente para escolha determinística. */
  seed: number,
): Crion | null {
  const inTier = eligibleCrions(element, rarity, tier);
  if (inTier.length > 0) return inTier[seed % inTier.length];

  const anyTier = eligibleCrions(element, rarity, 'TIER_4');
  if (anyTier.length > 0) return anyTier[seed % anyTier.length];

  for (let i = RARITY_ORDER.indexOf(rarity) - 1; i >= 0; i--) {
    const pool = eligibleCrions(element, RARITY_ORDER[i], tier);
    if (pool.length > 0) return pool[seed % pool.length];
  }
  return null;
}

/** Slot de ataque desbloqueado pelo XP do dia — o mais alto que o XP alcança. */
export function selectAttackSlot(crion: Crion, xp: number): AttackSlot {
  const unlocked = crion.attacks
    .filter((a) => xp >= a.unlockXP)
    .sort((a, b) => b.slot - a.slot);

  return unlocked.length > 0 ? unlocked[0].slot : 1;
}

/** Converte um texto em um inteiro estável, usado como semente. */
function hashSeed(raw: string): number {
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Uma atividade concluída, do ponto de vista da geração. */
export interface CompletedActivity {
  subject: AcademicSubject;
  /** ISO 8601 — quando a criança marcou como concluída. */
  completedAt?: string;
  /** Tempo gasto na atividade, em segundos. */
  durationSeconds?: number;
}

/** A primeira atividade que a criança concluiu no dia. */
export function firstCompleted(
  activities: CompletedActivity[],
): CompletedActivity | null {
  const withTime = activities.filter((a) => a.completedAt);
  if (withTime.length === 0) return activities[0] ?? null;

  return withTime.reduce((earliest, current) =>
    new Date(current.completedAt!).getTime() < new Date(earliest.completedAt!).getTime()
      ? current
      : earliest,
  );
}

/** A atividade que a criança terminou mais rápido no dia. */
export function fastestCompleted(
  activities: CompletedActivity[],
): CompletedActivity | null {
  const timed = activities.filter(
    (a) => typeof a.durationSeconds === 'number' && a.durationSeconds > 0,
  );
  if (timed.length === 0) return activities[0] ?? null;

  return timed.reduce((fastest, current) =>
    current.durationSeconds! < fastest.durationSeconds! ? current : fastest,
  );
}

export interface GenerationInput {
  childId: string;
  childName: string;
  tier: Tier;
  /** 'YYYY-MM-DD' */
  date: string;
  scores: SubjectScores;
  bonuses: Bonuses;
  behaviorApproved: boolean;
  /** Atividades aprovadas do dia, com horário e duração. */
  activities: CompletedActivity[];
  /** Como o dia se saiu — define a raridade. */
  performance: DayPerformance;
  /** Teto de raridade do plano de assinatura. */
  maxRarity?: Rarity;
  /** Multiplicador de XP do plano. */
  xpMultiplier?: number;
}

export interface GenerationResult {
  card: CrionCardData;
  crion: Crion;
  xp: number;
  rarity: Rarity;
  foil: boolean;
  contributions: ElementContribution[];
  stats: FinalStats;
  element: PlayableElement;
  secondaryElement: PlayableElement | null;
  attackSlot: AttackSlot;
  perfectDay: boolean;
  completionRate: number;
}

/**
 * Gera o Crion do dia.
 * Retorna null quando não houve nem atividade acadêmica nem comportamento
 * aprovado — sem desempenho, não nasce Crion.
 */
export function generateDailyCrion(input: GenerationInput): GenerationResult | null {
  const {
    childId,
    childName,
    tier,
    date,
    scores,
    bonuses,
    behaviorApproved,
    activities,
    performance,
    maxRarity = 'LEGENDARY',
    xpMultiplier = 1,
  } = input;

  const element = resolveElement(activities, scores, behaviorApproved);
  if (!element) return null;

  const xp = calculateDailyXP(scores, bonuses, behaviorApproved, xpMultiplier);

  const outcome = determineRarity(performance);
  const rarity = capRarity(outcome.rarity, maxRarity);
  // A holografia acompanha o dia perfeito, mas só se o plano alcança o topo.
  const foil = outcome.foil && rarity === outcome.rarity;

  const secondaryElement = determineSecondaryElement(scores, element);

  // A atividade mais rápida entra na semente: dias iguais em nota, mas com
  // ritmos diferentes, produzem criaturas diferentes.
  const fastest = fastestCompleted(activities);
  const seed = hashSeed(
    `${date}:${childId}:${fastest?.subject ?? 'none'}:${fastest?.durationSeconds ?? 0}`,
  );

  const crion = selectCrion(element, rarity, tier, seed);
  if (!crion) return null;

  const attackSlot = selectAttackSlot(crion, xp);
  const primarySubject = resolvePrimarySubject(activities, scores, behaviorApproved);

  // A carta carrega as matérias que a alimentaram e os atributos já somados,
  // para poder ser reexibida depois sem recalcular nada.
  const contributions = buildContributions(scores, element, behaviorApproved);
  const stats = calculateFinalStats(crion, rarity, xp);

  const card: CrionCardData = {
    id: `card_${childId}_${date}`,
    crionId: crion.id,
    childId,
    date,
    attackSlot,
    rarity,
    element,
    ...(secondaryElement ? { secondaryElement } : {}),
    xp,
    primarySubject,
    childName,
    foil,
    completionRate: outcome.completionRate,
    streak: performance.streak,
    contributions,
    stats,
  };

  return {
    card,
    crion,
    xp,
    rarity,
    foil,
    contributions,
    stats,
    element,
    secondaryElement,
    attackSlot,
    perfectDay: outcome.perfectDay,
    completionRate: outcome.completionRate,
  };
}

/**
 * Elemento do dia: a primeira atividade concluída manda.
 * Sem atividade acadêmica, cai para Luz se o comportamento foi aprovado.
 */
function resolveElement(
  activities: CompletedActivity[],
  scores: SubjectScores,
  behaviorApproved: boolean,
): PlayableElement | null {
  const first = firstCompleted(activities);
  if (first) return SUBJECT_ELEMENT_MAP[first.subject].element;

  return determinePrimaryElement(scores, behaviorApproved);
}

/** Matéria exibida no rodapé — a mesma que definiu o elemento. */
function resolvePrimarySubject(
  activities: CompletedActivity[],
  scores: SubjectScores,
  behaviorApproved: boolean,
): Subject {
  const first = firstCompleted(activities);
  if (first) return first.subject;

  const entries = Object.entries(scores).filter(
    ([, score]) => typeof score === 'number' && score > 0,
  ) as [Subject, number][];

  if (entries.length === 0 && behaviorApproved) return 'comportamento';
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

/** Busca um Crion pelo id — usado ao reidratar cartas salvas. */
export function findCrionById(id: string): Crion | undefined {
  return CRIONS.find((c) => c.id === id);
}
