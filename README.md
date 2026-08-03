# Recrion

App educacional gamificado para crianças brasileiras do 1º ao 4º ano. Combina
atividades por matéria com **Crions** — criaturas colecionáveis geradas todo dia
a partir do desempenho escolar e do comportamento da criança.

Feito em React Native + Expo, com foco em Android.

---

## Como rodar

```bash
npm install
npx expo start --android
```

Para abrir no Expo Go, leia o QR Code que aparece no terminal.

### Modo demonstração

Sem credenciais do Firebase o app roda com dados em memória: todas as telas
funcionam, mas nada é salvo ao fechar o app. Para conectar um projeto real:

```bash
cp .env.example .env   # e preencha os valores
```

---

## A proposta pedagógica

O app segue o método do professor **Pierluigi Piazzi**: *pouco, com
profundidade e constância, vale mais do que muito e superficial*.

Isso não é slogan — é o que a mecânica impõe:

- **O dia tem teto.** 3 a 5 atividades por faixa etária, uma por matéria, com
  15 minutos de pausa obrigatória entre elas. Não existe maratonar.
- **A raridade vem de fechar o dia, não de acumular horas.** Como o dia é
  limitado, o máximo que a criança pode fazer é exatamente o que foi proposto.
- **Escrita à mão.** A atividade de Português usa canvas, não teclado —
  aprendizagem ativa, como o professor Pier defendia.

### As métricas do método

O painel do responsável (`Painel → Métricas do Método Prof. Pier`) traduz os
princípios em cinco indicadores sobre os últimos 30 dias. Todos medem **hábito**,
não volume:

| Indicador | O que mede | Como é calculado |
|---|---|---|
| 🎯 **Concentração** | Fica na atividade o tempo que ela pede | % das atividades dentro da faixa de duração do tier. Rápido demais indica chute; devagar demais, dispersão — os dois contam contra |
| 🔁 **Repetição** | Estuda um pouco todo dia | % dos dias do período com estudo. Três atividades num dia só valem um dia |
| 🎒 **Organização** | Mochila, caderno e lição em ordem | % das obrigações da categoria Estudo aprovadas |
| 📅 **Aula dada, aula estudada hoje** | Conclui no próprio dia | % das atividades concluídas na data em que foram abertas |
| ✍️ **Acerto de primeira** | Escreve com atenção | % aprovadas sem refazer — a mesma exigência da carta Lendária |

A nota geral é a média dos cinco, acompanhada da sequência atual e da melhor
sequência do período.

---

## O que já está pronto

| Fase | Entrega | Estado |
|---|---|---|
| 1 | Projeto Expo + TypeScript + NativeWind + Expo Router | ✅ |
| 1 | Login do responsável e da criança, vínculo por código de convite | ✅ |
| 1 | Cadastro de filho com faixa escolar automática pela idade | ✅ |
| 2 | Banco de 128 Crions | ✅ |
| 2 | Componente `CrionCard` com gradiente, brilho e partículas | ✅ |
| 2 | Laboratório de cartas (seletor de elemento, raridade e ataque) | ✅ |
| 2 | Compartilhar a carta como imagem | ✅ |
| 3 | Atividade de Português (palavras e sílabas, escrita à mão) | ✅ |
| 3 | Envio para validação do responsável | ✅ |
| 4 | Algoritmo XP → elemento → raridade → Crion do dia | ✅ |
| 4 | Revelação com ovo quebrando e flip 3D | ✅ |
| 5 | Módulo de comportamento completo (criança + responsável) | ✅ |
| 5 | Dashboard de comportamento com calendário, streak e insights | ✅ |
| 5 | Jardim Celestial liberado por Crion de Luz | ✅ |

**Ainda não implementado:** combate no tabuleiro, atividades das outras
matérias, compra real via RevenueCat e persistência no Firestore (as telas
estão prontas e marcadas com `TODO` nos pontos de integração).

---

## Estrutura

```
src/
├── app/              Telas (Expo Router, roteamento por arquivo)
│   ├── (auth)/       Login do responsável e da criança
│   ├── (parent)/     Painel, comportamento, filhos, assinatura
│   └── (child)/      Atividades, tarefas, coleção, tabuleiro
├── components/
│   ├── cards/        CrionCard, CrionArt (4 camadas), revelação
│   ├── activities/   Canvas de escrita à mão
│   ├── behavior/     Item de tarefa
│   └── ui/           Botão, tela, barra de progresso
├── data/             Crions, obrigações, palavras, mundos
├── hooks/            Geração do Crion do dia, compartilhamento
├── stores/           Estado global (Zustand)
├── utils/            XP, raridade, stats, arte, métricas Pier, geração, combate
├── types/            Interfaces TypeScript
└── constants/        Tema, regras de jogo, notificações
```

