/**
 * Algoritmo de geração do Crion do dia.
 * XP → elemento → raridade → Crion → slot de ataque → carta.
 */

import { CRIONS } from '@/data/crions';
import type {
  AttackSlot,
  Bonuses,
  Crion,
  CrionCardData,
  Element,
  PlayableElement,
  Rarity,
  Subject,
  SubjectScores,
  Tier,
} from '@/types';
import {
  calculateDailyXP,
  capRarity,
  determinePrimaryElement,
  determineSecondaryElement,
  xpToRarity,
} from './xp';

const TIER_ORDER: Tier[] = ['TIER_1', 'TIER_2', 'TIER_3', 'TIER_4'];
const RARITY_ORDER: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

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
 * Se nada casar exatamente, desce a raridade até achar algo elegível —
 * assim a criança nunca fica sem carta no fim do dia.
 */
export function selectCrion(
  element: PlayableElement,
  rarity: Rarity,
  tier: Tier,
  /** Semente para escolha determinística (mesma data → mesmo Crion). */
  seed: number,
): Crion | null {
  for (let i = RARITY_ORDER.indexOf(rarity); i >= 0; i--) {
    const pool = eligibleCrions(element, RARITY_ORDER[i], tier);
    if (pool.length > 0) {
      return pool[seed % pool.length];
    }
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

/** Converte 'YYYY-MM-DD' em um inteiro estável, usado como semente. */
function seedFromDate(date: string, childId: string): number {
  const raw = `${date}:${childId}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
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
  /** Teto de raridade do plano de assinatura. */
  maxRarity?: Rarity;
  /** Multiplicador de XP do plano (bundle = 1.2). */
  xpMultiplier?: number;
}

export interface GenerationResult {
  card: CrionCardData;
  crion: Crion;
  xp: number;
  rarity: Rarity;
  element: PlayableElement;
  secondaryElement: PlayableElement | null;
  attackSlot: AttackSlot;
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
    maxRarity = 'LEGENDARY',
    xpMultiplier = 1,
  } = input;

  const element = determinePrimaryElement(scores, behaviorApproved);
  if (!element) return null;

  const xp = calculateDailyXP(scores, bonuses, behaviorApproved, xpMultiplier);
  const rarity = capRarity(xpToRarity(xp), maxRarity);
  const secondaryElement = determineSecondaryElement(scores, element);

  const seed = seedFromDate(date, childId);
  const crion = selectCrion(element, rarity, tier, seed);
  if (!crion) return null;

  const attackSlot = selectAttackSlot(crion, xp);
  const primarySubject = dominantSubject(scores, behaviorApproved);

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
  };

  return { card, crion, xp, rarity, element, secondaryElement, attackSlot };
}

/** Matéria que mais contribuiu no dia — exibida no rodapé da carta. */
function dominantSubject(scores: SubjectScores, behaviorApproved: boolean): Subject {
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
