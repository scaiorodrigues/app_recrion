/**
 * Identidade visual do Recrion.
 */

import type { Element, Rarity, Tier } from '@/types';

export const THEME = {
  colors: {
    primary: '#7C3AED',
    secondary: '#F59E0B',
    background: '#FFF8E7',
    card: '#FFFFFF',
    text: '#1F2937',
    textLight: '#6B7280',
    border: '#E5E7EB',
    success: '#22C55E',
    danger: '#EF4444',
  },
  fonts: {
    display: 'BubbleGumSans',
    body: 'Nunito',
  },
  borderRadius: {
    card: 20,
    button: 12,
    input: 10,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;

export interface ElementTheme {
  bg: string;
  accent: string;
  glow: string;
  /** Gradiente do card, do topo para a base. */
  gradient: [string, string];
}

export const ELEMENT_THEME: Record<Element, ElementTheme> = {
  NATURE: { bg: '#DCFCE7', accent: '#16A34A', glow: '#22C55E', gradient: ['#DCFCE7', '#86EFAC'] },
  FIRE: { bg: '#FEE2E2', accent: '#DC2626', glow: '#EF4444', gradient: ['#FEE2E2', '#FCA5A5'] },
  WATER: { bg: '#DBEAFE', accent: '#1D4ED8', glow: '#3B82F6', gradient: ['#DBEAFE', '#93C5FD'] },
  EARTH: { bg: '#FEF9C3', accent: '#A16207', glow: '#CA8A04', gradient: ['#FEF9C3', '#FDE047'] },
  METAL: { bg: '#F3F4F6', accent: '#4B5563', glow: '#6B7280', gradient: ['#F3F4F6', '#D1D5DB'] },
  WIND: { bg: '#EDE9FE', accent: '#6D28D9', glow: '#8B5CF6', gradient: ['#EDE9FE', '#C4B5FD'] },
  ELECTRIC: { bg: '#FEF3C7', accent: '#B45309', glow: '#F59E0B', gradient: ['#FEF3C7', '#FCD34D'] },
  LIGHT: { bg: '#FEFCE8', accent: '#CA8A04', glow: '#FDE047', gradient: ['#FEFCE8', '#FDE68A'] },
  ICE_NPC: { bg: '#E0F2FE', accent: '#0369A1', glow: '#0EA5E9', gradient: ['#E0F2FE', '#7DD3FC'] },
  LEGENDARY: { bg: '#FFF7ED', accent: '#C2410C', glow: '#F97316', gradient: ['#FFF7ED', '#FDBA74'] },
};

export const RARITY_THRESHOLDS: Record<
  Rarity,
  { min: number; max: number; label: string; color: string; stars: number }
> = {
  COMMON: { min: 0, max: 39, label: 'Comum', color: '#9CA3AF', stars: 1 },
  UNCOMMON: { min: 40, max: 59, label: 'Incomum', color: '#22C55E', stars: 2 },
  RARE: { min: 60, max: 79, label: 'Raro', color: '#3B82F6', stars: 3 },
  EPIC: { min: 80, max: 94, label: 'Épico', color: '#8B5CF6', stars: 4 },
  LEGENDARY: { min: 95, max: 999, label: 'Lendário', color: '#F59E0B', stars: 5 },
};

export const TIER_INFO: Record<
  Tier,
  { label: string; emoji: string; schoolYear: string; minAge: number; maxAge: number }
> = {
  TIER_1: { label: 'Broto', emoji: '🌱', schoolYear: '1º ano', minAge: 6, maxAge: 7 },
  TIER_2: { label: 'Folha', emoji: '🌿', schoolYear: '2º ano', minAge: 7, maxAge: 8 },
  TIER_3: { label: 'Raiz', emoji: '🌳', schoolYear: '3º ano', minAge: 8, maxAge: 9 },
  TIER_4: { label: 'Copa', emoji: '🌟', schoolYear: '4º ano', minAge: 9, maxAge: 10 },
};