---

## Banco de Crions

`src/data/crions.ts` é **gerado** — não edite à mão. Para mudar o banco, ajuste
as espécies em `scripts/generate-crions.mjs` e rode:

```bash
node scripts/generate-crions.mjs
```

São 128 Crions: 14 por elemento em 9 elementos, mais 2 lendários especiais.
Cada um tem 4 ataques, então a coleção real é de **512 cartas únicas** — uma
carta é o Crion usando um ataque específico.

Gelo (`ICE_NPC`) existe só como inimigo do tabuleiro. A criança nunca gera um
Crion de Gelo, o que cria a assimetria estratégica: para enfrentar a Tundra ela
precisa de Elétrico ou Natureza.

### Arte dos Crions — quatro camadas

O desenho da carta é montado em **quatro camadas independentes**, de trás para
a frente:

| # | Camada | O que é |
|---|---|---|
| 4 | **Borda** | O efeito que sangra do fundo para os contornos da carta |
| 3 | **Fundo** | O cenário do habitat |
| 2 | **Efeito** | A energia elemental em volta da criatura |
| 1 | **Criatura** | A criatura na pose do ataque |

Cada uma das **512 cartas** (128 Crions × 4 ataques) tem seu próprio conjunto de
quatro prompts em `attack.art`. A camada da criatura descreve a pose executando
**aquele** ataque — o mesmo Crion aparece agachado no golpe de abertura e
arqueado em rugido no golpe final.

O componente `CrionArt` aceita `artUris` com as imagens já geradas, camada a
camada. Enquanto elas não existem, cada camada é desenhada proceduralmente com
gradientes e partículas — arte gerada é enriquecimento, nunca requisito.

#### Gerando a arte pelo Canva (caminho validado)

Funciona e não exige faturamento. O conector do Canva gera quatro candidatas
por pedido; escolhe-se uma, converte-se em design e exporta-se em PNG.

Use o prompt de `art/prompts.json` no campo `art.full`, acrescentando no início
a instrução de que o resultado é **só ilustração**, sem texto nem layout — o
Canva é um gerador de *design*, então sem isso ele acrescenta títulos e
molduras.

Exportado, o PNG entra na carta apontando:

```bash
EXPO_PUBLIC_ART_TEST_URL=http://localhost:8899/sua-imagem.png npx expo start
```

Isso monta a imagem como camada composta no laboratório de cartas, para avaliar
a arte dentro da carta antes de publicá-la no manifesto.

**Atenção à proporção.** O Canva entrega 1080x1350 (4:5) e a área de arte da
carta é 293x288, quase quadrada — o recorte `cover` come cerca de 40px em cima
e embaixo. Composição centralizada sobrevive bem; sujeito colado no topo, não.

#### Gerando a arte com o Gemini (exige faturamento)

```bash
node scripts/generate-crions.mjs                              # atualiza os prompts
GEMINI_API_KEY=sua-chave node scripts/generate-art.mjs --dry-run   # mostra o plano
GEMINI_API_KEY=sua-chave node scripts/generate-art.mjs --limit 8   # gera uma amostra
GEMINI_API_KEY=sua-chave node scripts/generate-art.mjs             # gera tudo
```

