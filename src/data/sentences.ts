/**
 * Banco de frases das atividades de leitura, por faixa etária.
 *
 * Cada frase vem com a cena que ela descreve e cenas erradas para a criança
 * escolher entre elas. As cenas são feitas de emojis de propósito: a criança
 * de 7 anos ainda lê devagar, e a figura precisa ser reconhecida de relance
 * para que o esforço fique na leitura da frase, não em decifrar o desenho.
 *
 * As cenas erradas nunca são aleatórias — cada uma erra a frase em UM ponto
 * (troca quem faz, troca a ação ou troca o lugar), para que acertar dependa de
 * ler a frase inteira, e não de reconhecer só a primeira palavra.
 */

import type { Tier } from '@/types';

export interface SentenceEntry {
  id: string;
  /** Palavras na ordem certa, em maiúsculas. */
  words: string[];
  /** A cena que a frase descreve. */
  scene: string;
  /** Cenas erradas, cada uma trocando um elemento da frase. */
  distractors: string[];
}

export const SENTENCES_BY_TIER: Record<Tier, SentenceEntry[]> = {
  TIER_1: [
    { id: 's_gato_leite', words: ['O', 'GATO', 'BEBE', 'LEITE'], scene: '🐱🥛', distractors: ['🐶🥛', '🐱🍖'] },
    { id: 's_sapo_lagoa', words: ['O', 'SAPO', 'PULA', 'NA', 'LAGOA'], scene: '🐸💦', distractors: ['🐰💦', '🐸🌵'] },
    { id: 's_pato_lago', words: ['O', 'PATO', 'NADA', 'NO', 'LAGO'], scene: '🦆🌊', distractors: ['🐔🌊', '🦆🌳'] },
    { id: 's_lua_ceu', words: ['A', 'LUA', 'BRILHA', 'NO', 'CÉU'], scene: '🌙✨', distractors: ['☀️✨', '🌙🌊'] },
    { id: 's_bolo_velas', words: ['O', 'BOLO', 'TEM', 'VELAS'], scene: '🎂🕯️', distractors: ['🍞🕯️', '🎂🎈'] },
    { id: 's_menina_bola', words: ['A', 'MENINA', 'CHUTA', 'A', 'BOLA'], scene: '👧⚽', distractors: ['👦⚽', '👧🎸'] },
    { id: 's_peixe_agua', words: ['O', 'PEIXE', 'VIVE', 'NA', 'ÁGUA'], scene: '🐟💧', distractors: ['🐦💧', '🐟🏜️'] },
    { id: 's_flor_jardim', words: ['A', 'FLOR', 'NASCE', 'NO', 'JARDIM'], scene: '🌸🌱', distractors: ['🍄🌱', '🌸❄️'] },
    { id: 's_sol_dia', words: ['O', 'SOL', 'APARECE', 'DE', 'DIA'], scene: '☀️🌅', distractors: ['🌙🌅', '☀️🌃'] },
    { id: 's_uva_cacho', words: ['A', 'UVA', 'FICA', 'NO', 'CACHO'], scene: '🍇🌿', distractors: ['🍎🌿', '🍇🥫'] },
  ],
  TIER_2: [
    { id: 's_elefante_rio', words: ['O', 'ELEFANTE', 'TOMA', 'BANHO', 'NO', 'RIO'], scene: '🐘🚿', distractors: ['🦏🚿', '🐘🏜️'] },
    { id: 's_borboleta_flor', words: ['A', 'BORBOLETA', 'POUSA', 'NA', 'FLOR'], scene: '🦋🌸', distractors: ['🐝🌸', '🦋🪨'] },
    { id: 's_cachorro_parque', words: ['O', 'CACHORRO', 'CORRE', 'NO', 'PARQUE'], scene: '🐶🌳', distractors: ['🐱🌳', '🐶🛏️'] },
    { id: 's_girafa_folhas', words: ['A', 'GIRAFA', 'COME', 'FOLHAS', 'ALTAS'], scene: '🦒🌿', distractors: ['🐐🌿', '🦒🍖'] },
    { id: 's_cavalo_campo', words: ['O', 'CAVALO', 'GALOPA', 'NO', 'CAMPO'], scene: '🐴🌾', distractors: ['🐄🌾', '🐴🏙️'] },
    { id: 's_foguete_lua', words: ['O', 'FOGUETE', 'VOA', 'ATÉ', 'A', 'LUA'], scene: '🚀🌙', distractors: ['✈️🌙', '🚀🌊'] },
    { id: 's_sorvete_sol', words: ['O', 'SORVETE', 'DERRETE', 'NO', 'SOL'], scene: '🍦☀️', distractors: ['🍫☀️', '🍦❄️'] },
    { id: 's_banana_macaco', words: ['O', 'MACACO', 'DESCASCA', 'A', 'BANANA'], scene: '🐵🍌', distractors: ['🐘🍌', '🐵🥥'] },
    { id: 's_janela_aberta', words: ['A', 'JANELA', 'DA', 'CASA', 'ESTÁ', 'ABERTA'], scene: '🏠🪟', distractors: ['🏫🪟', '🏠🚪'] },
    { id: 's_abacaxi_feira', words: ['O', 'ABACAXI', 'ESTÁ', 'NA', 'FEIRA'], scene: '🍍🧺', distractors: ['🍉🧺', '🍍🧊'] },
  ],
  TIER_3: [
    { id: 's_tartaruga_areia', words: ['A', 'TARTARUGA', 'ANDA', 'DEVAGAR', 'NA', 'AREIA'], scene: '🐢🏖️', distractors: ['🐇🏖️', '🐢🏔️'] },
    { id: 's_bicicleta_ladeira', words: ['A', 'BICICLETA', 'DESCE', 'A', 'LADEIRA'], scene: '🚲⛰️', distractors: ['🛴⛰️', '🚲🌊'] },
    { id: 's_dinossauro_museu', words: ['O', 'DINOSSAURO', 'FICA', 'NO', 'MUSEU'], scene: '🦕🏛️', distractors: ['🐊🏛️', '🦕🏖️'] },
    { id: 's_geladeira_gelo', words: ['A', 'GELADEIRA', 'GUARDA', 'O', 'GELO'], scene: '🧊❄️', distractors: ['🔥❄️', '🧊🌵'] },
    { id: 's_biblioteca_livros', words: ['A', 'BIBLIOTECA', 'GUARDA', 'MUITOS', 'LIVROS'], scene: '📚🏛️', distractors: ['🍽️🏛️', '📚🎪'] },
    { id: 's_telefone_toca', words: ['O', 'TELEFONE', 'TOCA', 'NA', 'MESA'], scene: '📞🔔', distractors: ['⏰🔔', '📞🤫'] },
    { id: 's_helicoptero_ceu', words: ['O', 'HELICÓPTERO', 'POUSA', 'NO', 'TELHADO'], scene: '🚁🏢', distractors: ['🚁🌊', '✈️🏢'] },
    { id: 's_computador_mesa', words: ['O', 'COMPUTADOR', 'LIGA', 'COM', 'UM', 'BOTÃO'], scene: '💻🔘', distractors: ['📻🔘', '💻🔌'] },
  ],
  TIER_4: [
    { id: 's_astronomia_estrelas', words: ['A', 'ASTRONOMIA', 'ESTUDA', 'AS', 'ESTRELAS'], scene: '🔭⭐', distractors: ['🔬⭐', '🔭🌋'] },
    { id: 's_imaginacao_historias', words: ['A', 'IMAGINAÇÃO', 'CRIA', 'HISTÓRIAS', 'NOVAS'], scene: '💭📖', distractors: ['💤📖', '💭🧮'] },
    { id: 's_curiosidade_perguntas', words: ['A', 'CURIOSIDADE', 'FAZ', 'MUITAS', 'PERGUNTAS'], scene: '🔍❓', distractors: ['😴❓', '🔍🤐'] },
    { id: 's_generosidade_partilha', words: ['A', 'GENEROSIDADE', 'REPARTE', 'O', 'QUE', 'TEM'], scene: '💝🤲', distractors: ['🔒🤲', '💝🚫'] },
    { id: 's_responsabilidade_combinado', words: ['A', 'RESPONSABILIDADE', 'CUMPRE', 'O', 'COMBINADO'], scene: '🤝✅', distractors: ['🤝❌', '🎲✅'] },
    { id: 's_pensamento_ideias', words: ['O', 'PENSAMENTO', 'ORGANIZA', 'AS', 'IDEIAS'], scene: '🧠💡', distractors: ['🧠🌀', '🦶💡'] },
  ],
};

export function sentencesForTier(tier: Tier): SentenceEntry[] {
  return SENTENCES_BY_TIER[tier];
}

/** A frase escrita por extenso, como a criança vê. */
export function sentenceText(entry: SentenceEntry): string {
  return `${entry.words.join(' ')}.`;
}

export default SENTENCES_BY_TIER;
