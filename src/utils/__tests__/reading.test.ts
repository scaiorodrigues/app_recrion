import { READING_SHEETS, readingsForTier, wordsOf } from '@/data/readings';
import {
  buildHuntGrid,
  matchesHunt,
  missingSyllableItems,
  splitWords,
  wordBetween,
} from '@/utils/reading';
import type { Tier } from '@/types';

const TIERS: Tier[] = ['TIER_1', 'TIER_2', 'TIER_3', 'TIER_4'];
const FICHAS = TIERS.flatMap((t) => READING_SHEETS[t]);

describe('fichas de leitura', () => {
  it('existe pelo menos uma ficha em cada faixa', () => {
    TIERS.forEach((t) => expect(readingsForTier(t).length).toBeGreaterThan(0));
  });

  it('não repete id', () => {
    const ids = FICHAS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('as sílabas remontam a palavra', () => {
    FICHAS.forEach((ficha) => {
      wordsOf(ficha).forEach((palavra) => {
        expect(palavra.syllables.join('')).toBe(palavra.text);
      });
    });
  });

  it('a resposta certa está sempre entre as opções', () => {
    FICHAS.forEach((ficha) => {
      ficha.questions.forEach((q) => {
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options).size).toBe(q.options.length);
      });
    });
  });

  it('cada ficha tem três perguntas com três opções', () => {
    FICHAS.forEach((ficha) => {
      expect(ficha.questions).toHaveLength(3);
      ficha.questions.forEach((q) => expect(q.options).toHaveLength(3));
    });
  });

  it('toda palavra do caça-palavras aparece no texto', () => {
    FICHAS.forEach((ficha) => {
      const noTexto = new Set(wordsOf(ficha).map((w) => w.text));
      ficha.hunt.forEach((alvo) => expect([...noTexto]).toContain(alvo));
    });
  });

  it('as palavras escondidas cabem na grade', () => {
    FICHAS.forEach((ficha) => {
      ficha.hunt.forEach((alvo) => expect(alvo.length).toBeLessThanOrEqual(8));
    });
  });
});

describe('missingSyllableItems', () => {
  it('esconde uma sílaba e oferece três opções, com a certa entre elas', () => {
    FICHAS.forEach((ficha) => {
      missingSyllableItems(ficha, 'semente').forEach((item) => {
        expect(item.options).toHaveLength(3);
        expect(new Set(item.options).size).toBe(3);
        expect(item.options).toContain(item.syllables[item.hiddenIndex]);
      });
    });
  });

  it('rende itens para toda ficha', () => {
    FICHAS.forEach((ficha) => {
      expect(missingSyllableItems(ficha, 'semente').length).toBeGreaterThan(0);
    });
  });

  it('devolve os mesmos itens para a mesma semente', () => {
    const ficha = READING_SHEETS.TIER_1[0];
    expect(missingSyllableItems(ficha, 'dia-1')).toEqual(missingSyllableItems(ficha, 'dia-1'));
  });

  it('os distratores mudam só a vogal, não o tamanho', () => {
    FICHAS.forEach((ficha) => {
      missingSyllableItems(ficha, 'semente').forEach((item) => {
        const certa = item.syllables[item.hiddenIndex];
        item.options.forEach((op) => expect(op).toHaveLength(certa.length));
      });
    });
  });
});

describe('splitWords', () => {
  it('só devolve palavras de duas sílabas para cima', () => {
    FICHAS.forEach((ficha) => {
      splitWords(ficha, 'semente').forEach((w) => {
        expect(w.syllables.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});

describe('buildHuntGrid', () => {
  it('esconde de fato todas as palavras pedidas', () => {
    FICHAS.forEach((ficha) => {
      const grade = buildHuntGrid(ficha.hunt, `s:${ficha.id}`);
      expect(grade.placements.map((p) => p.word).sort()).toEqual([...ficha.hunt].sort());

      grade.placements.forEach((p) => {
        let lida = '';
        for (let k = 0; k < p.word.length; k++) {
          lida += grade.cells[p.row + p.dRow * k][p.col + p.dCol * k];
        }
        expect(lida).toBe(p.word);
      });
    });
  });

  it('não deixa célula vazia', () => {
    FICHAS.forEach((ficha) => {
      buildHuntGrid(ficha.hunt, `s:${ficha.id}`).cells.forEach((linha) => {
        linha.forEach((letra) => expect(letra).not.toBe(''));
      });
    });
  });

  it('a grade é quadrada e cabe a maior palavra', () => {
    FICHAS.forEach((ficha) => {
      const grade = buildHuntGrid(ficha.hunt, `s:${ficha.id}`);
      const maior = Math.max(...ficha.hunt.map((w) => w.length));
      expect(grade.cells).toHaveLength(grade.size);
      grade.cells.forEach((linha) => expect(linha).toHaveLength(grade.size));
      expect(grade.size).toBeGreaterThanOrEqual(maior);
    });
  });

  it('mesma semente, mesma grade', () => {
    const alvos = ['PATO', 'LAGO', 'ASAS'];
    expect(buildHuntGrid(alvos, 'dia-1')).toEqual(buildHuntGrid(alvos, 'dia-1'));
  });
});

describe('wordBetween', () => {
  const grade = buildHuntGrid(['PATO', 'LAGO', 'ASAS'], 'dia-1');

  it('lê o que está entre duas células da mesma linha', () => {
    const p = grade.placements[0];
    const fim = { row: p.row + p.dRow * (p.word.length - 1), col: p.col + p.dCol * (p.word.length - 1) };
    expect(wordBetween(grade, { row: p.row, col: p.col }, fim)).toBe(p.word);
  });

  it('recusa a diagonal', () => {
    expect(wordBetween(grade, { row: 0, col: 0 }, { row: 2, col: 2 })).toBeNull();
  });
});

describe('matchesHunt', () => {
  it('aceita a palavra de trás para frente', () => {
    expect(matchesHunt('OTAP', ['PATO'])).toBe('PATO');
  });

  it('recusa o que não está na lista', () => {
    expect(matchesHunt('XYZ', ['PATO'])).toBeNull();
  });
});
