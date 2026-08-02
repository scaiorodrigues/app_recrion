/**
 * Regras de jogo: matérias, elementos, pesos, bônus e limites diários.
 */

import type {
  AcademicSubject,
  BehaviorCategory,
  BehaviorCategoryId,
  Element,
  PlayableElement,
  Subject,
  Tier,
} from '@/types';

export const SUBJECT_ELEMENT_MAP: Record<
  Subject,
  { element: PlayableElement; emoji: string; color: string; label: string; subjectLabel: string }
> = {
  portugues: { element: 'NATURE', emoji: '🌿', color: '#22C55E', label: 'Natureza', subjectLabel: 'Português' },
  matematica: { element: 'FIRE', emoji: '🔥', color: '#EF4444', label: 'Fogo', subjectLabel: 'Matemática' },
  ingles: { element: 'WATER', emoji: '💧', color: '#3B82F6', label: 'Água', subjectLabel: 'Inglês' },
  ciencias: { element: 'EARTH', emoji: '🌍', color: '#A16207', label: 'Terra', subjectLabel: 'Ciências' },
  logica: { element: 'METAL', emoji: '⚙️', color: '#6B7280', label: 'Metal', subjectLabel: 'Lógica' },
  arte: { element: 'WIND', emoji: '🌪️', color: '#8B5CF6', label: 'Vento', subjectLabel: 'Arte' },
  musica: { element: 'ELECTRIC', emoji: '⚡', color: '#F59E0B', label: 'Elétrico', subjectLabel: 'Música' },
  comportamento: { element: 'LIGHT', emoji: '✨', color: '#FDE68A', label: 'Luz', subjectLabel: 'Comportamento' },
};

/** Pesos por matéria no cálculo de XP. Comportamento é validação binária, sem peso. */
export const SUBJECT_WEIGHTS: Record<AcademicSubject, number> = {
  portugues: 1.2,
  matematica: 1.2,
  ingles: 1.0,
  ciencias: 1.0,
  logica: 1.0,
  arte: 0.8,
  musica: 0.8,
};

export const BONUS_STREAK_7_DAYS = 50;
export const BONUS_EARLY_COMPLETION = 20;
export const BONUS_ALL_SUBJECTS = 30;
export const BONUS_BEHAVIOR_COMPLETE = 40;
export const BONUS_BEHAVIOR_ALL_DONE = 20;

/** Alias semânticos usados pelo módulo de comportamento. */
export const LIGHT_BONUS_XP = BONUS_BEHAVIOR_COMPLETE;
export const LIGHT_ALL_DONE_BONUS = BONUS_BEHAVIOR_ALL_DONE;

/** Hora limite para o bônus de conclusão antecipada. */
export const EARLY_COMPLETION_HOUR = 18;

/**
 * Tabela de resistências Wu Xing adaptada.
 * Luz é forte contra rigidez (Metal) e peso (Terra), e não tem fraqueza jogável.
 */
export const ELEMENT_CHART: Record<
  Element,
  { strongAgainst: Element[]; weakAgainst: Element[] }
> = {
  NATURE: { strongAgainst: ['EARTH', 'WATER'], weakAgainst: ['FIRE', 'METAL'] },
  FIRE: { strongAgainst: ['NATURE', 'WIND'], weakAgainst: ['WATER', 'EARTH'] },
  WATER: { strongAgainst: ['FIRE', 'EARTH'], weakAgainst: ['ELECTRIC', 'WIND'] },
  EARTH: { strongAgainst: ['WATER', 'ELECTRIC'], weakAgainst: ['NATURE', 'WIND'] },
  METAL: { strongAgainst: ['NATURE', 'WIND'], weakAgainst: ['FIRE', 'ELECTRIC'] },
  WIND: { strongAgainst: ['ELECTRIC', 'WATER'], weakAgainst: ['FIRE', 'NATURE'] },
  ELECTRIC: { strongAgainst: ['WATER', 'NATURE'], weakAgainst: ['METAL', 'WIND'] },
  LIGHT: { strongAgainst: ['METAL', 'EARTH'], weakAgainst: [] },
  ICE_NPC: { strongAgainst: ['WATER', 'FIRE'], weakAgainst: ['ELECTRIC', 'NATURE'] },
  LEGENDARY: { strongAgainst: [], weakAgainst: [] },
};

