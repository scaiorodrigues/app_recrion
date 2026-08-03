import { CRIONS } from '@/data/crions';
import manifest from '../../../art/manifest.json';
import { cardArtKey, hasGeneratedArt, resolveArtUris } from '@/utils/art';

const LAYERS = ['creature', 'effect', 'background', 'edge'] as const;
const entries = manifest as Record<string, Record<string, string>>;

describe('manifesto de arte', () => {
  it('cobre as 512 cartas', () => {
    expect(Object.keys(entries)).toHaveLength(512);
  });

  it('dá as quatro camadas a cada carta', () => {
    for (const layers of Object.values(entries)) {
      for (const layer of LAYERS) {
        expect(layers[layer]).toMatch(new RegExp(`^${layer}_[0-9a-f]{16}\\.png$`));
      }
    }
  });

  it('reaproveita a mesma arte quando o prompt é igual', () => {
    // Só a criatura é única por carta; fundo, efeito e borda se repetem.
    const unique = (layer: string) =>
      new Set(Object.values(entries).map((l) => l[layer])).size;

    expect(unique('creature')).toBe(512);
    expect(unique('edge')).toBeLessThan(20);
    expect(unique('background')).toBeLessThan(60);
    expect(unique('effect')).toBeLessThan(60);
  });

  it('a chave da carta casa com o par Crion + slot', () => {
    for (const crion of CRIONS) {
      for (const attack of crion.attacks) {
        expect(entries[cardArtKey(crion.id, attack.slot)]).toBeDefined();
      }
    }
  });

  it('cada slot do mesmo Crion aponta para uma criatura diferente', () => {
    for (const crion of CRIONS) {
      const creatures = crion.attacks.map(
        (a) => entries[cardArtKey(crion.id, a.slot)].creature,
      );
      expect(new Set(creatures).size).toBe(4);
    }
  });
});

describe('resolveArtUris', () => {
  it('devolve undefined sem base configurada, e o app cai no desenho procedural', () => {
    // EXPO_PUBLIC_ART_BASE_URL não está definida no ambiente de teste.
    expect(hasGeneratedArt).toBe(false);
    expect(resolveArtUris(CRIONS[0], 1)).toBeUndefined();
  });
});
