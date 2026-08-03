import { CRIONS } from '@/data/crions';
import type { Crion } from '@/types';
import { buildContributions, calculateFinalStats } from '@/utils/stats';

const crion = CRIONS.find((c) => c.rarity === 'COMMON' && c.element === 'WATER') as Crion;

describe('calculateFinalStats', () => {
  it('soma o degrau da raridade sobre os atributos base', () => {
    const comum = calculateFinalStats(crion, 'COMMON', 0);
    const lendaria = calculateFinalStats(crion, 'LEGENDARY', 0);

    expect(comum.atk).toBe(crion.baseAtk);
    expect(lendaria.atk).toBeGreaterThan(comum.atk);
  });

  it('soma o XP do dia, então o mesmo Crion rende cartas diferentes', () => {
    const diaFraco = calculateFinalStats(crion, 'COMMON', 20);
    const diaForte = calculateFinalStats(crion, 'COMMON', 200);

    expect(diaForte.atk).toBeGreaterThan(diaFraco.atk);
  });

  it('limita o ganho vindo do XP para os números não escaparem', () => {
    const alto = calculateFinalStats(crion, 'COMMON', 100000);
    expect(alto.bonusAtk).toBeLessThanOrEqual(36); // teto do XP + degrau máximo
  });

  it('a defesa cresce pela metade do ataque', () => {
    const stats = calculateFinalStats(crion, 'EPIC', 120);
    expect(stats.bonusDef).toBe(Math.floor(stats.bonusAtk / 2));
  });

  it('nunca devolve atributo abaixo do base', () => {
    const stats = calculateFinalStats(crion, 'COMMON', 0);
    expect(stats.atk).toBeGreaterThanOrEqual(crion.baseAtk);
    expect(stats.def).toBeGreaterThanOrEqual(crion.baseDef);
  });
});

describe('buildContributions', () => {
  it('lista as matérias com suas notas', () => {
    const list = buildContributions({ portugues: 90, matematica: 70 }, 'NATURE', false);

    expect(list).toHaveLength(2);
    expect(list[0].subject).toBe('portugues');
    expect(list[0].value).toBe(90);
  });

  it('marca como principal a matéria que definiu o elemento', () => {
    const list = buildContributions({ portugues: 60, matematica: 100 }, 'NATURE', false);
    const principal = list.find((c) => c.primary);

    expect(principal?.subject).toBe('portugues');
    expect(list[0].primary).toBe(true);
  });

  it('inclui a Luz quando o comportamento foi aprovado', () => {
    const list = buildContributions({ portugues: 80 }, 'NATURE', true);
    const luz = list.find((c) => c.element === 'LIGHT');

    expect(luz).toBeDefined();
    expect(luz?.subject).toBe('comportamento');
  });

  it('não inclui a Luz sem o comportamento aprovado', () => {
    const list = buildContributions({ portugues: 80 }, 'NATURE', false);
    expect(list.some((c) => c.element === 'LIGHT')).toBe(false);
  });

  it('ignora matérias com nota zero', () => {
    const list = buildContributions({ portugues: 80, ingles: 0 }, 'NATURE', false);
    expect(list).toHaveLength(1);
  });

  it('dia só de comportamento devolve apenas a Luz', () => {
    const list = buildContributions({}, 'LIGHT', true);
    expect(list).toHaveLength(1);
    expect(list[0].primary).toBe(true);
  });
});

describe('camadas de arte', () => {
  it('todo ataque traz as quatro camadas preenchidas', () => {
    for (const attack of CRIONS.flatMap((c) => c.attacks)) {
      expect(attack.art.creature.length).toBeGreaterThan(30);
      expect(attack.art.effect.length).toBeGreaterThan(30);
      expect(attack.art.background.length).toBeGreaterThan(20);
      expect(attack.art.edge.length).toBeGreaterThan(20);
    }
  });

  it('a pose da criatura muda de um ataque para o outro', () => {
    for (const crion of CRIONS) {
      const poses = new Set(crion.attacks.map((a) => a.art.creature));
      expect(poses.size).toBe(4);
    }
  });

  it('a camada da criatura cita o nome do ataque', () => {
    for (const crion of CRIONS) {
      for (const attack of crion.attacks) {
        expect(attack.art.creature).toContain(attack.name);
      }
    }
  });

  it('as camadas de efeito e criatura pedem fundo transparente', () => {
    for (const attack of CRIONS.flatMap((c) => c.attacks)) {
      expect(attack.art.creature).toContain('transparent background');
      expect(attack.art.effect).toContain('transparent background');
    }
  });

  it('a camada de fundo não pede personagem', () => {
    for (const attack of CRIONS.flatMap((c) => c.attacks)) {
      expect(attack.art.background).toContain('no characters');
      expect(attack.art.edge).toContain('no creature');
    }
  });

  it('todo Crion tem epíteto para o subtítulo da carta', () => {
    for (const crion of CRIONS) {
      expect(crion.epithet.length).toBeGreaterThan(3);
    }
  });
});