export const DAILY_ACTIVITY_RULES = {
  maxActivitiesPerDay: {
    TIER_1: 3,
    TIER_2: 3,
    TIER_3: 4,
    TIER_4: 5,
  } as Record<Tier, number>,
  /** Máximo 1 atividade por matéria por dia, em todos os tiers. */
  maxPerSubjectPerDay: 1,
  /** Pausa obrigatória entre atividades, em minutos. */
  breakBetweenActivitiesMinutes: 15,
  activityDurationMinutes: {
    TIER_1: { min: 5, max: 10 },
    TIER_2: { min: 8, max: 12 },
    TIER_3: { min: 10, max: 15 },
    TIER_4: { min: 12, max: 18 },
  } as Record<Tier, { min: number; max: number }>,
} as const;

export const BEHAVIOR_CATEGORIES: Record<BehaviorCategoryId, BehaviorCategory> = {
  HYGIENE: {
    id: 'HYGIENE',
    label: 'Higiene',
    emoji: '🪥',
    color: '#06B6D4',
    description: 'Cuidados pessoais e limpeza',
  },
  HOME: {
    id: 'HOME',
    label: 'Casa',
    emoji: '🏠',
    color: '#F59E0B',
    description: 'Tarefas e organização do lar',
  },
  STUDY: {
    id: 'STUDY',
    label: 'Estudo',
    emoji: '📚',
    color: '#8B5CF6',
    description: 'Responsabilidades escolares',
  },
  SOCIAL: {
    id: 'SOCIAL',
    label: 'Convivência',
    emoji: '🤝',
    color: '#22C55E',
    description: 'Relações com família e amigos',
  },
  HEALTH: {
    id: 'HEALTH',
    label: 'Saúde',
    emoji: '💪',
    color: '#EF4444',
    description: 'Alimentação, sono e exercício',
  },
};

/** Duração do teste gratuito, em dias corridos a partir do cadastro do filho. */
export const TRIAL_DAYS = 3;

/**
 * Matérias que já têm atividade pronta no app.
 * É esta lista que define o que "100% do dia" significa hoje — não adianta
 * exigir da criança uma matéria que ainda não existe.
 */
export const IMPLEMENTED_SUBJECTS: AcademicSubject[] = ['portugues'];

export const SUBSCRIPTION_PLANS = {
  /**
   * Teste gratuito de 3 dias com acesso TOTAL — todas as matérias, todas as
   * raridades, todos os mundos. A criança precisa ver o produto inteiro para
   * querer continuar. Os limites diários de atividade continuam valendo:
   * o teste é curto em dias, não permissivo em volume.
   */
  free: {
    trialDays: TRIAL_DAYS,
    activitiesPerSubject: 'unlimited',
    subjects: [
      'portugues', 'matematica', 'ingles', 'ciencias', 'logica', 'arte', 'musica',
    ] as AcademicSubject[],
    behavior: true,
    crionRarityMax: 'LEGENDARY',
    lightCrionIncluded: true,
    boardWorlds: 8,
  },
  subject: {
    price: 'R$ 9,90/mês',
    activitiesPerSubject: 'unlimited',
    behavior: true,
    crionRarityMax: 'EPIC',
    lightCrionIncluded: true,
  },
  bundle: {
    price: 'R$ 39,90/mês',
    allSubjects: true,
    behavior: true,
    crionRarityMax: 'LEGENDARY',
    lightCrionIncluded: true,
    bonusXP: 1.2,
    exclusiveCrions: true,
    behaviorInsights: true,
    bonusBehaviorXP: 1.3,
  },
} as const;
