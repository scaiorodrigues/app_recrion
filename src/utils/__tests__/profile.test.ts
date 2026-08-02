import {
  ageFromBirthDate,
  formatDateBR,
  generateInviteCode,
  inviteExpiryDate,
  isInviteExpired,
  tierFromAge,
  tierFromBirthDate,
  today,
} from '@/utils/profile';

const REFERENCE = new Date(2026, 7, 2); // 2 de agosto de 2026

describe('ageFromBirthDate', () => {
  it('calcula a idade em anos completos', () => {
    expect(ageFromBirthDate('2019-08-02', REFERENCE)).toBe(7);
  });

  it('não conta o aniversário que ainda não chegou', () => {
    expect(ageFromBirthDate('2019-08-03', REFERENCE)).toBe(6);
  });
});

describe('tierFromAge', () => {
  it.each([
    [5, 'TIER_1'],
    [6, 'TIER_1'],
    [7, 'TIER_2'],
    [8, 'TIER_3'],
    [9, 'TIER_4'],
    [10, 'TIER_4'],
  ])('idade %i vira %s', (age, expected) => {
    expect(tierFromAge(age)).toBe(expected);
  });
});

describe('tierFromBirthDate', () => {
  it('deriva o tier da data de nascimento', () => {
    expect(tierFromBirthDate('2018-01-10', REFERENCE)).toBe('TIER_3');
  });
});

describe('generateInviteCode', () => {
  it('gera 6 caracteres sem símbolos ambíguos', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    }
  });
});

describe('isInviteExpired', () => {
  it('considera válido um convite recém-criado', () => {
    expect(isInviteExpired(inviteExpiryDate(REFERENCE), REFERENCE)).toBe(false);
  });

  it('expira depois de 7 dias', () => {
    const eightDaysLater = new Date(REFERENCE);
    eightDaysLater.setDate(eightDaysLater.getDate() + 8);
    expect(isInviteExpired(inviteExpiryDate(REFERENCE), eightDaysLater)).toBe(true);
  });
});

describe('today', () => {
  it('formata a data local como YYYY-MM-DD', () => {
    expect(today(REFERENCE)).toBe('2026-08-02');
  });
});

describe('formatDateBR', () => {
  it('converte para o formato brasileiro', () => {
    expect(formatDateBR('2026-08-02')).toBe('02/08/2026');
  });
});
