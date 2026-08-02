import type { DayPerformance } from '@/types';
import {
  capRarity,
  compareRarity,
  completionRateOf,
  determineRarity,
  isPerfectDay,
} from '@/utils/rarity';

function day(over: Partial<DayPerformance> = {}): DayPerformance {
  return {
    available: 3,
    approved: 3,
    averageScore: 100,
    behaviorApproved: true,
    behaviorRequired: true,
    streak: 1,
    ...over,
  };
}

describe('completionRateOf', () => {
  it('calcula a fração aprovada do dia', () => {
    expect(completionRateOf(day({ available: 4, approved: 3 }))).toBe(0.75);
  });

  it('devolve 0 em dia sem atividade acadêmica', () => {
    expect(completionRateOf(day({ available: 0, approved: 0 }))).toBe(0);
  });

  it('nunca passa de 1', () => {
    expect(completionRateOf(day({ available: 2, approved: 5 }))).toBe(1);
  });
});

describe('isPerfectDay', () => {
  it('reconhece o dia perfeito', () => {
    expect(isPerfectDay(day())).toBe(true);
  });

  it('exige todas as atividades, não só nota alta', () => {
    expect(isPerfectDay(day({ available: 3, approved: 2 }))).toBe(false);
  });

  it('exige nota máxima', () => {
    expect(isPerfectDay(day({ averageScore: 99 }))).toBe(false);
  });

  it('exige o comportamento quando havia obrigações', () => {
    expect(isPerfectDay(day({ behaviorApproved: false }))).toBe(false);
  });

  it('dispensa o comportamento quando não havia obrigações no dia', () => {
    expect(
      isPerfectDay(day({ behaviorRequired: false, behaviorApproved: false })),
    ).toBe(true);
  });

  it('dia sem atividade acadêmica não é perfeito', () => {
    expect(isPerfectDay(day({ available: 0, approved: 0 }))).toBe(false);
  });
});

describe('determineRarity', () => {
  it('dia perfeito entrega Lendária holográfica', () => {
    const result = determineRarity(day());
    expect(result.rarity).toBe('LEGENDARY');
    expect(result.foil).toBe(true);
    expect(result.perfectDay).toBe(true);
  });

  it('fechou o dia com média alta, mas não máxima, entrega Mítica', () => {
    const result = determineRarity(day({ averageScore: 92 }));
    expect(result.rarity).toBe('EPIC');
    expect(result.foil).toBe(false);
  });

  it('fechou o dia com média baixa cai para Rara', () => {
    expect(determineRarity(day({ averageScore: 70 })).rarity).toBe('RARE');
  });

  it('75% do dia entrega Rara', () => {
    expect(determineRarity(day({ available: 4, approved: 3 })).rarity).toBe('RARE');
  });

  it('metade do dia entrega Incomum', () => {
    expect(determineRarity(day({ available: 4, approved: 2 })).rarity).toBe('UNCOMMON');
  });

  it('quase nada feito entrega Comum', () => {
    expect(determineRarity(day({ available: 4, approved: 1 })).rarity).toBe('COMMON');
  });

  it('dia só de comportamento aprovado entrega Incomum', () => {
    const result = determineRarity(
      day({ available: 0, approved: 0, behaviorApproved: true }),
    );
    expect(result.rarity).toBe('UNCOMMON');
    expect(result.foil).toBe(false);
  });

  it('dia sem nada entrega Comum', () => {
    const result = determineRarity(
      day({ available: 0, approved: 0, behaviorApproved: false, behaviorRequired: true }),
    );
    expect(result.rarity).toBe('COMMON');
  });

  it('parar na primeira atividade não vira dia perfeito', () => {
    // O dia oferecia 3; a criança fechou 1 com nota máxima e parou.
    const result = determineRarity(
      day({ available: 3, approved: 1, averageScore: 100 }),
    );
    expect(result.perfectDay).toBe(false);
    expect(result.rarity).not.toBe('LEGENDARY');
    expect(result.foil).toBe(false);
  });

  it('volume não muda a raridade: o que conta é fechar o dia proposto', () => {
    // Faixa que propõe 3 e faixa que propõe 5 chegam à mesma Lendária.
    const tier1 = determineRarity(day({ available: 3, approved: 3 }));
    const tier4 = determineRarity(day({ available: 5, approved: 5 }));
    expect(tier1.rarity).toBe(tier4.rarity);
    expect(tier1.foil).toBe(tier4.foil);
  });
});

describe('capRarity', () => {
  it('limita ao teto do plano', () => {
    expect(capRarity('LEGENDARY', 'UNCOMMON')).toBe('UNCOMMON');
  });

  it('mantém raridade abaixo do teto', () => {
    expect(capRarity('COMMON', 'EPIC')).toBe('COMMON');
  });
});

describe('compareRarity', () => {
  it('ordena da menor para a maior', () => {
    expect(compareRarity('COMMON', 'LEGENDARY')).toBeLessThan(0);
    expect(compareRarity('LEGENDARY', 'COMMON')).toBeGreaterThan(0);
    expect(compareRarity('RARE', 'RARE')).toBe(0);
  });
});
