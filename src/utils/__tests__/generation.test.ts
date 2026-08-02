import { CRIONS } from '@/data/crions';
import { findCrionById, generateDailyCrion, selectAttackSlot, selectCrion } from '@/utils/generation';
import { calculateBonuses } from '@/utils/xp';

const noBonuses = calculateBonuses({});

const baseInput = {
  childId: 'child_1',
  childName: 'Sofia',
  tier: 'TIER_1' as const,
  date: '2026-08-02',
  bonuses: noBonuses,
};

describe('banco de Crions', () => {
  it('tem 128 Crions com ids únicos', () => {
    expect(CRIONS).toHaveLength(128);
    expect(new Set(CRIONS.map((c) => c.id)).size).toBe(128);
  });

  it('dá exatamente 4 ataques a cada Crion, um por slot', () => {
    for (const crion of CRIONS) {
      expect(crion.attacks).toHaveLength(4);
      expect(crion.attacks.map((a) => a.slot).sort()).toEqual([1, 2, 3, 4]);
    }
  });

  it('mantém todos os atributos dentro das faixas definidas', () => {
    for (const crion of CRIONS) {
      expect(crion.baseHP).toBeGreaterThanOrEqual(60);
      expect(crion.baseHP).toBeLessThanOrEqual(200);
      expect(crion.baseAtk).toBeGreaterThanOrEqual(20);
      expect(crion.baseAtk).toBeLessThanOrEqual(120);
      expect(crion.baseDef).toBeGreaterThanOrEqual(10);
      expect(crion.baseDef).toBeLessThanOrEqual(100);
    }
  });

  it('mantém poder e precisão dos ataques dentro das faixas', () => {
    for (const attack of CRIONS.flatMap((c) => c.attacks)) {
      expect(attack.power).toBeGreaterThanOrEqual(20);
      expect(attack.power).toBeLessThanOrEqual(150);
      expect(attack.accuracy).toBeGreaterThanOrEqual(70);
      expect(attack.accuracy).toBeLessThanOrEqual(100);
    }
  });

  it('preenche imagePrompt e descrição em todos', () => {
    for (const crion of CRIONS) {
      expect(crion.imagePrompt.length).toBeGreaterThan(30);
      expect(crion.description.length).toBeGreaterThan(10);
      expect(crion.baseEmoji).not.toBe('');
    }
  });
});

describe('selectCrion', () => {
  it('respeita elemento e raridade pedidos', () => {
    const crion = selectCrion('WATER', 'COMMON', 'TIER_1', 0);
    expect(crion?.element).toBe('WATER');
    expect(crion?.rarity).toBe('COMMON');
  });

  it('nunca entrega um Crion acima do tier da criança', () => {
    const crion = selectCrion('FIRE', 'LEGENDARY', 'TIER_1', 0);
    // Lendários são TIER_4, então cai para uma raridade que o TIER_1 alcança.
    expect(crion?.tier).toBe('TIER_1');
  });

  it('é determinístico para a mesma semente', () => {
    expect(selectCrion('NATURE', 'COMMON', 'TIER_2', 7)?.id).toBe(
      selectCrion('NATURE', 'COMMON', 'TIER_2', 7)?.id,
    );
  });

  it('nunca gera Crion de Gelo para a criança', () => {
    for (let seed = 0; seed < 50; seed++) {
      const result = generateDailyCrion({
        ...baseInput,
        date: `2026-08-${String((seed % 28) + 1).padStart(2, '0')}`,
        scores: { portugues: 80 },
        behaviorApproved: true,
      });
      expect(result?.crion.element).not.toBe('ICE_NPC');
    }
  });
});

describe('selectAttackSlot', () => {
  const crion = CRIONS[0];

  it.each([
    [0, 1],
    [39, 1],
    [40, 2],
    [69, 2],
    [70, 3],
    [94, 3],
    [95, 4],
    [200, 4],
  ])('XP %i desbloqueia o slot %i', (xp, expected) => {
    expect(selectAttackSlot(crion, xp)).toBe(expected);
  });
});

describe('generateDailyCrion', () => {
  it('não gera carta sem desempenho nenhum', () => {
    const result = generateDailyCrion({ ...baseInput, scores: {}, behaviorApproved: false });
    expect(result).toBeNull();
  });

  it('gera Crion de Luz em dia só de comportamento', () => {
    const result = generateDailyCrion({ ...baseInput, scores: {}, behaviorApproved: true });
    expect(result?.element).toBe('LIGHT');
    expect(result?.crion.element).toBe('LIGHT');
  });

  it('respeita o teto de raridade do plano gratuito', () => {
    const result = generateDailyCrion({
      ...baseInput,
      scores: { portugues: 100, matematica: 100 },
      behaviorApproved: true,
      maxRarity: 'UNCOMMON',
    });
    expect(result?.rarity).toBe('UNCOMMON');
  });

  it('produz a mesma carta para a mesma criança e data', () => {
    const input = { ...baseInput, scores: { portugues: 70 }, behaviorApproved: false };
    expect(generateDailyCrion(input)?.crion.id).toBe(generateDailyCrion(input)?.crion.id);
  });

  it('preenche a carta com os dados de origem', () => {
    const result = generateDailyCrion({
      ...baseInput,
      scores: { portugues: 60 },
      behaviorApproved: false,
    });

    expect(result?.card.childName).toBe('Sofia');
    expect(result?.card.date).toBe('2026-08-02');
    expect(result?.card.primarySubject).toBe('portugues');
    expect(result?.card.crionId).toBe(result?.crion.id);
  });
});

describe('findCrionById', () => {
  it('encontra um Crion existente', () => {
    expect(findCrionById(CRIONS[10].id)?.id).toBe(CRIONS[10].id);
  });

  it('retorna undefined para id inexistente', () => {
    expect(findCrionById('crion_inexistente')).toBeUndefined();
  });
});
