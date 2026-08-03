/**
 * Gera src/data/crions.ts a partir das espécies curadas abaixo.
 * Rodar com: node scripts/generate-crions.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/data/crions.ts');

// ---------------------------------------------------------------------------
// Escalas de atributos por raridade
// ---------------------------------------------------------------------------

const RARITY_STATS = {
  COMMON: { hp: [60, 75], atk: [20, 32], def: [15, 28], spd: [20, 40] },
  UNCOMMON: { hp: [80, 100], atk: [35, 48], def: [30, 44], spd: [35, 55] },
  RARE: { hp: [105, 130], atk: [52, 68], def: [46, 60], spd: [45, 65] },
  EPIC: { hp: [140, 170], atk: [72, 92], def: [62, 80], spd: [60, 80] },
  LEGENDARY: { hp: [180, 200], atk: [100, 120], def: [80, 100], spd: [85, 110] },
};

/** Poder base dos 4 slots por raridade. */
const RARITY_ATTACK_POWER = {
  COMMON: [25, 35, 20, 55],
  UNCOMMON: [30, 42, 28, 65],
  RARE: [40, 55, 38, 80],
  EPIC: [52, 70, 50, 100],
  LEGENDARY: [65, 85, 72, 135],
};

const SLOT_ACCURACY = [95, 90, 85, 78];

/**
 * Pose da criatura em cada slot de ataque. É o que faz a MESMA criatura
 * aparecer em cartas diferentes conforme a habilidade que está usando.
 */
const SLOT_POSE = [
  'crouched low and lunging forward in a quick opening strike, weight on the front paws, eyes focused',
  'mid-spin with the body twisted for a heavy blow, limbs extended, motion trail behind it',
  'standing upright and channelling energy, head tilted back, forelimbs raised, energy gathering at the chest',
  'at full power in the finishing move, body arched, mouth open in a roar, energy erupting outward',
];

/** Intensidade do efeito elemental, do slot 1 ao 4. */
const SLOT_EFFECT_INTENSITY = [
  'a few small wisps close to the body',
  'a clear swirling burst around the torso',
  'a dense concentrated orb with radiating streaks',
  'an overwhelming explosion filling the whole frame',
];

/** Epíteto que vira o subtítulo da carta, por raridade. */
const RARITY_EPITHET = {
  COMMON: 'Filhote',
  UNCOMMON: 'Aprendiz',
  RARE: 'Guardião',
  EPIC: 'Ancestral',
  LEGENDARY: 'de Elite',
};
const SLOT_UNLOCK_XP = [0, 40, 70, 95];

/** Distribuição pedida: 4 comuns, 4 incomuns, 3 raros, 2 épicos, 1 lendário. */
const RARITY_PLAN = [
  { rarity: 'COMMON', count: 4, tiers: ['TIER_1', 'TIER_1', 'TIER_1', 'TIER_1'] },
  { rarity: 'UNCOMMON', count: 4, tiers: ['TIER_1', 'TIER_1', 'TIER_2', 'TIER_2'] },
  { rarity: 'RARE', count: 3, tiers: ['TIER_2', 'TIER_3', 'TIER_3'] },
  { rarity: 'EPIC', count: 2, tiers: ['TIER_3', 'TIER_4'] },
  { rarity: 'LEGENDARY', count: 1, tiers: ['TIER_4'] },
];

// ---------------------------------------------------------------------------
// Vocabulário elemental — nomes de ataques, habitats e descritores visuais
// ---------------------------------------------------------------------------

