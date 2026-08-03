/**
 * Gera a arte das cartas com a API do Gemini.
 *
 * Roda em BUILD, nunca dentro do app: a chave da API não pode ir no bundle,
 * e o conjunto de cartas é fixo (512 combinações iguais para toda criança),
 * então gerar uma vez e distribuir sai muito mais barato e rápido do que
 * gerar sob demanda no aparelho.
 *
 * Uso:
 *   GEMINI_API_KEY=... node scripts/generate-art.mjs                 # tudo
 *   GEMINI_API_KEY=... node scripts/generate-art.mjs --limit 8       # amostra
 *   GEMINI_API_KEY=... node scripts/generate-art.mjs --layer edge    # só bordas
 *   GEMINI_API_KEY=... node scripts/generate-art.mjs --dry-run       # só planeja
 *   GEMINI_API_KEY=... node scripts/generate-art.mjs \
 *     --card crion_emberon_014_s4                                    # uma carta inteira
 *
 * É resumível: imagem que já existe no disco não é gerada de novo.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ART_DIR = resolve(__dirname, '../art');
const OUT_DIR = join(ART_DIR, 'out');
const PROMPTS = join(ART_DIR, 'prompts.json');
const MANIFEST = join(ART_DIR, 'manifest.json');

const LAYERS = ['creature', 'effect', 'background', 'edge'];

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-3.1-flash-image-preview';

/** Pausa entre chamadas, para não estourar a cota do projeto. */
const DELAY_MS = 1200;
/** Tentativas por imagem antes de desistir. */
const MAX_ATTEMPTS = 3;

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    limit: Infinity,
    layer: null,
    card: null,
    model: DEFAULT_MODEL,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--limit') args.limit = Number(argv[++i]);
    else if (arg === '--layer') args.layer = argv[++i];
    else if (arg === '--card') args.card = argv[++i];
    else if (arg === '--model') args.model = argv[++i];
    else if (arg === '--dry-run') args.dryRun = true;
  }

  if (args.layer && !LAYERS.includes(args.layer)) {
    throw new Error(`Camada desconhecida: ${args.layer}. Use uma de: ${LAYERS.join(', ')}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

// ---------------------------------------------------------------------------
// Plano de geração
// ---------------------------------------------------------------------------

/** Nome do arquivo derivado do prompt: prompts iguais viram a mesma imagem. */
function fileNameFor(layer, prompt) {
  const hash = createHash('sha1').update(prompt).digest('hex').slice(0, 16);
  return `${layer}_${hash}.png`;
}

const all = JSON.parse(readFileSync(PROMPTS, 'utf8')).cards;

// --card gera as QUATRO camadas de uma carta só: é o teste que mostra se as
// camadas combinam entre si, coisa que uma imagem solta não revela.
const cards = args.card ? all.filter((c) => c.cardKey === args.card) : all;

if (args.card && cards.length === 0) {
  console.error(`Carta não encontrada: ${args.card}\n`);
  console.error('Exemplos de chaves válidas:');
  for (const example of all.slice(0, 5)) {
    console.error(`  ${example.cardKey}  — ${example.crionName}, ${example.attackName}`);
  }
  process.exit(1);
}

if (args.card) {
  const [card] = cards;
  console.log(`Carta: ${card.crionName} (${card.element}, ${card.rarity})`);
  console.log(`Ataque: ${card.attackName} — slot ${card.slot}\n`);
}

/** Uma entrada por imagem única, com as cartas que a utilizam. */
const jobs = new Map();
/** cardKey → { creature, effect, background, edge } */
const manifest = {};

for (const card of all) {
  manifest[card.cardKey] = {};

  for (const layer of LAYERS) {
    const prompt = card.art[layer];
    const file = fileNameFor(layer, prompt);
    manifest[card.cardKey][layer] = file;

    if (args.layer && layer !== args.layer) continue;
    if (args.card && card.cardKey !== args.card) continue;

    if (!jobs.has(file)) {
      jobs.set(file, { file, layer, prompt, usedBy: 0 });
    }
    jobs.get(file).usedBy++;
  }
}

const plan = [...jobs.values()];
const pending = plan.filter((job) => !existsSync(join(OUT_DIR, job.file)));

console.log(`Cartas: ${cards.length}`);
console.log(`Imagens únicas: ${plan.length} (a mesma arte serve várias cartas)`);
console.log(`Já no disco: ${plan.length - pending.length}`);
console.log(`A gerar agora: ${Math.min(pending.length, args.limit)}`);

if (args.dryRun) {
  console.log('\n--dry-run: nada foi gerado.');
  writeManifest();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    '\nGEMINI_API_KEY não está definida.\n' +
      'Gere uma chave em https://aistudio.google.com/apikey e rode:\n' +
      '  GEMINI_API_KEY=sua-chave node scripts/generate-art.mjs --limit 4\n',
  );
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pede uma imagem ao Gemini e devolve os bytes PNG. */
async function generateImage(prompt, model) {
  const response = await fetch(`${API_BASE}/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = await response.json();
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  const image = parts.find((p) => p.inlineData?.data);

  if (!image) {
    // Modelo pode ter recusado o prompt ou devolvido só texto.
    const text = parts.find((p) => p.text)?.text ?? '(resposta vazia)';
    throw new Error(`Sem imagem na resposta: ${text.slice(0, 200)}`);
  }

  return Buffer.from(image.inlineData.data, 'base64');
}

mkdirSync(OUT_DIR, { recursive: true });

let done = 0;
let failed = 0;

for (const job of pending.slice(0, args.limit)) {
  const target = join(OUT_DIR, job.file);
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const bytes = await generateImage(job.prompt, args.model);
      writeFileSync(target, bytes);
      done++;
      console.log(`✓ ${job.file}  (${job.layer}, usada por ${job.usedBy} cartas)`);
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      // Recuo progressivo: cota costuma liberar sozinha.
      if (attempt < MAX_ATTEMPTS) await sleep(DELAY_MS * attempt * 2);
    }
  }

  if (lastError) {
    failed++;
    console.error(`✗ ${job.file}: ${lastError.message}`);
  }

  await sleep(DELAY_MS);
}

writeManifest();

console.log(`\nGeradas: ${done}   Falharam: ${failed}`);
if (failed > 0) {
  console.log('Rode de novo para tentar apenas as que faltaram — o script é resumível.');
}

function writeManifest() {
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Manifesto atualizado: ${MANIFEST}`);
}
