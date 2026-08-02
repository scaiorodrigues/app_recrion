import { CRIONS } from '@/data/crions';
import type { DayPerformance } from '@/types';
import {
  fastestCompleted,
  findCrionById,
  firstCompleted,
  generateDailyCrion,
  selectAttackSlot,
  selectCrion,
  type CompletedActivity,
} from '@/utils/generation';
import { calculateBonuses } from '@/utils/xp';

const noBonuses = calculateBonuses({});

function perf(over: Partial<DayPerformance> = {}): DayPerformance {
  return {
    available: 1,
    approved: 1,
    averageScore: 80,
    behaviorApproved: false,
    behaviorRequired: false,
    streak: 0,
    ...over,
  };
}

const baseInput = {
  childId: 'child_1',
  childName: 'Sofia',
  tier: 'TIER_1' as const,
  date: '2026-08-02',
  bonuses: noBonuses,
  activities: [] as CompletedActivity[],
  performance: perf(),
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

  it('usa o acervo da faixa quando a raridade existe nela', () => {
    const crion = selectCrion('FIRE', 'COMMON', 'TIER_1', 0);
    expect(crion?.tier).toBe('TIER_1');
    expect(crion?.rarity).toBe('COMMON');
  });

  it('entrega a raridade conquistada mesmo que ela viva numa faixa acima', () => {
    // Lendários só existem no TIER_4, mas o 1º ano que fez o dia perfeito
    // recebe uma carta Lendária de verdade — e não uma Rara rotulada errado.
    const crion = selectCrion('FIRE', 'LEGENDARY', 'TIER_1', 0);
    expect(crion?.rarity).toBe('LEGENDARY');
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
        activities: [{ subject: 'portugues' }],
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
    const result = generateDailyCrion({
      ...baseInput,
      scores: {},
      behaviorApproved: false,
      performance: perf({ available: 0, approved: 0 }),
    });
    expect(result).toBeNull();
  });

  it('gera Crion de Luz em dia só de comportamento', () => {
    const result = generateDailyCrion({
      ...baseInput,
      scores: {},
      behaviorApproved: true,
      performance: perf({ available: 0, approved: 0, behaviorApproved: true }),
    });
    expect(result?.element).toBe('LIGHT');
    expect(result?.crion.element).toBe('LIGHT');
  });

  it('respeita o teto de raridade do plano gratuito', () => {
    const result = generateDailyCrion({
      ...baseInput,
      scores: { portugues: 100, matematica: 100 },
      behaviorApproved: true,
      activities: [{ subject: 'portugues' }, { subject: 'matematica' }],
      performance: perf({ available: 2, approved: 2, averageScore: 100, behaviorApproved: true }),
      maxRarity: 'UNCOMMON',
    });
    expect(result?.rarity).toBe('UNCOMMON');
    // Sem alcançar o topo, a holografia não vem junto.
    expect(result?.foil).toBe(false);
  });

  it('produz a mesma carta para a mesma criança e data', () => {
    const input = {
      ...baseInput,
      scores: { portugues: 70 },
      behaviorApproved: false,
      activities: [{ subject: 'portugues' as const, durationSeconds: 300 }],
    };
    expect(generateDailyCrion(input)?.crion.id).toBe(generateDailyCrion(input)?.crion.id);
  });

  it('preenche a carta com os dados de origem', () => {
    const result = generateDailyCrion({
      ...baseInput,
      scores: { portugues: 60 },
      behaviorApproved: false,
      activities: [{ subject: 'portugues' }],
    });

    expect(result?.card.childName).toBe('Sofia');
    expect(result?.card.date).toBe('2026-08-02');
    expect(result?.card.primarySubject).toBe('portugues');
    expect(result?.card.crionId).toBe(result?.crion.id);
  });
});

describe('a primeira e a mais rápida definem o monstro', () => {
  const manha = '2026-08-02T08:00:00.000Z';
  const tarde = '2026-08-02T15:00:00.000Z';

  it('firstCompleted pega a atividade mais cedo, não a primeira da lista', () => {
    const activities: CompletedActivity[] = [
      { subject: 'matematica', completedAt: tarde },
      { subject: 'portugues', completedAt: manha },
    ];
    expect(firstCompleted(activities)?.subject).toBe('portugues');
  });

  it('fastestCompleted pega a de menor duração', () => {
    const activities: CompletedActivity[] = [
      { subject: 'matematica', durationSeconds: 600 },
      { subject: 'ingles', durationSeconds: 240 },
    ];
    expect(fastestCompleted(activities)?.subject).toBe('ingles');
  });

  it('o elemento vem da primeira atividade concluída, não da maior nota', () => {
    const result = generateDailyCrion({
      ...baseInput,
      // Matemática tem nota e peso maiores, mas Português veio primeiro.
      scores: { portugues: 60, matematica: 100 },
      behaviorApproved: false,
      activities: [
        { subject: 'matematica', completedAt: tarde },
        { subject: 'portugues', completedAt: manha },
      ],
      performance: perf({ available: 2, approved: 2, averageScore: 80 }),
    });

    expect(result?.element).toBe('NATURE');
    expect(result?.card.primarySubject).toBe('portugues');
  });

  it('ritmos diferentes no mesmo dia geram criaturas diferentes', () => {
    const base = {
      ...baseInput,
      scores: { portugues: 80 },
      behaviorApproved: false,
      performance: perf({ available: 1, approved: 1, averageScore: 80 }),
    };

    const rapido = generateDailyCrion({
      ...base,
      activities: [{ subject: 'portugues', completedAt: manha, durationSeconds: 200 }],
    });
    const lento = generateDailyCrion({
      ...base,
      activities: [{ subject: 'portugues', completedAt: manha, durationSeconds: 900 }],
    });

    expect(rapido?.element).toBe(lento?.element);
    expect(rapido?.crion.id).not.toBe(lento?.crion.id);
  });
});

describe('dia perfeito', () => {
  it('entrega Lendária holográfica quando tudo foi fechado com nota máxima', () => {
    const result = generateDailyCrion({
      ...baseInput,
      tier: 'TIER_4',
      scores: { portugues: 100, matematica: 100, ingles: 100 },
      behaviorApproved: true,
      activities: [
        { subject: 'portugues', completedAt: '2026-08-02T08:00:00.000Z', durationSeconds: 300 },
        { subject: 'matematica', completedAt: '2026-08-02T10:00:00.000Z', durationSeconds: 400 },
        { subject: 'ingles', completedAt: '2026-08-02T12:00:00.000Z', durationSeconds: 350 },
      ],
      performance: perf({
        available: 3,
        approved: 3,
        averageScore: 100,
        behaviorApproved: true,
        behaviorRequired: true,
        streak: 5,
      }),
    });

    expect(result?.rarity).toBe('LEGENDARY');
    expect(result?.foil).toBe(true);
    expect(result?.perfectDay).toBe(true);
    expect(result?.card.foil).toBe(true);
    expect(result?.card.streak).toBe(5);
  });

  it('a carta guarda a fração concluída do dia', () => {
    const result = generateDailyCrion({
      ...baseInput,
      scores: { portugues: 80 },
      behaviorApproved: false,
      activities: [{ subject: 'portugues' }],
      performance: perf({ available: 4, approved: 1, averageScore: 80 }),
    });

    expect(result?.card.completionRate).toBeCloseTo(0.25);
    expect(result?.rarity).toBe('COMMON');
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
