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
- **Constância é medida e exibida.** O streak aparece no painel do responsável
  e entra na carta.

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
│   ├── cards/        CrionCard, revelação, partículas
│   ├── activities/   Canvas de escrita à mão
│   ├── behavior/     Item de tarefa
│   └── ui/           Botão, tela, barra de progresso
├── data/             Crions, obrigações, palavras, mundos
├── hooks/            Geração do Crion do dia, compartilhamento
├── stores/           Estado global (Zustand)
├── utils/            XP, geração, combate, comportamento, perfil
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

### Arte dos Crions

As imagens ainda não são geradas. Cada Crion traz um `imagePrompt` pronto para
uso em geradores de imagem, e o `CrionCard` aceita uma `imageUri` (local ou
remota). Sem imagem, a carta mostra o emoji do animal base.

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

**Dia perfeito** = todas as atividades propostas aprovadas com nota máxima, mais
o comportamento validado (quando havia obrigações no dia). Só ele produz a carta
holográfica, com reflexo iridescente atravessando a arte.

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

124 testes cobrindo o cálculo de XP, a raridade, a geração do Crion, o teste
gratuito, a validação de comportamento, o combate e o cálculo de faixa etária.
