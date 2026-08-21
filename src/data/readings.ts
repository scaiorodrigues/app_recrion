/**
 * Fichas de leitura: um texto curto, fatiado em sílabas, e as perguntas que
 * nascem dele.
 *
 * É o formato das folhinhas de alfabetização: a criança lê um textinho e todos
 * os exercícios seguintes falam daquele mesmo texto. Isso muda o que está sendo
 * treinado — em vez de decodificar palavras soltas, ela precisa guardar o que
 * leu para responder depois.
 *
 * Só o texto e as perguntas são escritos à mão aqui. As sílabas que faltam, a
 * separação silábica e o caça-palavras saem daqui por derivação, em
 * `utils/reading.ts` — assim uma ficha nova é só texto e perguntas.
 */

import type { Tier } from '@/types';

export interface ReadingWord {
  text: string;
  /** Sílabas em maiúsculas, ex: ['PA', 'TO'] */
  syllables: string[];
}

export interface ReadingQuestion {
  prompt: string;
  /** Precisa estar entre as `options`. */
  answer: string;
  options: string[];
}

export interface ReadingSheet {
  id: string;
  title: string;
  /** Cena do texto, para a criança se situar antes de ler. */
  scene: string;
  /** Cada linha é uma frase do texto. */
  lines: ReadingWord[][];
  /** Palavras escondidas no caça-palavras. */
  hunt: string[];
  questions: ReadingQuestion[];
}

/** Atalho: monta a palavra a partir das sílabas. */
function w(...syllables: string[]): ReadingWord {
  return { text: syllables.join(''), syllables };
}

