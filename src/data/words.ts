/**
 * Banco de palavras da atividade de Português, por faixa etária.
 * A separação silábica é declarada à mão — regras automáticas erram
 * em ditongos e dígrafos do português.
 */

import type { Tier } from '@/types';

export interface WordEntry {
  id: string;
  word: string;
  emoji: string;
  /** Sílabas separadas, ex: ['bor', 'bo', 'le', 'ta'] */
  syllables: string[];
}

export const WORDS_BY_TIER: Record<Tier, WordEntry[]> = {
  TIER_1: [
    { id: 'w_gato', word: 'gato', emoji: '🐱', syllables: ['ga', 'to'] },
    { id: 'w_casa', word: 'casa', emoji: '🏠', syllables: ['ca', 'sa'] },
    { id: 'w_bola', word: 'bola', emoji: '⚽', syllables: ['bo', 'la'] },
    { id: 'w_sapo', word: 'sapo', emoji: '🐸', syllables: ['sa', 'po'] },
    { id: 'w_pato', word: 'pato', emoji: '🦆', syllables: ['pa', 'to'] },
    { id: 'w_uva', word: 'uva', emoji: '🍇', syllables: ['u', 'va'] },
    { id: 'w_lua', word: 'lua', emoji: '🌙', syllables: ['lu', 'a'] },
    { id: 'w_pao', word: 'pão', emoji: '🍞', syllables: ['pão'] },
    { id: 'w_sol', word: 'sol', emoji: '☀️', syllables: ['sol'] },
    { id: 'w_peixe', word: 'peixe', emoji: '🐟', syllables: ['pei', 'xe'] },
    { id: 'w_flor', word: 'flor', emoji: '🌸', syllables: ['flor'] },
    { id: 'w_bolo', word: 'bolo', emoji: '🎂', syllables: ['bo', 'lo'] },
  ],
  TIER_2: [
    { id: 'w_elefante', word: 'elefante', emoji: '🐘', syllables: ['e', 'le', 'fan', 'te'] },
    { id: 'w_borboleta', word: 'borboleta', emoji: '🦋', syllables: ['bor', 'bo', 'le', 'ta'] },
    { id: 'w_cachorro', word: 'cachorro', emoji: '🐶', syllables: ['ca', 'chor', 'ro'] },
    { id: 'w_banana', word: 'banana', emoji: '🍌', syllables: ['ba', 'na', 'na'] },
    { id: 'w_girafa', word: 'girafa', emoji: '🦒', syllables: ['gi', 'ra', 'fa'] },
    { id: 'w_janela', word: 'janela', emoji: '🪟', syllables: ['ja', 'ne', 'la'] },
    { id: 'w_cavalo', word: 'cavalo', emoji: '🐴', syllables: ['ca', 'va', 'lo'] },
    { id: 'w_abacaxi', word: 'abacaxi', emoji: '🍍', syllables: ['a', 'ba', 'ca', 'xi'] },
    { id: 'w_sorvete', word: 'sorvete', emoji: '🍦', syllables: ['sor', 've', 'te'] },
    { id: 'w_foguete', word: 'foguete', emoji: '🚀', syllables: ['fo', 'gue', 'te'] },
  ],
  TIER_3: [
    { id: 'w_tartaruga', word: 'tartaruga', emoji: '🐢', syllables: ['tar', 'ta', 'ru', 'ga'] },
    { id: 'w_computador', word: 'computador', emoji: '💻', syllables: ['com', 'pu', 'ta', 'dor'] },
    { id: 'w_bicicleta', word: 'bicicleta', emoji: '🚲', syllables: ['bi', 'ci', 'cle', 'ta'] },
    { id: 'w_dinossauro', word: 'dinossauro', emoji: '🦕', syllables: ['di', 'nos', 'sau', 'ro'] },
    { id: 'w_geladeira', word: 'geladeira', emoji: '🧊', syllables: ['ge', 'la', 'dei', 'ra'] },
    { id: 'w_telefone', word: 'telefone', emoji: '📞', syllables: ['te', 'le', 'fo', 'ne'] },
    { id: 'w_biblioteca', word: 'biblioteca', emoji: '📚', syllables: ['bi', 'bli', 'o', 'te', 'ca'] },
    { id: 'w_helicoptero', word: 'helicóptero', emoji: '🚁', syllables: ['he', 'li', 'cóp', 'te', 'ro'] },
  ],
  TIER_4: [
    { id: 'w_extraordinario', word: 'extraordinário', emoji: '🌟', syllables: ['ex', 'tra', 'or', 'di', 'ná', 'rio'] },
    { id: 'w_responsabilidade', word: 'responsabilidade', emoji: '🤝', syllables: ['res', 'pon', 'sa', 'bi', 'li', 'da', 'de'] },
    { id: 'w_imaginacao', word: 'imaginação', emoji: '💭', syllables: ['i', 'ma', 'gi', 'na', 'ção'] },
    { id: 'w_curiosidade', word: 'curiosidade', emoji: '🔍', syllables: ['cu', 'ri', 'o', 'si', 'da', 'de'] },
    { id: 'w_astronomia', word: 'astronomia', emoji: '🔭', syllables: ['as', 'tro', 'no', 'mi', 'a'] },
    { id: 'w_generosidade', word: 'generosidade', emoji: '💝', syllables: ['ge', 'ne', 'ro', 'si', 'da', 'de'] },
    { id: 'w_pensamento', word: 'pensamento', emoji: '🧠', syllables: ['pen', 'sa', 'men', 'to'] },
  ],
};

const VOWELS = 'aeiouáàâãéêíóôõúü';

/** Remove acentos para comparar o que a criança escreveu com o gabarito. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function isVowel(char: string): boolean {
  return VOWELS.includes(char.toLowerCase());
}

/** Gabarito dos 7 campos da atividade de sílabas. */
export interface WordAnswers {
  fullWord: string;
  firstLetter: string;
  lastLetter: string;
  firstVowel: string;
  lastVowel: string;
  letterCount: number;
  syllableCount: number;
}

export function answersFor(entry: WordEntry): WordAnswers {
  const letters = [...entry.word];
  const vowels = letters.filter(isVowel);

  return {
    fullWord: entry.word,
    firstLetter: letters[0],
    lastLetter: letters[letters.length - 1],
    firstVowel: vowels[0] ?? '',
    lastVowel: vowels[vowels.length - 1] ?? '',
    letterCount: letters.length,
    syllableCount: entry.syllables.length,
  };
}

export function wordsForTier(tier: Tier): WordEntry[] {
  return WORDS_BY_TIER[tier];
}

export default WORDS_BY_TIER;
