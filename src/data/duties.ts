/**
 * Lista sugerida de obrigações por categoria e faixa etária.
 * O pai escolhe quais ativar e pode criar as suas próprias.
 */

import type { SuggestedDuty } from '@/types';

const ALL_TIERS = ['TIER_1', 'TIER_2', 'TIER_3', 'TIER_4'] as const;

export const SUGGESTED_DUTIES: SuggestedDuty[] = [
  // HIGIENE
  { id: 'h1', category: 'HYGIENE', label: 'Escovar os dentes (manhã)', emoji: '🦷', tiers: [...ALL_TIERS] },
  { id: 'h2', category: 'HYGIENE', label: 'Escovar os dentes (noite)', emoji: '🦷', tiers: [...ALL_TIERS] },
  { id: 'h3', category: 'HYGIENE', label: 'Tomar banho', emoji: '🚿', tiers: [...ALL_TIERS] },
  { id: 'h4', category: 'HYGIENE', label: 'Lavar as mãos antes das refeições', emoji: '🧼', tiers: [...ALL_TIERS] },
  { id: 'h5', category: 'HYGIENE', label: 'Pentear o cabelo', emoji: '💆', tiers: [...ALL_TIERS] },
  { id: 'h6', category: 'HYGIENE', label: 'Trocar de roupa', emoji: '👕', tiers: [...ALL_TIERS] },

  // CASA
  { id: 'c1', category: 'HOME', label: 'Arrumar a cama', emoji: '🛏️', tiers: [...ALL_TIERS] },
  { id: 'c2', category: 'HOME', label: 'Organizar o quarto', emoji: '🧹', tiers: [...ALL_TIERS] },
  { id: 'c3', category: 'HOME', label: 'Guardar os brinquedos', emoji: '🧸', tiers: ['TIER_1', 'TIER_2'] },
  { id: 'c4', category: 'HOME', label: 'Colocar o prato na pia', emoji: '🍽️', tiers: [...ALL_TIERS] },
  { id: 'c5', category: 'HOME', label: 'Ajudar a pôr a mesa', emoji: '🥄', tiers: ['TIER_2', 'TIER_3', 'TIER_4'] },
  { id: 'c6', category: 'HOME', label: 'Separar o lixo reciclável', emoji: '♻️', tiers: ['TIER_3', 'TIER_4'] },
  { id: 'c7', category: 'HOME', label: 'Guardar as roupas dobradas', emoji: '👗', tiers: ['TIER_3', 'TIER_4'] },
  { id: 'c8', category: 'HOME', label: 'Cuidar do pet', emoji: '🐾', tiers: ['TIER_2', 'TIER_3', 'TIER_4'] },

  // ESTUDO
  { id: 'e1', category: 'STUDY', label: 'Fazer a lição de casa', emoji: '📝', tiers: [...ALL_TIERS] },
  { id: 'e2', category: 'STUDY', label: 'Organizar a mochila para amanhã', emoji: '🎒', tiers: [...ALL_TIERS] },
  { id: 'e3', category: 'STUDY', label: 'Ler por 15 minutos', emoji: '📖', tiers: [...ALL_TIERS] },
  { id: 'e4', category: 'STUDY', label: 'Revisar o caderno do dia', emoji: '📓', tiers: ['TIER_2', 'TIER_3', 'TIER_4'] },
  { id: 'e5', category: 'STUDY', label: 'Assistir aula sem distrações', emoji: '🖥️', tiers: ['TIER_3', 'TIER_4'] },

  // CONVIVÊNCIA
  { id: 's1', category: 'SOCIAL', label: 'Falar "bom dia" e "boa noite"', emoji: '👋', tiers: [...ALL_TIERS] },
  { id: 's2', category: 'SOCIAL', label: 'Dividir com os irmãos', emoji: '🤗', tiers: [...ALL_TIERS] },
  { id: 's3', category: 'SOCIAL', label: 'Falar "obrigado" e "por favor"', emoji: '🙏', tiers: [...ALL_TIERS] },
  { id: 's4', category: 'SOCIAL', label: 'Não interromper os adultos', emoji: '🤫', tiers: ['TIER_2', 'TIER_3', 'TIER_4'] },
  { id: 's5', category: 'SOCIAL', label: 'Ajudar alguém da família', emoji: '💛', tiers: [...ALL_TIERS] },
  { id: 's6', category: 'SOCIAL', label: 'Resolver conflitos sem gritar', emoji: '☮️', tiers: ['TIER_2', 'TIER_3', 'TIER_4'] },

  // SAÚDE
  { id: 'sa1', category: 'HEALTH', label: 'Comer frutas ou legumes', emoji: '🥦', tiers: [...ALL_TIERS] },
  { id: 'sa2', category: 'HEALTH', label: 'Beber água ao longo do dia', emoji: '💧', tiers: [...ALL_TIERS] },
  { id: 'sa3', category: 'HEALTH', label: 'Dormir no horário combinado', emoji: '😴', tiers: [...ALL_TIERS] },
  { id: 'sa4', category: 'HEALTH', label: 'Fazer atividade física / brincar', emoji: '🏃', tiers: [...ALL_TIERS] },
  { id: 'sa5', category: 'HEALTH', label: 'Limitar o tempo de tela', emoji: '📵', tiers: ['TIER_2', 'TIER_3', 'TIER_4'] },
];

export default SUGGESTED_DUTIES;
