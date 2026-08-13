/**
 * Os exercícios de cada matéria.
 *
 * Vale uma atividade por matéria por dia, então a criança escolhe UM exercício e
 * é ele que vira a atividade do dia. A variedade acontece entre os dias, não
 * dentro do mesmo dia — é a constância do método do professor Pier: pouco por
 * dia, sempre.
 *
 * `autoGraded` separa os dois mundos: os exercícios de tocar se corrigem na hora
 * e já nascem aprovados; os manuscritos vão para o responsável validar.
 */

import type { AcademicSubject } from '@/types';

export const PORTUGUESE_EXERCISES = [
  {
    id: 'ligar-palavra',
    title: 'Ligue à figura',
    emoji: '🔗',
    description: 'Leia a palavra e ache a figura dela',
    route: '/(child)/activities/word-picture',
    autoGraded: true,
  },
  {
    id: 'ler-frase',
    title: 'Leia e escolha',
    emoji: '📖',
    description: 'Leia a frase e escolha o que ela diz',
    route: '/(child)/activities/sentence-picture',
    autoGraded: true,
  },
  {
    id: 'ordenar-frase',
    title: 'Monte a frase',
    emoji: '🧩',
    description: 'Coloque as palavras na ordem certa',
    route: '/(child)/activities/sentence-order',
    autoGraded: true,
  },
  {
    id: 'silabas',
    title: 'Palavras e sílabas',
    emoji: '✏️',
    description: 'Escreva à mão e mostre para o papai ou a mamãe',
    route: '/(child)/activities/syllables',
    autoGraded: false,
  },
] as const;

export type PortugueseExercise = (typeof PORTUGUESE_EXERCISES)[number];

/** Onde cada matéria manda a criança escolher o exercício do dia. */
export const SUBJECT_ENTRY_ROUTE = {
  portugues: '/(child)/activities/portugues',
} as const satisfies Partial<Record<AcademicSubject, string>>;

export default PORTUGUESE_EXERCISES;
