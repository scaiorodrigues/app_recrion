/**
 * Mundos do tabuleiro. Cada mundo tem 10 quadrantes com um inimigo cada.
 */

import type { World } from '@/types';

export const QUADRANTS_PER_WORLD = 10;

export const WORLDS: World[] = [
  { id: 'w1', name: 'Floresta do Início', theme: 'forest', elements: ['NATURE', 'WATER'], minTier: 'TIER_1', requiresElement: null },
  { id: 'w2', name: 'Mar das Palavras', theme: 'ocean', elements: ['WATER', 'WIND'], minTier: 'TIER_1', requiresElement: null },
  { id: 'w3', name: 'Montanha dos Números', theme: 'volcano', elements: ['FIRE', 'EARTH'], minTier: 'TIER_2', requiresElement: null },
  { id: 'w4', name: 'Ilha dos Sons', theme: 'island', elements: ['ELECTRIC', 'WIND'], minTier: 'TIER_2', requiresElement: null },
  { id: 'w5', name: 'Caverna de Metal', theme: 'cave', elements: ['METAL', 'EARTH'], minTier: 'TIER_3', requiresElement: null },
  { id: 'w6', name: 'Tundra Gelada', theme: 'tundra', elements: ['ICE_NPC'], minTier: 'TIER_3', requiresElement: null },
  // Jardim Celestial: qualquer faixa entra, mas exige Crion de Luz no dia.
  { id: 'w7', name: 'Jardim Celestial', theme: 'celestial', elements: ['LIGHT'], minTier: 'TIER_1', requiresElement: 'LIGHT' },
  { id: 'w8', name: 'Torre Lendária', theme: 'tower', elements: ['LEGENDARY'], minTier: 'TIER_4', requiresElement: null },
];

export const WORLD_THEME_COLORS: Record<string, { bg: string; accent: string; emoji: string }> = {
  forest: { bg: '#DCFCE7', accent: '#16A34A', emoji: '🌲' },
  ocean: { bg: '#DBEAFE', accent: '#1D4ED8', emoji: '🌊' },
  volcano: { bg: '#FEE2E2', accent: '#DC2626', emoji: '🌋' },
  island: { bg: '#FEF3C7', accent: '#B45309', emoji: '🏝️' },
  cave: { bg: '#F3F4F6', accent: '#4B5563', emoji: '⛰️' },
  tundra: { bg: '#E0F2FE', accent: '#0369A1', emoji: '❄️' },
  celestial: { bg: '#FEFCE8', accent: '#CA8A04', emoji: '✨' },
  tower: { bg: '#FFF7ED', accent: '#C2410C', emoji: '🗼' },
};

export function worldById(id: string): World | undefined {
  return WORLDS.find((w) => w.id === id);
}

export default WORLDS;