Pegue a chave em [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

A geração de imagem do Gemini **não tem tier gratuito**: sem faturamento
habilitado no projeto, toda chamada volta 429 com `limit: 0` — inclusive as de
texto. Trocar a chave não resolve, porque a cota pertence ao projeto.

**Roda em build, nunca dentro do app.** A chave não pode ir no bundle — APK é
decompilável — e o conjunto de cartas é fixo: as 512 combinações são as mesmas
para toda criança. Gerar uma vez e distribuir sai mais barato, mais rápido e
funciona offline. Nada de esperar rede no momento da revelação.

São **600 imagens, não 2048**: só a camada da criatura é única por carta. O
fundo depende de elemento e habitat, o efeito de elemento e slot, a borda só do
elemento — prompts iguais viram o mesmo arquivo, deduplicado por hash.

O script é **resumível**: imagem que já está no disco não é gerada de novo, e
uma falha pontual some na próxima rodada. `art/manifest.json` mapeia cada carta
para seus quatro arquivos e é versionado; os PNGs em `art/out/` não são.

Para o app exibir a arte, hospede a pasta e aponte:

```bash
EXPO_PUBLIC_ART_BASE_URL=https://seu-cdn/art/
```

Sem essa variável o app usa o desenho procedural — nenhuma tela quebra.

---

## Anatomia da carta

```
┌──────────────────────────────┐
│ 140 -105 +30          🌱 ✧   │  ATK · DEF · ganho do dia │ faixa · raridade
├──────────────────────────────┤
│                              │
│   ARTE EM 4 CAMADAS          │  borda · fundo · efeito · criatura
│   (pose do ataque usado)     │
│                              │
├──────────────────────────────┤
│ Arvoreth            ◈ ◈ ◈    │  nome · losangos dos elementos
│ Ent-Cervo de Elite           │  epíteto              com as notas
├──────────────────────────────┤
│ ⚔️ FÚRIA DA MATA · 135 · 78% │  ataque desta carta
│ « Toda a floresta responde » │
├──────────────────────────────┤
│ Português 100 · Ciências 85  │  matérias que alimentaram a carta
├──────────────────────────────┤
│ Recrion — 170 XP   ✨ Sofia  │  origem
└──────────────────────────────┘
```

**Ataque e defesa são finais**, não os valores base do Crion: somam o degrau da
raridade e o XP do dia. O mesmo Crion em dias diferentes gera cartas com números
diferentes — é o que dá sentido a colecionar a mesma criatura mais de uma vez.

Os **losangos** mostram cada elemento com a nota da matéria que o gerou. O
losango de borda grossa é o elemento que definiu a carta.

---

## Raridades

No padrão Magic — cada nível tem seu símbolo de expansão:

| Símbolo | Raridade | Cor | Como se conquista |
|---|---|---|---|
| ● | Comum | preto | menos de 50% do dia |
| ◆ | Incomum | prata | metade do dia |
| ★ | Rara | ouro | 75% do dia, ou dia fechado com média baixa |
| ✦ | Mítica | laranja | dia fechado com média ≥ 90 |
| ✧ | **Lendária** | roxo | **dia perfeito** — e vem holográfica ✨ |

**Dia perfeito** exige as quatro coisas ao mesmo tempo:

1. todas as atividades propostas do dia aprovadas;
2. nota máxima em todas;
3. **todas certas de primeira** — sem o responsável mandar refazer nenhuma;
4. o comportamento validado, quando havia obrigações no dia.

Só ele produz a carta holográfica, com reflexo iridescente atravessando a arte.

O acerto de primeira é o que separa a Lendária da Mítica: insistir até acertar
é mérito e rende Mítica; acertar de saída é outro patamar.

A raridade conquistada é sempre entregue: os Lendários vivem na faixa Copa, mas
uma criança do 1º ano que fez o dia perfeito recebe um Lendário de verdade — não
uma Rara com etiqueta trocada.

---

## Como o Crion do dia é gerado

```
       ┌──────────────── RARIDADE ────────────────┐
       │  fração do dia aprovada + nota média     │
       │  100% com nota máxima → Lendária ✧ foil  │
       └──────────────────────────────────────────┘

       ┌──────────────── QUAL MONSTRO ────────────┐
       │  elemento  ← PRIMEIRA atividade do dia   │
       │  criatura  ← semente da MAIS RÁPIDA      │
       └──────────────────────────────────────────┘

       ┌──────────────── ATAQUE DA CARTA ─────────┐
       │  XP do dia → slot                        │
       │  0 → 1   40 → 2   70 → 3   95 → 4        │
       └──────────────────────────────────────────┘
                          ↓
                        CARTA
```

**A primeira atividade concluída define o elemento** — o que a criança atacou
primeiro define a identidade do dia, no espírito do "aula dada, aula estudada
hoje". **A mais rápida entra na semente** que sorteia a criatura: dois dias com
a mesma nota, mas ritmos diferentes, geram monstros diferentes.

O elemento **Luz** é o único que não vem de nota: ou o responsável aprovou todas
as obrigações do dia, ou não aprovou. É também o único caminho para gerar Crion
em fim de semana e férias.

---

## Planos

**Teste de 3 dias** — acesso total: todas as matérias, todas as raridades
(inclusive a Lendária holográfica), todos os mundos. A família precisa ver o
produto inteiro para decidir. O teste começa quando o primeiro filho é
cadastrado. O que o teste **não** afrouxa é o limite diário de atividades: ele é
curto em dias, não permissivo em volume.

Depois: **R$ 9,90/mês** por matéria ou **R$ 39,90/mês** no pacote completo
(+20% de XP, +30% de XP de Luz, Crions exclusivos).

### Comportamento é sempre gratuito

O módulo de comportamento fica liberado para sempre, inclusive depois que o
teste expira. É a âncora de retenção do produto: cria um ritual diário entre
responsável e criança que independe das matérias. **Não coloque atrás de
paywall.**

---

## Testes

```bash
npm test
```

171 testes cobrindo o cálculo de XP, a raridade, os atributos finais, as camadas
de arte e seu manifesto, as métricas do método Pier, a geração do Crion, o teste
gratuito, a validação de comportamento, o combate e o cálculo de faixa etária.
