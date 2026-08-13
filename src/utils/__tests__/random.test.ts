import { pickBySeed, pickManyBySeed, randomFromSeed, seedFrom, shuffleBySeed } from '@/utils/random';

const ITEMS = ['a', 'b', 'c', 'd', 'e', 'f'];

describe('seedFrom', () => {
  it('devolve sempre o mesmo número para o mesmo texto', () => {
    expect(seedFrom('2026-08-04:child_7')).toBe(seedFrom('2026-08-04:child_7'));
  });

  it('separa sementes de dias diferentes', () => {
    expect(seedFrom('2026-08-04:child_7')).not.toBe(seedFrom('2026-08-05:child_7'));
  });

  it('nunca devolve negativo, para servir de índice', () => {
    const seeds = ['a', 'zzzzzzzzzzzzzzzz', '2026-12-31:child_999', ''];
    seeds.forEach((s) => expect(seedFrom(s)).toBeGreaterThanOrEqual(0));
  });
});

describe('randomFromSeed', () => {
  it('repete a mesma sequência para a mesma semente', () => {
    const a = randomFromSeed(42);
    const b = randomFromSeed(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('mantém os valores dentro de [0, 1)', () => {
    const next = randomFromSeed(7);
    for (let i = 0; i < 200; i++) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('pickBySeed', () => {
  it('escolhe o mesmo item para a mesma semente', () => {
    expect(pickBySeed(ITEMS, 'dia-1')).toBe(pickBySeed(ITEMS, 'dia-1'));
  });

  it('escolhe sempre um item da lista', () => {
    ['x', 'y', 'z', 'dia-9'].forEach((seed) => {
      expect(ITEMS).toContain(pickBySeed(ITEMS, seed));
    });
  });
});

describe('shuffleBySeed', () => {
  it('não perde nem duplica item', () => {
    expect([...shuffleBySeed(ITEMS, 'dia-1')].sort()).toEqual([...ITEMS].sort());
  });

  it('devolve a mesma ordem para a mesma semente', () => {
    expect(shuffleBySeed(ITEMS, 'dia-1')).toEqual(shuffleBySeed(ITEMS, 'dia-1'));
  });

  it('não altera a lista original', () => {
    const original = [...ITEMS];
    shuffleBySeed(ITEMS, 'dia-1');
    expect(ITEMS).toEqual(original);
  });
});

describe('pickManyBySeed', () => {
  it('escolhe a quantidade pedida, sem repetir', () => {
    const picked = pickManyBySeed(ITEMS, 4, 'dia-1');
    expect(picked).toHaveLength(4);
    expect(new Set(picked).size).toBe(4);
  });

  it('devolve o que há quando pedem mais do que existe', () => {
    expect(pickManyBySeed(ITEMS, 99, 'dia-1')).toHaveLength(ITEMS.length);
  });

  it('devolve a mesma seleção para a mesma semente', () => {
    expect(pickManyBySeed(ITEMS, 3, 'dia-1')).toEqual(pickManyBySeed(ITEMS, 3, 'dia-1'));
  });
});
