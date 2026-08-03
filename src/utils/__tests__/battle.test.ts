import type { Attack, CrionStats } from '@/types';
import {
  MULTIPLIER_NEUTRAL,
  MULTIPLIER_STRONG,
  MULTIPLIER_WEAK,
  calculateDamage,
  calculateHeal,
  getElementMultiplier,
  simulateBattle,
} from '@/utils/battle';

function stats(over: Partial<CrionStats> = {}): CrionStats {
  return { hp: 100, atk: 50, def: 50, spd: 50, element: 'NATURE', ...over };
}

function attack(over: Partial<Attack> = {}): Attack {
  return {
    id: 'atk',
    name: 'Golpe',
    element: 'NATURE',
    power: 50,
    accuracy: 100,
    description: '',
    unlockXP: 0,
    slot: 1,
    art: { creature: '', effect: '', background: '', edge: '' },
    ...over,
  };
}

/** Sempre acerta. */
const alwaysHit = () => 0;
/** Sempre erra. */
const alwaysMiss = () => 0.999;

describe('getElementMultiplier', () => {
  it('dá vantagem contra elemento fraco', () => {
    expect(getElementMultiplier('NATURE', 'EARTH')).toBe(MULTIPLIER_STRONG);
  });

  it('reduz o dano contra elemento forte', () => {
    expect(getElementMultiplier('NATURE', 'FIRE')).toBe(MULTIPLIER_WEAK);
  });

  it('é neutro entre elementos sem relação', () => {
    expect(getElementMultiplier('NATURE', 'ELECTRIC')).toBe(MULTIPLIER_NEUTRAL);
  });

  it('Luz é forte contra Metal e Terra e não tem fraqueza', () => {
    expect(getElementMultiplier('LIGHT', 'METAL')).toBe(MULTIPLIER_STRONG);
    expect(getElementMultiplier('LIGHT', 'EARTH')).toBe(MULTIPLIER_STRONG);
    expect(getElementMultiplier('FIRE', 'LIGHT')).toBe(MULTIPLIER_NEUTRAL);
  });

  it('Gelo NPC é forte contra Água e Fogo', () => {
    expect(getElementMultiplier('ICE_NPC', 'WATER')).toBe(MULTIPLIER_STRONG);
    expect(getElementMultiplier('ICE_NPC', 'FIRE')).toBe(MULTIPLIER_STRONG);
  });
});

describe('calculateDamage', () => {
  it('não causa dano quando o ataque erra', () => {
    expect(calculateDamage(stats(), stats(), attack({ accuracy: 70 }), alwaysMiss)).toBe(0);
  });

  it('aplica atk / def * poder * multiplicador', () => {
    const damage = calculateDamage(
      stats({ atk: 100 }),
      stats({ def: 50, element: 'ELECTRIC' }),
      attack({ power: 50 }),
      alwaysHit,
    );
    // (100/50) * 50 * 1.0 (neutro) = 100
    expect(damage).toBe(100);
  });

  it('IGNORE_DEFENSE anula a defesa do inimigo', () => {
    const normal = calculateDamage(
      stats({ atk: 50 }),
      stats({ def: 100, element: 'ELECTRIC' }),
      attack({ power: 50 }),
      alwaysHit,
    );
    const piercing = calculateDamage(
      stats({ atk: 50 }),
      stats({ def: 100, element: 'ELECTRIC' }),
      attack({ power: 50, effect: 'IGNORE_DEFENSE' }),
      alwaysHit,
    );
    expect(piercing).toBeGreaterThan(normal);
  });

  it('sempre causa ao menos 1 de dano ao acertar', () => {
    const damage = calculateDamage(
      stats({ atk: 1 }),
      stats({ def: 100, element: 'FIRE' }),
      attack({ power: 20 }),
      alwaysHit,
    );
    expect(damage).toBeGreaterThanOrEqual(1);
  });
});

describe('calculateHeal', () => {
  it('HEAL_SELF cura 20% do HP máximo', () => {
    expect(calculateHeal(attack({ effect: 'HEAL_SELF' }), 200)).toBe(40);
  });

  it('HEAL_ALL cura 25% no combate solo', () => {
    expect(calculateHeal(attack({ effect: 'HEAL_ALL' }), 200)).toBe(50);
  });

  it('não cura sem efeito de cura', () => {
    expect(calculateHeal(attack(), 200)).toBe(0);
  });
});

describe('simulateBattle', () => {
  it('o mais forte vence', () => {
    const result = simulateBattle(
      stats({ atk: 100, hp: 200, spd: 80 }),
      attack({ power: 100 }),
      stats({ atk: 10, hp: 50, spd: 10, element: 'ELECTRIC' }),
      attack({ power: 10, element: 'ELECTRIC' }),
      alwaysHit,
    );
    expect(result.winner).toBe('player');
  });

  it('registra os turnos do combate', () => {
    const result = simulateBattle(
      stats(),
      attack(),
      stats({ element: 'ELECTRIC' }),
      attack({ element: 'ELECTRIC' }),
      alwaysHit,
    );
    expect(result.turns.length).toBeGreaterThan(0);
    expect(result.turns[0].actor).toBe('player');
  });

  it('quem tem mais velocidade ataca primeiro', () => {
    const result = simulateBattle(
      stats({ spd: 10 }),
      attack(),
      stats({ spd: 90, element: 'ELECTRIC' }),
      attack({ element: 'ELECTRIC' }),
      alwaysHit,
    );
    expect(result.turns[0].actor).toBe('enemy');
  });

  it('termina mesmo quando ninguém acerta', () => {
    const result = simulateBattle(
      stats(),
      attack({ accuracy: 70 }),
      stats({ element: 'ELECTRIC' }),
      attack({ accuracy: 70, element: 'ELECTRIC' }),
      alwaysMiss,
    );
    expect(result.winner).toBeDefined();
  });
});