const ELEMENTS = {
  NATURE: {
    label: 'Natureza',
    colorWord: 'emerald green',
    habitats: ['Clareira Viva', 'Floresta Antiga', 'Bosque das Sementes', 'Vale Florido'],
    attackNames: [
      ['Folha Cortante', 'Um corte rápido feito de folhas afiadas'],
      ['Raiz Prendedora', 'Raízes brotam do chão e prendem o inimigo'],
      ['Pólen do Sono', 'Uma nuvem dourada que confunde quem respira'],
      ['Fúria da Mata', 'Toda a floresta responde ao chamado'],
    ],
    effect3: 'CONFUSE',
    lore: [
      'Nasce quando uma criança descobre o prazer de ler em voz alta.',
      'Cresce um pouquinho a cada palavra nova que a criança aprende.',
      'Dizem que ele guarda todas as histórias já contadas na floresta.',
      'Sua força vem da paciência de quem cuida de algo até florescer.',
    ],
  },
  FIRE: {
    label: 'Fogo',
    colorWord: 'warm orange and red',
    habitats: ['Vulcão Encantado', 'Campo de Brasas', 'Forja Adormecida', 'Deserto Ardente'],
    attackNames: [
      ['Faísca Veloz', 'Uma centelha rápida que sempre acerta'],
      ['Labareda Dupla', 'Duas línguas de fogo em sequência'],
      ['Sopro Escaldante', 'Um bafo quente que deixa o inimigo em chamas'],
      ['Explosão Solar', 'Uma bola de fogo que ilumina todo o campo'],
    ],
    effect3: 'BURN',
    lore: [
      'Nasce da centelha que acende quando um número finalmente faz sentido.',
      'Cada conta resolvida deixa sua chama um tom mais brilhante.',
      'Não queima quem tem coragem de tentar de novo.',
      'Sua chama nunca apaga enquanto houver curiosidade.',
    ],
  },
  WATER: {
    label: 'Água',
    colorWord: 'deep blue and cyan',
    habitats: ['Margem de Rio', 'Lagoa Cristalina', 'Recife Cantante', 'Cachoeira Secreta'],
    attackNames: [
      ["Bolha d'Água", 'Uma bolha que estoura com força surpreendente'],
      ['Jato Aquático', 'Um jato preciso que empurra o inimigo'],
      ['Névoa Aquática', 'Uma bruma densa que deixa o inimigo perdido'],
      ['Torrente Pura', 'Uma onda inteira desaba sobre o campo'],
    ],
    effect3: 'CONFUSE',
    lore: [
      'Nasce quando uma criança arrisca falar uma palavra em outra língua.',
      'Flui melhor quando ninguém tem medo de errar a pronúncia.',
      'Guarda no corpo o som de todas as línguas do mundo.',
      'Sua água carrega palavras de lugares que ninguém visitou ainda.',
    ],
  },
  EARTH: {
    label: 'Terra',
    colorWord: 'earthy brown and amber',
    habitats: ['Caverna de Cristal', 'Planalto Vermelho', 'Jardim de Pedras', 'Gruta Profunda'],
    attackNames: [
      ['Pedrada Certeira', 'Uma pedra pequena, mas muito bem mirada'],
      ['Tremor Curto', 'O chão treme e desequilibra o inimigo'],
      ['Areia nos Olhos', 'Levanta poeira e atrapalha a mira do inimigo'],
      ['Terremoto', 'A terra inteira se levanta de uma vez'],
    ],
    effect3: 'CONFUSE',
    lore: [
      'Nasce da primeira vez que uma criança pergunta "por quê?".',
      'Carrega no casco a memória de tudo que já foi descoberto.',
      'Fica mais pesado a cada experiência que dá certo.',
      'Sabe o nome de cada pedra do caminho.',
    ],
  },
  METAL: {
    label: 'Metal',
    colorWord: 'silver and steel gray',
    habitats: ['Oficina Esquecida', 'Mina de Prata', 'Torre de Engrenagens', 'Salão de Aço'],
    attackNames: [
      ['Garra de Aço', 'Um golpe curto e afiado como uma lâmina'],
      ['Engrenagem Girante', 'Gira em alta velocidade contra o inimigo'],
      ['Campo Magnético', 'Prende o inimigo em um campo que paralisa'],
      ['Lâmina Definitiva', 'Um corte único, calculado até o último detalhe'],
    ],
    effect3: 'PARALYZE',
    lore: [
      'Nasce quando uma criança monta um quebra-cabeça sozinha.',
      'Cada peça encaixada deixa suas engrenagens mais afinadas.',
      'Pensa três passos à frente antes de qualquer movimento.',
      'Não existe problema que ele não tente desmontar.',
    ],
  },
  WIND: {
    label: 'Vento',
    colorWord: 'soft violet and lavender',
    habitats: ['Penhasco Ventoso', 'Ateliê nas Nuvens', 'Campo Aberto', 'Pico dos Sussurros'],
    attackNames: [
      ['Rajada Leve', 'Um sopro rápido que pega o inimigo de surpresa'],
      ['Espiral de Ar', 'Um redemoinho que ergue tudo pelo caminho'],
      ['Sopro Confuso', 'Um vento que gira e desorienta o inimigo'],
      ['Ciclone Criador', 'Um furacão que redesenha o campo de batalha'],
    ],
    effect3: 'CONFUSE',
    lore: [
      'Nasce do primeiro rabisco que vira desenho de verdade.',
      'Muda de cor conforme a imaginação de quem o criou.',
      'Nunca pinta a mesma coisa duas vezes.',
      'Seu vento carrega todas as cores que ainda não têm nome.',
    ],
  },
  ELECTRIC: {
    label: 'Elétrico',
    colorWord: 'bright yellow and gold',
    habitats: ['Ilha dos Sons', 'Campo de Raios', 'Anfiteatro Elétrico', 'Nuvem Cantante'],
    attackNames: [
      ['Nota Faiscante', 'Uma nota musical que estala no ar'],
      ['Acorde Trovejante', 'Três notas que explodem juntas'],
      ['Choque Ritmado', 'Uma descarga no ritmo certo que paralisa'],
      ['Sinfonia Elétrica', 'Uma orquestra inteira de raios'],
    ],
    effect3: 'PARALYZE',
    lore: [
      'Nasce quando uma criança acerta o ritmo pela primeira vez.',
      'Vibra junto com qualquer música que escuta.',
      'Seu coração bate no compasso da canção favorita da criança.',
      'Guarda todas as melodias que já fizeram alguém sorrir.',
    ],
  },
  LIGHT: {
    label: 'Luz',
    colorWord: 'warm gold and white',
    habitats: ['Jardim Encantado', 'Clareira das Estrelas', 'Templo da Aurora', 'Planície Celestial'],
    attackNames: [
      ['Brilho Gentil', 'Uma luz suave que aquece o coração'],
      ['Farol da Bondade', 'Ilumina o caminho de quem está perdido'],
      ['Cura Radiante', 'Restaura parte do próprio HP'],
      ['Aurora Sagrada', 'Uma explosão de luz pura que cega o inimigo'],
    ],
    effect3: 'HEAL_SELF',
    lore: [
      'Nasce quando uma criança cumpre suas obrigações com alegria.',
      'Seu brilho fica mais forte perto de quem ela ama.',
      'Aparece só para quem faz o certo sem ninguém mandar.',
      'Guarda a memória de cada pequeno gesto de gentileza.',
    ],
  },
  ICE_NPC: {
    label: 'Gelo',
    colorWord: 'icy blue and white',
    habitats: ['Tundra Gelada', 'Geleira Eterna', 'Caverna de Gelo', 'Pico Congelado'],
    attackNames: [
      ['Lasca Gelada', 'Um estilhaço de gelo afiado'],
      ['Vento Polar', 'Uma ventania congelante'],
      ['Prisão de Gelo', 'Congela o inimigo no lugar'],
      ['Nevasca Total', 'Uma tempestade branca que cobre tudo'],
    ],
    effect3: 'FREEZE',
    lore: [
      'Habita as terras onde nenhum Crion da criança nasce.',
      'Guarda a fronteira gelada que separa os mundos.',
      'Só aparece para quem já enfrentou muitos desafios.',
      'Seu frio testa a determinação de quem chega até ele.',
    ],
  },
};

