/**
 * Faixa etária a partir da data de nascimento e códigos de convite.
 */

import type { Tier } from '@/types';

/** Idade em anos completos na data de referência. */
export function ageFromBirthDate(birthDate: string, reference = new Date()): number {
  const [year, month, day] = birthDate.split('-').map(Number);
  const birth = new Date(year, month - 1, day);

  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Faixa escolar pela idade.
 * Abaixo de 7 entra em Broto e acima de 9 em Copa — assim nenhuma criança
 * cadastrada fica sem tier atribuído.
 */
export function tierFromAge(age: number): Tier {
  if (age <= 6) return 'TIER_1';
  if (age === 7) return 'TIER_2';
  if (age === 8) return 'TIER_3';
  return 'TIER_4';
}

export function tierFromBirthDate(birthDate: string, reference = new Date()): Tier {
  return tierFromAge(ageFromBirthDate(birthDate, reference));
}

/** Alfabeto sem caracteres ambíguos (0/O, 1/I) — o código é lido em voz alta. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const INVITE_VALIDITY_DAYS = 7;

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function inviteExpiryDate(from = new Date()): string {
  const expiry = new Date(from);
  expiry.setDate(expiry.getDate() + INVITE_VALIDITY_DAYS);
  return expiry.toISOString();
}

export function isInviteExpired(expiresAt: string, reference = new Date()): boolean {
  return new Date(expiresAt).getTime() < reference.getTime();
}

/** 'YYYY-MM-DD' no fuso local — a chave usada em todos os registros diários. */
export function today(reference = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, '0');
  const day = String(reference.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formata 'YYYY-MM-DD' para 'DD/MM/YYYY'. */
export function formatDateBR(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}
