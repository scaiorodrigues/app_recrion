/**
 * Sorteio estável a partir de uma semente de texto.
 *
 * As atividades precisam ser as mesmas o dia inteiro: se a criança sair e
 * voltar, tem de reencontrar o mesmo exercício, com as mesmas opções na mesma
 * ordem. Sorteio de verdade quebraria isso — então tudo aqui é determinístico,
 * derivado de uma semente como "2026-08-04:child_7".
 */

/** Semente numérica estável a partir de um texto. */
export function seedFrom(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Gerador pseudoaleatório de semente fixa (mulberry32): mesma semente, mesma
 * sequência de números. Devolve valores em [0, 1).
 */
export function randomFromSeed(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Escolhe um item da lista de forma estável. */
export function pickBySeed<T>(items: readonly T[], seed: string): T {
  return items[seedFrom(seed) % items.length];
}

/**
 * Escolhe vários itens distintos, de forma estável. Se pedirem mais do que
 * existe, devolve tudo o que há — a atividade se adapta ao banco disponível.
 */
export function pickManyBySeed<T>(items: readonly T[], count: number, seed: string): T[] {
  return shuffleBySeed(items, seed).slice(0, Math.min(count, items.length));
}

/** Embaralha de forma estável (Fisher-Yates com a semente). */
export function shuffleBySeed<T>(items: readonly T[], seed: string): T[] {
  const out = [...items];
  const random = randomFromSeed(seedFrom(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
