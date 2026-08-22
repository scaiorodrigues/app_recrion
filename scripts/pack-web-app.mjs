/**
 * Empacota o build web num arquivo HTML único.
 *
 * O `expo export --platform web` gera um site com vários arquivos: o HTML, o
 * bundle, o CSS e a pasta de assets. Isso serve para hospedar, mas não para
 * mandar um link avulso — em um contexto que serve um documento só, tudo o que
 * for buscado ao lado dá 404.
 *
 * Aqui o CSS e o JS entram inline, e as fontes de ícone que o app realmente
 * carrega viram data URI dentro do próprio bundle. O resultado abre sozinho,
 * sem servidor e sem rede.
 *
 * Uso:
 *   npx expo export --platform web --output-dir dist
 *   node scripts/pack-web-app.mjs
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const DIST = 'dist';
const SAIDA = 'review/recrion-app.html';

/**
 * Só as fontes que o app pede em tempo de execução. O @expo/vector-icons traz
 * 19 famílias, 4 MB no total; embutir todas incharia o arquivo à toa.
 */
const FONTES_USADAS = ['Ionicons'];

/** Cor de fundo do app, para a página não pegar emprestado o fundo de quem a hospeda. */
const FUNDO = '#FFF8E7';

function unico(pasta) {
  const arquivos = readdirSync(join(DIST, pasta));
  if (arquivos.length !== 1) {
    throw new Error(`esperava um arquivo em ${pasta}, achei ${arquivos.length}`);
  }
  return join(DIST, pasta, arquivos[0]);
}

if (!existsSync(DIST)) {
  console.error('Não achei a pasta dist/. Rode antes:');
  console.error('  npx expo export --platform web --output-dir dist');
  process.exit(1);
}

let js = readFileSync(unico('_expo/static/js/web'), 'utf8');
const css = readFileSync(unico('_expo/static/css'), 'utf8');

// Troca as fontes usadas por data URI, dentro do bundle.
let embutidas = 0;
const caminhos = [...new Set(js.match(/\/assets\/[A-Za-z0-9_./@-]*\.ttf/g) ?? [])];
for (const caminho of caminhos) {
  const familia = basename(caminho).split('.')[0];
  if (!FONTES_USADAS.includes(familia)) continue;

  const arquivo = join(DIST, caminho);
  if (!existsSync(arquivo)) continue;

  const dataUri = `data:font/ttf;base64,${readFileSync(arquivo).toString('base64')}`;
  js = js.split(caminho).join(dataUri);
  embutidas++;
}

// Um `</script>` dentro do bundle fecharia a tag e quebraria a página inteira.
if (js.includes('</script')) {
  throw new Error('o bundle contém </script> — precisa escapar antes de embutir');
}

const html = `<title>Recrion</title>

<style>
  /* Reset do react-native-web, como o Expo gera: o app mede a própria altura. */
  html, body { height: 100%; margin: 0; }
  body { overflow: hidden; background: ${FUNDO}; }
  #root { display: flex; height: 100%; flex: 1; }
</style>

<style>
${css}
</style>

<div id="root"></div>

<script>
${js}
</script>
`;

mkdirSync('review', { recursive: true });
writeFileSync(SAIDA, html);

const mb = (html.length / 1024 / 1024).toFixed(2);
console.log(`✓ ${SAIDA} — ${mb} MB, ${embutidas} fonte(s) embutida(s)`);
if (html.length > 16 * 1024 * 1024) {
  console.warn('⚠️  passou de 16 MB: não cabe como Artifact.');
}
