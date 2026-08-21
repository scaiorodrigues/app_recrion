/**
 * O que se deriva de uma ficha de leitura.
 *
 * A ficha traz só o texto e as perguntas. A sílaba que falta, a separação
 * silábica e o caça-palavras saem daqui — assim escrever uma ficha nova é
 * escrever um textinho e três perguntas, e mais nada.
 */

import type { ReadingSheet, ReadingWord } from '@/data/readings';
import { wordsOf } from '@/data/readings';
import { pickManyBySeed, randomFromSeed, seedFrom, shuffleBySeed } from '@/utils/random';

const VOWELS = 'AEIOU';

/** Letras que entram no preenchimento do caça-palavras. */
const FILLER = 'ABCDEFGILMNOPRSTUVXZ';

// ---------------------------------------------------------------------------
// Complete com a sílaba que falta
// ---------------------------------------------------------------------------

export interface MissingSyllableItem {
  word: string;
  syllables: string[];
  /** Qual sílaba foi escondida. */
  hiddenIndex: number;
  /** Três opções, já embaralhadas, incluindo a certa. */
  options: string[];
}

/**
 * Uma sílaba serve de pergunta quando dá para trocar a vogal dela e gerar
 * opções parecidas — é o que faz a criança olhar a letra, e não o formato.
 * Sílabas com acento ficam de fora: trocar a vogal de "ÃO" gera bobagem.
 */
function swappableVowelIndex(syllable: string): number {
  if (syllable !== syllable.normalize('NFC') || /[ÁÀÂÃÉÊÍÓÔÕÚÜÇ]/.test(syllable)) return -1;
  for (let i = syllable.length - 1; i >= 0; i--) {
    if (VOWELS.includes(syllable[i])) return i;
  }
  return -1;
}

/** Variações da sílaba trocando só a vogal: TO vira TA, TE, TI, TU. */
function vowelVariants(syllable: string): string[] {
  const at = swappableVowelIndex(syllable);
  if (at < 0) return [];
  return [...VOWELS]
    .filter((v) => v !== syllable[at])
    .map((v) => syllable.slice(0, at) + v + syllable.slice(at + 1));
}

/**
 * Monta os itens de "complete com a sílaba que falta" a partir do texto da
 * ficha. Só entram palavras de 2 ou 3 sílabas: com uma sílaba não há o que
 * esconder, e com quatro a criança perde a palavra de vista.
 */
export function missingSyllableItems(
  sheet: ReadingSheet,
  seed: string,
  count = 3,
): MissingSyllableItem[] {
  const candidates = wordsOf(sheet).filter(
    (word) =>
      word.syllables.length >= 2 &&
      word.syllables.length <= 3 &&
      word.syllables.some((s) => vowelVariants(s).length >= 2),
  );

  return pickManyBySeed(candidates, count, `${seed}:silaba`).map((word) => {
    const usable = word.syllables
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => vowelVariants(s).length >= 2);

    const chosen = usable[seedFrom(`${seed}:${word.text}`) % usable.length];
    const distractors = pickManyBySeed(
      vowelVariants(chosen.s),
      2,
      `${seed}:${word.text}:op`,
    );

    return {
      word: word.text,
      syllables: word.syllables,
      hiddenIndex: chosen.i,
      options: shuffleBySeed([chosen.s, ...distractors], `${seed}:${word.text}:ordem`),
    };
  });
}

// ---------------------------------------------------------------------------
// Separe as sílabas
// ---------------------------------------------------------------------------

/** Palavras do texto boas para separar: de duas sílabas para cima. */
export function splitWords(sheet: ReadingSheet, seed: string, count = 3): ReadingWord[] {
  const candidates = wordsOf(sheet).filter((w) => w.syllables.length >= 2);
  return pickManyBySeed(candidates, count, `${seed}:separar`);
}

// ---------------------------------------------------------------------------
// Caça-palavras
// ---------------------------------------------------------------------------

export interface HuntPlacement {
  word: string;
  row: number;
  col: number;
  /** Direção: (0,1) deitada, (1,0) em pé. */
  dRow: number;
  dCol: number;
}

export interface HuntGrid {
  size: number;
  /** cells[linha][coluna] */
  cells: string[][];
  placements: HuntPlacement[];
}

