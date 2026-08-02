import {
  BONUS_BEHAVIOR_COMPLETE,
  BONUS_STREAK_7_DAYS,
  SUBJECT_WEIGHTS,
} from '@/constants/game';
import {
  calculateBonuses,
  calculateDailyXP,
  capRarity,
  determinePrimaryElement,
  determineSecondaryElement,
  xpToRarity,
} from '@/utils/xp';

const noBonuses = calculateBonuses({});

describe('calculateDailyXP', () => {
  it('pondera cada matéria pelo seu peso', () => {
    const xp = calculateDailyXP({ portugues: 100, arte: 100 }, noBonuses, false);
    expect(xp).toBe(Math.round(100 * SUBJECT_WEIGHTS.portugues + 100 * SUBJECT_WEIGHTS.arte));
  });

  it('soma o bônus fixo de comportamento quando aprovado', () => {
    const withoutBehavior = calculateDailyXP({ portugues: 50 }, noBonuses, false);
    const withBehavior = calculateDailyXP({ portugues: 50 }, noBonuses, true);
    expect(withBehavior - withoutBehavior).toBe(BONUS_BEHAVIOR_COMPLETE);
  });

  it('gera XP apenas com comportamento aprovado, sem nota acadêmica', () => {
    expect(calculateDailyXP({}, noBonuses, true)).toBe(BONUS_BEHAVIOR_COMPLETE);
  });

  it('inclui os bônus conquistados', () => {
    const bonuses = calculateBonuses({ streak7Days: true });
    expect(calculateDailyXP({}, bonuses, false)).toBe(BONUS_STREAK_7_DAYS);
  });

  it('aplica o multiplicador do plano', () => {
    const base = calculateDailyXP({ portugues: 100 }, noBonuses, false);
    const boosted = calculateDailyXP({ portugues: 100 }, noBonuses, false, 1.2);
    expect(boosted).toBe(Math.round(base * 1.2));
  });
});

describe('determinePrimaryElement', () => {
  it('escolhe a matéria de maior nota ponderada', () => {
    // Inglês tem nota maior, mas Matemática pesa mais: 80*1.2 = 96 > 90*1.0
    expect(determinePrimaryElement({ matematica: 80, ingles: 90 }, false)).toBe('FIRE');
  });

  it('usa Luz quando só houve comportamento aprovado', () => {
    expect(determinePrimaryElement({}, true)).toBe('LIGHT');
  });

  it('retorna null sem nota e sem comportamento', () => {
    expect(determinePrimaryElement({}, false)).toBeNull();
  });

  it('ignora notas zeradas', () => {
    expect(determinePrimaryElement({ matematica: 0, ingles: 50 }, false)).toBe('WATER');
  });
});

describe('determineSecondaryElement', () => {
  it('gera híbrido quando a diferença ponderada é menor que 10', () => {
    // portugues 50*1.2 = 60; ingles 55*1.0 = 55 → diferença 5
    expect(determineSecondaryElement({ portugues: 50, ingles: 55 }, 'NATURE')).toBe('WATER');
  });

  it('não gera híbrido quando a diferença é 10 ou mais', () => {
    // portugues 100*1.2 = 120; ingles 50*1.0 = 50 → diferença 70
    expect(determineSecondaryElement({ portugues: 100, ingles: 50 }, 'NATURE')).toBeNull();
  });

  it('retorna null quando só há uma matéria', () => {
    expect(determineSecondaryElement({ portugues: 80 }, 'NATURE')).toBeNull();
  });
});

describe('xpToRarity', () => {
  it.each([
    [0, 'COMMON'],
    [39, 'COMMON'],
    [40, 'UNCOMMON'],
    [59, 'UNCOMMON'],
    [60, 'RARE'],
    [79, 'RARE'],
    [80, 'EPIC'],
    [94, 'EPIC'],
    [95, 'LEGENDARY'],
    [500, 'LEGENDARY'],
  ])('XP %i vira %s', (xp, expected) => {
    expect(xpToRarity(xp)).toBe(expected);
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