// ---------------------------------------------------------------------------
// Espécies: 14 animais por elemento, em ordem de raridade crescente
// ---------------------------------------------------------------------------

const SPECIES = {
  NATURE: [
    ['Folhim', 'Lagarta', 'small fuzzy caterpillar with leaf-shaped segments', '🐛'],
    ['Sementra', 'Esquilo', 'tiny squirrel with sprouting acorn tail', '🐿️'],
    ['Musguito', 'Tatu-bola', 'round armadillo covered in soft green moss', '🦔'],
    ['Brotinho', 'Coelho', 'baby rabbit with leaf ears and flower nose', '🐰'],
    ['Cipoalho', 'Preguiça', 'gentle sloth hanging from glowing vines', '🦥'],
    ['Florpardo', 'Cervo', 'young deer with flowering antlers', '🦌'],
    ['Raizuto', 'Toupeira', 'mole with root-like whiskers and earthy fur', '🐁'],
    ['Trevoso', 'Sapo-verde', 'green frog wearing a four-leaf clover crown', '🐸'],
    ['Bambuz', 'Panda', 'small panda with bamboo shoots on its back', '🐼'],
    ['Carvalhon', 'Urso', 'sturdy bear with oak bark armor', '🐻'],
    ['Vinhedra', 'Serpente', 'elegant vine serpent with blooming scales', '🐍'],
    ['Silvantis', 'Alce', 'majestic elk with a small forest growing on antlers', '🫎'],
    ['Guardavor', 'Gorila', 'powerful gorilla guardian covered in ancient moss', '🦍'],
    ['Arvoreth', 'Ent-Cervo', 'legendary tree-deer fusion with a canopy of golden leaves', '🌳'],
  ],
  FIRE: [
    ['Faguinho', 'Pintinho', 'tiny chick with ember-tipped feathers', '🐤'],
    ['Brasato', 'Rato', 'small mouse with a glowing ember tail', '🐭'],
    ['Chamito', 'Salamandra', 'little salamander with flickering flame patterns', '🦎'],
    ['Fogacho', 'Raposa', 'fox kit with fire-orange fur and smoking paws', '🦊'],
    ['Cinzarro', 'Cão', 'loyal dog made of warm ash and embers', '🐕'],
    ['Lavarto', 'Lagarto', 'lizard with molten lava veins under its scales', '🦎'],
    ['Pirogato', 'Gato', 'cat with a mane of dancing flames', '🐈'],
    ['Fornalh', 'Javali', 'boar with a furnace glowing inside its chest', '🐗'],
    ['Vulcanor', 'Rinoceronte', 'rhino with a volcanic crater on its back', '🦏'],
    ['Ignaro', 'Leão', 'lion with a mane of pure fire', '🦁'],
    ['Magmoth', 'Mamute', 'mammoth with tusks of cooling magma', '🦣'],
    ['Solflama', 'Águia', 'eagle with wings of solar flame', '🦅'],
    ['Draconis', 'Dragão', 'young dragon with obsidian scales and fire breath', '🐉'],
    ['Emberon', 'Fênix', 'legendary phoenix with golden and red ember-glow feathers', '🔥'],
  ],
  WATER: [
    ['Salphin', 'Sapo', 'cute frog with glowing blue patterns and floating droplets', '🐸'],
    ['Gotinha', 'Peixinho', 'tiny fish made of a single shimmering water drop', '🐠'],
    ['Conchito', 'Caramujo', 'small snail with a pearl-blue spiral shell', '🐌'],
    ['Bolhoto', 'Polvo-bebê', 'baby octopus blowing glowing bubbles', '🐙'],
    ['Nadalí', 'Lontra', 'playful otter with water-swirl markings', '🦦'],
    ['Marisco', 'Caranguejo', 'crab with translucent aquamarine claws', '🦀'],
    ['Ondino', 'Cavalo-marinho', 'seahorse riding a small perpetual wave', '🐴'],
    ['Chuvisco', 'Pato', 'duck with a tiny raincloud always above it', '🦆'],
    ['Correntor', 'Tartaruga', 'turtle with a shell of flowing river water', '🐢'],
    ['Golfino', 'Golfinho', 'dolphin with luminous tidal patterns', '🐬'],
    ['Abissal', 'Arraia', 'deep-sea ray glowing with bioluminescent blue', '🐟'],
    ['Marejante', 'Orca', 'orca surrounded by a spiraling water vortex', '🐋'],
    ['Krakenzo', 'Lula-gigante', 'giant squid with storm-blue tentacles', '🦑'],
    ['Leviathis', 'Serpente-Marinha', 'legendary sea serpent crowned with a crashing wave', '🐉'],
  ],
  EARTH: [
    ['Pedrinho', 'Besouro', 'small beetle with a pebble shell', '🪲'],
    ['Barrolo', 'Minhoca', 'friendly earthworm with clay-colored rings', '🪱'],
    ['Territo', 'Hamster', 'hamster with soil-brown fur and crystal cheeks', '🐹'],
    ['Cascalho', 'Tatu', 'armadillo with a shell of packed gravel', '🦔'],
    ['Argilon', 'Porquinho', 'little pig made of warm terracotta clay', '🐷'],
    ['Cristallo', 'Ouriço', 'hedgehog with amber crystal spines', '🦔'],
    ['Rochedo', 'Cabra', 'mountain goat with stone hooves', '🐐'],
    ['Dunaris', 'Camelo', 'camel with a hump of shifting golden sand', '🐫'],
    ['Granito', 'Búfalo', 'buffalo with granite horns and dust aura', '🐃'],
    ['Cavernal', 'Urso-das-cavernas', 'cave bear with glowing geode fur', '🐻'],
    ['Fossilio', 'Tatu-gigante', 'giant armadillo with fossil-plated armor', '🦫'],
    ['Montanhor', 'Iaque', 'yak carrying a small mountain peak on its back', '🐂'],
    ['Titanargo', 'Elefante', 'elephant with tectonic plate armor', '🐘'],
    ['Gaiathon', 'Golem-Tartaruga', 'legendary turtle-golem with a continent on its shell', '🐢'],
  ],
  METAL: [
    ['Parafuso', 'Formiga', 'tiny ant with bolt-shaped body segments', '🐜'],
    ['Molinha', 'Aranha', 'small spider with spring-coil legs', '🕷️'],
    ['Chavinha', 'Rato-mecânico', 'clockwork mouse with a wind-up key', '🐁'],
    ['Engrenim', 'Joaninha', 'ladybug with gear-patterned wings', '🐞'],
    ['Ferrucho', 'Gambá', 'skunk with polished steel stripes', '🦨'],
    ['Cromado', 'Camaleão', 'chameleon with mirror-chrome skin', '🦎'],
    ['Bússolo', 'Pombo', 'pigeon with a compass embedded in its chest', '🕊️'],
    ['Aciarto', 'Rinoceronte-metálico', 'small rhino plated in brushed steel', '🦏'],
    ['Turbino', 'Falcão', 'falcon with turbine-engine wings', '🦅'],
    ['Blindor', 'Rinoceronte', 'rhino in full riveted plate armor', '🦏'],
    ['Mecatron', 'Escorpião', 'scorpion built from precision machinery', '🦂'],
    ['Fortalez', 'Tatu-blindado', 'armadillo fortress with retractable steel panels', '🦔'],
    ['Colossum', 'Golem', 'towering steel golem with glowing gear-heart', '🗿'],
    ['Adamantis', 'Dragão-de-Aço', 'legendary steel dragon forged from living metal', '🐉'],
  ],
  WIND: [
    ['Pluminha', 'Beija-flor', 'tiny hummingbird trailing violet wind ribbons', '🐦'],
    ['Sopruco', 'Morcego', 'small bat with translucent breeze wings', '🦇'],
    ['Voante', 'Libélula', 'dragonfly with paintbrush-tipped wings', '🦋'],
    ['Nuvezinho', 'Ovelha', 'fluffy lamb made of small clouds', '🐑'],
    ['Papelão', 'Andorinha', 'swallow made of folded origami paper', '🐦'],
    ['Piruetta', 'Gato-voador', 'cat spinning inside a gentle whirlwind', '🐈'],
    ['Aquarel', 'Papagaio', 'parrot with watercolor-splash feathers', '🦜'],
    ['Rajador', 'Falcão', 'falcon riding a permanent updraft', '🦅'],
    ['Vendaval', 'Lobo', 'wolf made of swirling wind currents', '🐺'],
    ['Pincelis', 'Pavão', 'peacock whose tail paints the air', '🦚'],
    ['Tornador', 'Águia', 'eagle at the eye of a small tornado', '🦅'],
    ['Céuartis', 'Cavalo-alado', 'winged horse leaving rainbow brushstrokes', '🦄'],
    ['Ciclonis', 'Grifo', 'griffin commanding a spiraling storm', '🦅'],
    ['Zephiron', 'Fênix-do-Vento', 'legendary wind phoenix woven from aurora and air', '🕊️'],
  ],
  ELECTRIC: [
    ['Faiscoto', 'Vaga-lume', 'firefly blinking in musical rhythm', '🪰'],
    ['Notinha', 'Grilo', 'cricket with tuning-fork antennae', '🦗'],
    ['Zumbido', 'Abelha', 'bee humming with electric yellow stripes', '🐝'],
    ['Tecladin', 'Sapo-cantor', 'singing frog with piano-key back', '🐸'],
    ['Ritmato', 'Coelho', 'rabbit with drumstick ears and beat-pulse fur', '🐰'],
    ['Amplifox', 'Raposa', 'fox with speaker-cone ears', '🦊'],
    ['Choquito', 'Ouriço', 'hedgehog with lightning-bolt quills', '🦔'],
    ['Melodin', 'Rouxinol', 'nightingale singing visible golden notes', '🐦'],
    ['Voltagem', 'Guaxinim', 'raccoon crackling with static electricity', '🦝'],
    ['Trovador', 'Lobo', 'wolf whose howl summons thunder', '🐺'],
    ['Sinfonix', 'Cavalo', 'horse galloping on lightning', '🐎'],
    ['Tempesto', 'Águia', 'eagle wreathed in storm arcs', '🦅'],
    ['Maestron', 'Leão', 'lion conducting an orchestra of lightning', '🦁'],
    ['Fulguron', 'Dragão-Trovão', 'legendary thunder dragon crowned with golden sound waves', '🐉'],
  ],
  LIGHT: [
    ['Lumfly', 'Vaga-lume', 'glowing golden firefly with sparkle-trail wings', '🪰'],
    ['Estrelim', 'Peixe-lanterna', 'small lanternfish with a star-shaped light', '🐟'],
    ['Alvinho', 'Coelho-albino', 'white rabbit with a soft halo glow', '🐇'],
    ['Velinha', 'Rato-branco', 'little white mouse carrying a candle flame', '🐁'],
    ['Pombella', 'Pomba', 'dove with feathers of soft dawn light', '🕊️'],
    ['Purrluz', 'Gato-persa', 'persian cat with a glowing gentle aura', '🐈'],
    ['Corujel', 'Coruja-branca', 'white owl with moonlight-patterned feathers', '🦉'],
    ['Cintilo', 'Golfinho', 'dolphin trailing ribbons of starlight', '🐬'],
    ['Auroral', 'Raposa-branca', 'white fox with aurora-colored tail', '🦊'],
    ['Benevolt', 'Cervo-branco', 'white deer with softly glowing antlers', '🦌'],
    ['Serafina', 'Cisne', 'swan with radiant feathered wings', '🦢'],
    ['Guardiel', 'Leão-branco', 'white lion with a mane of pure light', '🦁'],
    ['Celestor', 'Pégaso', 'radiant winged horse made of dawn light', '🦄'],
    ['Solarius', 'Cervo-Solar', 'legendary solar deer with golden sunlight antlers', '🦌'],
  ],
  ICE_NPC: [
    ['Flocotó', 'Filhote-de-foca', 'tiny seal pup with snowflake markings', '🦭'],
    ['Geladin', 'Pinguim', 'small penguin with frost-crystal feathers', '🐧'],
    ['Cristalgel', 'Coelho-polar', 'arctic rabbit with icicle ears', '🐇'],
    ['Nevoinho', 'Arminho', 'ermine made of drifting snow', '🐁'],
    ['Frostuco', 'Raposa-ártica', 'arctic fox with breath of visible frost', '🦊'],
    ['Iceberto', 'Morsa', 'walrus with tusks of clear blue ice', '🦭'],
    ['Glacino', 'Lince', 'lynx with frozen crystal fur', '🐆'],
    ['Nevascor', 'Alce-polar', 'polar elk with antlers of frozen branches', '🫎'],
    ['Congelor', 'Urso-polar', 'polar bear with a permanent frost aura', '🐻‍❄️'],
    ['Ventogel', 'Coruja-das-neves', 'snowy owl riding a blizzard', '🦉'],
    ['Permafro', 'Mamute-gelado', 'frozen mammoth encased in ancient ice', '🦣'],
    ['Cristalor', 'Dragão-de-gelo', 'small ice dragon with crystalline wings', '🐉'],
    ['Boreallis', 'Lobo-boreal', 'boreal wolf glowing with northern lights', '🐺'],
    ['Glaciarch', 'Titã-do-Gelo', 'legendary ice titan crowned with an eternal glacier', '🧊'],
  ],
};