function fits(cells: string[][], word: string, p: Omit<HuntPlacement, 'word'>): boolean {
  const size = cells.length;
  for (let k = 0; k < word.length; k++) {
    const r = p.row + p.dRow * k;
    const c = p.col + p.dCol * k;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    const atual = cells[r][c];
    // Cruzar outra palavra só vale se a letra for a mesma.
    if (atual !== '' && atual !== word[k]) return false;
  }
  return true;
}

function write(cells: string[][], word: string, p: Omit<HuntPlacement, 'word'>): void {
  for (let k = 0; k < word.length; k++) {
    cells[p.row + p.dRow * k][p.col + p.dCol * k] = word[k];
  }
}

function emptyGrid(size: number): string[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
}

/**
 * Grade do caça-palavras. Tenta espalhar as palavras na horizontal e na
 * vertical; se alguma não couber, refaz tudo com uma palavra por linha — a
 * grade sempre sai válida, porque o exercício não pode travar na frente da
 * criança.
 */
export function buildHuntGrid(words: string[], seed: string): HuntGrid {
  const longest = words.reduce((max, w) => Math.max(max, w.length), 0);
  const size = Math.min(8, Math.max(5, longest + 1));
  const random = randomFromSeed(seedFrom(`${seed}:caca`));

  const cells = emptyGrid(size);
  const placements: HuntPlacement[] = [];
  let todasCouberam = true;

  for (const word of words) {
    let colocada = false;
    for (let tentativa = 0; tentativa < 160 && !colocada; tentativa++) {
      const deitada = random() < 0.5;
      const dRow = deitada ? 0 : 1;
      const dCol = deitada ? 1 : 0;
      const maxRow = deitada ? size : size - word.length;
      const maxCol = deitada ? size - word.length : size;
      if (maxRow <= 0 || maxCol <= 0) break;

      const p = {
        row: Math.floor(random() * maxRow),
        col: Math.floor(random() * maxCol),
        dRow,
        dCol,
      };
      if (!fits(cells, word, p)) continue;
      write(cells, word, p);
      placements.push({ word, ...p });
      colocada = true;
    }
    if (!colocada) {
      todasCouberam = false;
      break;
    }
  }

  if (!todasCouberam) return fallbackGrid(words, size, seed);

  fill(cells, random);
  return { size, cells, placements };
}

/** Uma palavra por linha, sem sorteio. Só entra quando o sorteio falha. */
function fallbackGrid(words: string[], size: number, seed: string): HuntGrid {
  const cells = emptyGrid(size);
  const placements: HuntPlacement[] = words.map((word, i) => {
    const p = { row: i % size, col: 0, dRow: 0, dCol: 1 };
    write(cells, word, p);
    return { word, ...p };
  });

  fill(cells, randomFromSeed(seedFrom(`${seed}:caca:reserva`)));
  return { size, cells, placements };
}

function fill(cells: string[][], random: () => number): void {
  for (const linha of cells) {
    for (let c = 0; c < linha.length; c++) {
      if (linha[c] === '') linha[c] = FILLER[Math.floor(random() * FILLER.length)];
    }
  }
}

export interface Cell {
  row: number;
  col: number;
}

/**
 * O que está escrito entre duas células, se elas estiverem na mesma linha ou
 * na mesma coluna. A criança toca na primeira e na última letra — arrastar o
 * dedo em cima de uma grade pequena é difícil demais nessa idade.
 */
export function wordBetween(grid: HuntGrid, a: Cell, b: Cell): string | null {
  const dRow = Math.sign(b.row - a.row);
  const dCol = Math.sign(b.col - a.col);
  if (dRow !== 0 && dCol !== 0) return null;

  const passos = Math.max(Math.abs(b.row - a.row), Math.abs(b.col - a.col));
  let saida = '';
  for (let k = 0; k <= passos; k++) {
    saida += grid.cells[a.row + dRow * k][a.col + dCol * k];
  }
  return saida;
}

/** Aceita a palavra lida nos dois sentidos: de trás para frente também vale. */
export function matchesHunt(lida: string, alvos: readonly string[]): string | null {
  const contrario = [...lida].reverse().join('');
  return alvos.find((alvo) => alvo === lida || alvo === contrario) ?? null;
}