export const READING_SHEETS: Record<Tier, ReadingSheet[]> = {
  TIER_1: [
    {
      id: 'r_pato_joao',
      title: 'O PATO DE JOÃO',
      scene: '🦆',
      lines: [
        [w('JO', 'ÃO'), w('TEM'), w('UM'), w('PA', 'TO')],
        [w('O'), w('PA', 'TO'), w('NA', 'DA'), w('NO'), w('LA', 'GO')],
        [w('E', 'LE'), w('BA', 'TE'), w('AS'), w('A', 'SAS')],
        [w('JO', 'ÃO'), w('DÁ'), w('RI', 'SA', 'DA')],
      ],
      hunt: ['PATO', 'LAGO', 'ASAS'],
      questions: [
        { prompt: 'QUAL É O NOME DO MENINO?', answer: 'JOÃO', options: ['JOÃO', 'BETO', 'TITO'] },
        { prompt: 'ONDE O PATO NADA?', answer: 'NO LAGO', options: ['NO LAGO', 'NO MATO', 'NA CAMA'] },
        { prompt: 'O QUE O PATO BATE?', answer: 'AS ASAS', options: ['AS ASAS', 'OS PÉS', 'A PORTA'] },
      ],
    },
    {
      id: 'r_gata_mimi',
      title: 'A GATA MIMI',
      scene: '🐱',
      lines: [
        [w('A'), w('GA', 'TA'), w('MI', 'MI'), w('É'), w('PE', 'QUE', 'NA')],
        [w('E', 'LA'), w('TO', 'MA'), w('LEI', 'TE')],
        [w('MI', 'MI'), w('SO', 'BE'), w('NO'), w('SO', 'FÁ')],
        [w('DE', 'POIS'), w('E', 'LA'), w('DOR', 'ME')],
      ],
      hunt: ['GATA', 'LEITE', 'SOFÁ'],
      questions: [
        { prompt: 'QUAL É O NOME DA GATA?', answer: 'MIMI', options: ['MIMI', 'LILI', 'NANA'] },
        { prompt: 'O QUE A GATA TOMA?', answer: 'LEITE', options: ['LEITE', 'SUCO', 'ÁGUA'] },
        { prompt: 'ONDE A GATA SOBE?', answer: 'NO SOFÁ', options: ['NO SOFÁ', 'NO MURO', 'NA MESA'] },
      ],
    },
    {
      id: 'r_bolo_vovo',
      title: 'O BOLO DA VOVÓ',
      scene: '🎂',
      lines: [
        [w('A'), w('VO', 'VÓ'), w('FAZ'), w('UM'), w('BO', 'LO')],
        [w('O'), w('BO', 'LO'), w('TEM'), w('U', 'VA')],
        [w('LU', 'CAS'), w('PE', 'GA'), w('UM'), w('PE', 'DA', 'ÇO')],
        [w('E', 'LE'), w('A', 'CHA'), w('GOS', 'TO', 'SO')],
      ],
      hunt: ['BOLO', 'UVA', 'VOVÓ'],
      questions: [
        { prompt: 'QUEM FAZ O BOLO?', answer: 'A VOVÓ', options: ['A VOVÓ', 'O VOVÔ', 'A MAMÃE'] },
        { prompt: 'O QUE TEM NO BOLO?', answer: 'UVA', options: ['UVA', 'MEL', 'OVO'] },
        { prompt: 'QUEM PEGA UM PEDAÇO?', answer: 'LUCAS', options: ['LUCAS', 'PEDRO', 'TIAGO'] },
      ],
    },
  ],
  TIER_2: [
    {
      id: 'r_borboleta_azul',
      title: 'A BORBOLETA AZUL',
      scene: '🦋',
      lines: [
        [w('U', 'MA'), w('BOR', 'BO', 'LE', 'TA'), w('A', 'ZUL'), w('POU', 'SA'), w('NA'), w('FLOR')],
        [w('E', 'LA'), w('GOS', 'TA'), w('DO'), w('CHEI', 'RO'), w('DO'), w('JAR', 'DIM')],
        [w('CLA', 'RA'), w('OB', 'SER', 'VA'), w('DA'), w('JA', 'NE', 'LA')],
        [w('DE', 'POIS'), w('A'), w('BOR', 'BO', 'LE', 'TA'), w('VO', 'A'), w('EM', 'BO', 'RA')],
      ],
      hunt: ['FLOR', 'JARDIM', 'CLARA'],
      questions: [
        { prompt: 'DE QUE COR É A BORBOLETA?', answer: 'AZUL', options: ['AZUL', 'VERDE', 'AMARELA'] },
        { prompt: 'ONDE A BORBOLETA POUSA?', answer: 'NA FLOR', options: ['NA FLOR', 'NO MURO', 'NA JANELA'] },
        { prompt: 'QUEM OBSERVA A BORBOLETA?', answer: 'CLARA', options: ['CLARA', 'BRUNA', 'LARA'] },
      ],
    },
    {
      id: 'r_cachorro_pipoca',
      title: 'O CACHORRO PIPOCA',
      scene: '🐶',
      lines: [
        [w('PI', 'PO', 'CA'), w('É'), w('UM'), w('CA', 'CHOR', 'RO'), w('A', 'LE', 'GRE')],
        [w('E', 'LE'), w('COR', 'RE'), w('NO'), w('PAR', 'QUE'), w('TO', 'DA'), w('TAR', 'DE')],
        [w('MI', 'GUEL'), w('JO', 'GA'), w('A'), w('BO', 'LI', 'NHA'), w('LON', 'GE')],
        [w('PI', 'PO', 'CA'), w('BUS', 'CA'), w('E'), w('VOL', 'TA'), w('CON', 'TEN', 'TE')],
      ],
      hunt: ['PARQUE', 'TARDE', 'MIGUEL'],
      questions: [
        { prompt: 'QUAL É O NOME DO CACHORRO?', answer: 'PIPOCA', options: ['PIPOCA', 'PIPOCO', 'PITOCA'] },
        { prompt: 'ONDE ELE CORRE?', answer: 'NO PARQUE', options: ['NO PARQUE', 'NA PRAIA', 'NO QUINTAL'] },
        { prompt: 'O QUE MIGUEL JOGA?', answer: 'A BOLINHA', options: ['A BOLINHA', 'O GRAVETO', 'A CORDA'] },
      ],
    },
    {
      id: 'r_foguete_papel',
      title: 'O FOGUETE DE PAPEL',
      scene: '🚀',
      lines: [
        [w('BE', 'A', 'TRIZ'), w('FAZ'), w('UM'), w('FO', 'GUE', 'TE'), w('DE'), w('PA', 'PEL')],
        [w('E', 'LA'), w('PIN', 'TA'), w('O'), w('FO', 'GUE', 'TE'), w('DE'), w('VER', 'ME', 'LHO')],
        [w('O'), w('FO', 'GUE', 'TE'), w('SO', 'BE'), w('BEM'), w('AL', 'TO')],
        [w('DE', 'POIS'), w('E', 'LE'), w('CAI'), w('NA'), w('GRA', 'MA'), w('MO', 'LE')],
      ],
      hunt: ['PAPEL', 'GRAMA', 'ALTO'],
      questions: [
        { prompt: 'DE QUE É FEITO O FOGUETE?', answer: 'DE PAPEL', options: ['DE PAPEL', 'DE PANO', 'DE MADEIRA'] },
        { prompt: 'DE QUE COR ELA PINTA?', answer: 'VERMELHO', options: ['VERMELHO', 'AMARELO', 'ROXO'] },
        { prompt: 'ONDE O FOGUETE CAI?', answer: 'NA GRAMA', options: ['NA GRAMA', 'NA ÁGUA', 'NO TELHADO'] },
      ],
    },
  ],
  TIER_3: [
    {
      id: 'r_tartaruga_praia',
      title: 'A TARTARUGA DA PRAIA',
      scene: '🐢',
      lines: [
        [w('U', 'MA'), w('TAR', 'TA', 'RU', 'GA'), w('CHE', 'GOU'), w('NA'), w('PRA', 'IA'), w('AO'), w('A', 'MA', 'NHE', 'CER')],
        [w('E', 'LA'), w('CA', 'VOU'), w('UM'), w('BU', 'RA', 'CO'), w('FUN', 'DO'), w('NA'), w('A', 'RE', 'IA')],
        [w('DEN', 'TRO'), w('DE', 'LE'), w('DEI', 'XOU'), w('SEUS'), w('O', 'VOS'), w('COM'), w('CUI', 'DA', 'DO')],
        [w('DE', 'POIS'), w('VOL', 'TOU'), w('DE', 'VA', 'GAR'), w('PA', 'RA'), w('O'), w('MAR')],
      ],
      hunt: ['PRAIA', 'AREIA', 'OVOS'],
      questions: [
        { prompt: 'QUANDO A TARTARUGA CHEGOU?', answer: 'AO AMANHECER', options: ['AO AMANHECER', 'À NOITE', 'AO MEIO-DIA'] },
        { prompt: 'O QUE ELA CAVOU?', answer: 'UM BURACO', options: ['UM BURACO', 'UM TÚNEL', 'UMA CASA'] },
        { prompt: 'PARA ONDE ELA VOLTOU?', answer: 'PARA O MAR', options: ['PARA O MAR', 'PARA A MATA', 'PARA O RIO'] },
      ],
    },
    {
      id: 'r_biblioteca_bairro',
      title: 'A BIBLIOTECA DO BAIRRO',
      scene: '📚',
      lines: [
        [w('A'), w('BI', 'BLI', 'O', 'TE', 'CA'), w('DO'), w('BAIR', 'RO'), w('A', 'BRE'), w('CE', 'DO')],
        [w('HE', 'LE', 'NA'), w('PRO', 'CU', 'RA'), w('UM'), w('LI', 'VRO'), w('DE'), w('A', 'VEN', 'TU', 'RA')],
        [w('A'), w('BI', 'BLI', 'O', 'TE', 'CÁ', 'RI', 'A'), w('IN', 'DI', 'CA'), w('U', 'MA'), w('ES', 'TAN', 'TE')],
        [w('HE', 'LE', 'NA'), w('LÊ'), w('A'), w('TAR', 'DE'), w('IN', 'TEI', 'RA')],
      ],
      hunt: ['LIVRO', 'BAIRRO', 'TARDE'],
      questions: [
        { prompt: 'QUANDO A BIBLIOTECA ABRE?', answer: 'CEDO', options: ['CEDO', 'TARDE', 'À NOITE'] },
        { prompt: 'QUE LIVRO HELENA PROCURA?', answer: 'DE AVENTURA', options: ['DE AVENTURA', 'DE RECEITAS', 'DE HISTÓRIA'] },
        { prompt: 'QUEM INDICA A ESTANTE?', answer: 'A BIBLIOTECÁRIA', options: ['A BIBLIOTECÁRIA', 'A PROFESSORA', 'A MÃE'] },
      ],
    },
  ],
  TIER_4: [
    {
      id: 'r_astronomia_quintal',
      title: 'O TELESCÓPIO NO QUINTAL',
      scene: '🔭',
      lines: [
        [w('NO'), w('QUIN', 'TAL'), w('ES', 'CU', 'RO'), w('RA', 'FA', 'EL'), w('MON', 'TOU'), w('O'), w('TE', 'LES', 'CÓ', 'PI', 'O')],
        [w('E', 'LE'), w('A', 'PON', 'TOU'), w('O'), w('A', 'PA', 'RE', 'LHO'), w('PA', 'RA'), w('JÚ', 'PI', 'TER')],
        [w('QUA', 'TRO'), w('LU', 'AS'), w('A', 'PA', 'RE', 'CE', 'RAM'), w('EM'), w('FI', 'LA')],
        [w('RA', 'FA', 'EL'), w('A', 'NO', 'TOU'), w('TU', 'DO'), w('NO'), w('CA', 'DER', 'NO')],
      ],
      hunt: ['LUAS', 'FILA', 'TUDO'],
      questions: [
        { prompt: 'ONDE RAFAEL MONTOU O TELESCÓPIO?', answer: 'NO QUINTAL', options: ['NO QUINTAL', 'NO TELHADO', 'NA VARANDA'] },
        { prompt: 'PARA ONDE ELE APONTOU?', answer: 'PARA JÚPITER', options: ['PARA JÚPITER', 'PARA MARTE', 'PARA A LUA'] },
        { prompt: 'QUANTAS LUAS APARECERAM?', answer: 'QUATRO', options: ['QUATRO', 'TRÊS', 'CINCO'] },
      ],
    },
    {
      id: 'r_horta_escola',
      title: 'A HORTA DA ESCOLA',
      scene: '🌱',
      lines: [
        [w('A'), w('TUR', 'MA'), w('DA'), w('MA', 'NHÃ'), w('CUI', 'DA'), w('DA'), w('HOR', 'TA'), w('DA'), w('ES', 'CO', 'LA')],
        [w('CA', 'DA'), w('A', 'LU', 'NO'), w('FI', 'COU'), w('RES', 'PON', 'SÁ', 'VEL'), w('POR'), w('UM'), w('CAN', 'TEI', 'RO')],
        [w('E', 'LES'), w('RE', 'GAM'), w('AS'), w('MU', 'DAS'), w('TO', 'DAS'), w('AS'), w('MA', 'NHÃS')],
        [w('EM'), w('DOIS'), w('ME', 'SES'), w('A'), w('PRI', 'MEI', 'RA'), w('CO', 'LHEI', 'TA'), w('CHE', 'GOU')],
      ],
      hunt: ['HORTA', 'MUDAS', 'MESES'],
      questions: [
        { prompt: 'QUEM CUIDA DA HORTA?', answer: 'A TURMA DA MANHÃ', options: ['A TURMA DA MANHÃ', 'A TURMA DA TARDE', 'OS PROFESSORES'] },
        { prompt: 'PELO QUE CADA ALUNO FICOU RESPONSÁVEL?', answer: 'POR UM CANTEIRO', options: ['POR UM CANTEIRO', 'POR UMA ÁRVORE', 'POR UM REGADOR'] },
        { prompt: 'EM QUANTO TEMPO VEIO A COLHEITA?', answer: 'EM DOIS MESES', options: ['EM DOIS MESES', 'EM UMA SEMANA', 'EM UM ANO'] },
      ],
    },
  ],
};

export function readingsForTier(tier: Tier): ReadingSheet[] {
  return READING_SHEETS[tier];
}

/** Todas as palavras do texto, em ordem, sem repetir. */
export function wordsOf(sheet: ReadingSheet): ReadingWord[] {
  const seen = new Set<string>();
  const out: ReadingWord[] = [];
  for (const line of sheet.lines) {
    for (const word of line) {
      if (seen.has(word.text)) continue;
      seen.add(word.text);
      out.push(word);
    }
  }
  return out;
}

export default READING_SHEETS;