// ---------------------------------------------------------------------------
// Lendários especiais — fora da grade por elemento
// ---------------------------------------------------------------------------

const SPECIAL_LEGENDARIES = [
  {
    id: 'crion_aetherion_001',
    name: 'Aetherion',
    baseAnimal: 'Quimera Celeste',
    baseEmoji: '🦄',
    epithet: 'Quimera de Elite',
    element: 'LEGENDARY',
    rarity: 'LEGENDARY',
    tier: 'TIER_4',
    baseHP: 200,
    baseAtk: 120,
    baseDef: 100,
    baseSpd: 110,
    habitat: 'Torre Lendária',
    description:
      'Só aparece para quem completou todas as matérias com nota máxima no mesmo dia. Dizem que ele é feito de todos os elementos ao mesmo tempo.',
    imagePrompt:
      'legendary celestial chimera creature blending all elements, prismatic rainbow aura, majestic and friendly, children illustration style, epic fantasy art, white background',
    unlockCondition: { type: 'XP_TOTAL', xp: 300 },
    attacks: [
      ['Sopro Primordial', 'LEGENDARY', 70, 95, 0, 'O primeiro sopro que criou os elementos', undefined],
      ['Convergência', 'LEGENDARY', 90, 90, 40, 'Todos os elementos atacam juntos', undefined],
      ['Elo Eterno', 'LEGENDARY', 80, 85, 70, 'Restaura o time inteiro com energia pura', 'HEAL_ALL'],
      ['Gênese', 'LEGENDARY', 145, 78, 95, 'Recria o campo de batalha do zero', 'IGNORE_DEFENSE'],
    ],
  },
  {
    id: 'crion_umbraluz_001',
    name: 'Umbraluz',
    baseAnimal: 'Lobo do Crepúsculo',
    baseEmoji: '🐺',
    epithet: 'Lobo de Elite',
    element: 'LIGHT',
    secondaryElement: 'WIND',
    rarity: 'LEGENDARY',
    tier: 'TIER_4',
    baseHP: 190,
    baseAtk: 110,
    baseDef: 95,
    baseSpd: 105,
    habitat: 'Jardim Celestial',
    description:
      'Guardião que nasce de 30 dias seguidos de bom comportamento. Enfrenta as sombras dos chefes de mundo sem hesitar.',
    imagePrompt:
      'legendary twilight wolf creature, light element, silver-white fur glowing at dusk, aurora mane, gentle protective expression, children illustration style, epic fantasy art, white background',
    unlockCondition: { type: 'BEHAVIOR_STREAK', days: 30 },
    attacks: [
      ['Presa Luminosa', 'LIGHT', 68, 95, 0, 'Uma mordida feita de luz concentrada', undefined],
      ['Uivo da Aurora', 'LIGHT', 88, 90, 40, 'Um uivo que dissipa qualquer sombra', undefined],
      ['Manto Protetor', 'LIGHT', 78, 85, 70, 'Envolve os aliados em luz curativa', 'HEAL_ALL'],
      ['Alvorada Final', 'LIGHT', 142, 78, 95, 'O amanhecer que nenhuma escuridão resiste', 'IGNORE_DEFENSE'],
    ],
  },
];

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

/** Interpola dentro da faixa da raridade conforme a posição do Crion no grupo. */
function scaleStat([min, max], index, total) {
  if (total <= 1) return Math.round((min + max) / 2);
  return Math.round(min + ((max - min) * index) / (total - 1));
}

/** Varia o poder base do ataque conforme a posição do Crion dentro da raridade. */
function scalePower(base, index, total) {
  const spread = total > 1 ? Math.round((index / (total - 1)) * 8) - 4 : 0;
  return Math.max(20, Math.min(150, base + spread));
}

function slug(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function unlockConditionFor(element, rarity) {
  if (element === 'LIGHT') {
    if (rarity === 'LEGENDARY') return { type: 'BEHAVIOR_STREAK', days: 30 };
    if (rarity === 'EPIC') return { type: 'BEHAVIOR_STREAK', days: 14 };
    if (rarity === 'RARE') return { type: 'BEHAVIOR_STREAK', days: 7 };
    return { type: 'BEHAVIOR_APPROVED', days: 1 };
  }
  if (rarity === 'LEGENDARY') return { type: 'XP_TOTAL', xp: 250 };
  if (rarity === 'EPIC') return { type: 'XP_TOTAL', xp: 150 };
  return { type: 'DEFAULT' };
}

function buildCrion(element, species, rarity, tier, indexInRarity, totalInRarity, globalIndex) {
  const [name, baseAnimal, visual, baseEmoji] = species;
  const meta = ELEMENTS[element];
  const stats = RARITY_STATS[rarity];
  const powers = RARITY_ATTACK_POWER[rarity];

  const habitat = meta.habitats[globalIndex % meta.habitats.length];
  const elementWord = meta.label.toLowerCase();

  const attacks = meta.attackNames.map(([attackName, attackDesc], i) => {
    const attack = {
      id: `atk_${slug(name)}_${i + 1}`,
      name: attackName,
      element,
      power: scalePower(powers[i], indexInRarity, totalInRarity),
      accuracy: SLOT_ACCURACY[i],
      description: attackDesc,
      unlockXP: SLOT_UNLOCK_XP[i],
      slot: i + 1,
      // As quatro camadas do desenho, todas descrevendo ESTE ataque.
      art: {
        creature: `cute fantasy ${baseAnimal.toLowerCase()} creature, ${visual}, ${SLOT_POSE[i]}, performing the move "${attackName}", ${elementWord} element, children illustration style, vibrant colors, soft shading, full body, isolated on transparent background, no text`,
        effect: `${elementWord} element magical effect only, ${SLOT_EFFECT_INTENSITY[i]}, glowing ${meta.colorWord}, semi-transparent energy, no creature, no background, isolated on transparent background, no text`,
        background: `${habitat} scenery, ${elementWord} themed landscape, soft depth of field, children illustration style, painterly background plate, no characters, no text`,
        edge: `abstract ${elementWord} energy border, glowing ${meta.colorWord} light bleeding outward from the centre to the frame edges, soft vignette, seamless with a card border, no creature, no text`,
      },
    };
    // O slot 3 é sempre o ataque de efeito de status do elemento.
    if (i === 2) attack.effect = meta.effect3;
    return attack;
  });

  // Lendários de Luz ganham cura em área e o slot 4 ignora defesa.
  if (rarity === 'LEGENDARY' && element === 'LIGHT') {
    attacks[2].effect = 'HEAL_ALL';
    attacks[3].effect = 'IGNORE_DEFENSE';
  }

  return {
    id: `crion_${slug(name)}_${String(globalIndex + 1).padStart(3, '0')}`,
    name,
    baseAnimal,
    baseEmoji,
    element,
    rarity,
    tier,
    baseHP: scaleStat(stats.hp, indexInRarity, totalInRarity),
    baseAtk: scaleStat(stats.atk, indexInRarity, totalInRarity),
    baseDef: scaleStat(stats.def, indexInRarity, totalInRarity),
    baseSpd: scaleStat(stats.spd, indexInRarity, totalInRarity),
    attacks,
    description: meta.lore[globalIndex % meta.lore.length],
    habitat,
    epithet: `${baseAnimal} ${RARITY_EPITHET[rarity]}`,
    imagePrompt: `cute fantasy ${baseAnimal.toLowerCase()} creature, ${visual}, ${meta.label.toLowerCase()} element, magical glow ${meta.colorWord}, friendly appearance, fantasy creature for children, isolated on white background, digital illustration style, vibrant colors, soft shading, no text`,
    unlockCondition: unlockConditionFor(element, rarity),
  };
}

const crions = [];

for (const element of Object.keys(SPECIES)) {
  const species = SPECIES[element];
  let cursor = 0;

  for (const { rarity, count, tiers } of RARITY_PLAN) {
    for (let i = 0; i < count; i++) {
      crions.push(
        buildCrion(element, species[cursor], rarity, tiers[i], i, count, cursor),
      );
      cursor++;
    }
  }
}

// Lendários especiais com ataques em formato de tupla → objeto
for (const special of SPECIAL_LEGENDARIES) {
  const { attacks, ...rest } = special;
  crions.push({
    ...rest,
    attacks: attacks.map(([name, element, power, accuracy, unlockXP, description, effect], i) => ({
      id: `atk_${slug(rest.name)}_${i + 1}`,
      name,
      element,
      power,
      accuracy,
      description,
      unlockXP,
      slot: i + 1,
      ...(effect ? { effect } : {}),
      art: {
        creature: `legendary fantasy ${rest.baseAnimal.toLowerCase()} creature, ${SLOT_POSE[i]}, performing the move "${name}", epic legendary appearance, children illustration style, vibrant colors, full body, isolated on transparent background, no text`,
        effect: `legendary prismatic magical effect only, ${SLOT_EFFECT_INTENSITY[i]}, radiant multicoloured energy, semi-transparent, no creature, no background, isolated on transparent background, no text`,
        background: `${rest.habitat} scenery, epic legendary landscape, soft depth of field, children illustration style, painterly background plate, no characters, no text`,
        edge: `abstract legendary energy border, radiant prismatic light bleeding outward to the frame edges, soft vignette, seamless with a card border, no creature, no text`,
      },
    })),
  });
}

// ---------------------------------------------------------------------------
// Serialização
// ---------------------------------------------------------------------------

function serializeAttack(a) {
  const parts = [
    `      id: '${a.id}'`,
    `      name: ${JSON.stringify(a.name)}`,
    `      element: '${a.element}'`,
    `      power: ${a.power}`,
    `      accuracy: ${a.accuracy}`,
    `      description: ${JSON.stringify(a.description)}`,
    `      unlockXP: ${a.unlockXP}`,
    `      slot: ${a.slot}`,
  ];
  if (a.effect) parts.push(`      effect: '${a.effect}'`);
  parts.push(
    `      art: {\n` +
      `        creature: ${JSON.stringify(a.art.creature)},\n` +
      `        effect: ${JSON.stringify(a.art.effect)},\n` +
      `        background: ${JSON.stringify(a.art.background)},\n` +
      `        edge: ${JSON.stringify(a.art.edge)},\n` +
      `      }`,
  );
  return `    {\n${parts.join(',\n')},\n    }`;
}

function serializeUnlock(u) {
  const parts = [`type: '${u.type}'`];
  if (u.days !== undefined) parts.push(`days: ${u.days}`);
  if (u.xp !== undefined) parts.push(`xp: ${u.xp}`);
  return `{ ${parts.join(', ')} }`;
}

function serializeCrion(c) {
  const lines = [
    `    id: '${c.id}'`,
    `    name: ${JSON.stringify(c.name)}`,
    `    baseAnimal: ${JSON.stringify(c.baseAnimal)}`,
    `    baseEmoji: ${JSON.stringify(c.baseEmoji)}`,
    `    element: '${c.element}'`,
  ];
  if (c.secondaryElement) lines.push(`    secondaryElement: '${c.secondaryElement}'`);
  lines.push(
    `    rarity: '${c.rarity}'`,
    `    tier: '${c.tier}'`,
    `    baseHP: ${c.baseHP}`,
    `    baseAtk: ${c.baseAtk}`,
    `    baseDef: ${c.baseDef}`,
    `    baseSpd: ${c.baseSpd}`,
    `    attacks: [\n${c.attacks.map(serializeAttack).join(',\n')},\n    ]`,
    `    description: ${JSON.stringify(c.description)}`,
    `    habitat: ${JSON.stringify(c.habitat)}`,
    `    imagePrompt: ${JSON.stringify(c.imagePrompt)}`,
    `    epithet: ${JSON.stringify(c.epithet)}`,
    `    unlockCondition: ${serializeUnlock(c.unlockCondition)}`,
  );
  return `  {\n${lines.join(',\n')},\n  }`;
}

const header = `/**
 * Banco de Crions do Recrion.
 *
 * ARQUIVO GERADO — não editar à mão.
 * Origem: scripts/generate-crions.mjs (rodar \`node scripts/generate-crions.mjs\`)
 *
 * ${crions.length} Crions: 14 por elemento em 9 elementos + 2 lendários especiais.
 * Gelo (ICE_NPC) existe apenas como inimigo de tabuleiro — nunca é gerado
 * pelo desempenho da criança.
 */

import type { Crion } from '@/types';

export const CRIONS: Crion[] = [
`;

const body = crions.map(serializeCrion).join(',\n');

const footer = `,
];

export default CRIONS;
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, header + body + footer, 'utf8');

console.log(`Gerados ${crions.length} Crions em ${OUT}`);
