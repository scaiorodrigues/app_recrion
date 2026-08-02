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

## Como o Crion do dia é gerado

```
notas aprovadas × peso da matéria
        + 40 XP se o comportamento foi 100% aprovado
        + bônus (sequência, conclusão cedo, todas as matérias)
        × multiplicador do plano
                    ↓
                 XP do dia
                    ↓
    ┌───────────────┴───────────────┐
elemento primário              raridade
(matéria de maior nota      (0–39 Comum … 95+ Lendário,
 ou Luz se só houve          limitada pelo teto do plano)
 comportamento)
                    ↓
        Crion sorteado do banco
   (semente = data + id da criança,
    então o mesmo dia dá o mesmo Crion)
                    ↓
        slot de ataque pelo XP
      (0 → 1, 40 → 2, 70 → 3, 95 → 4)
                    ↓
                  CARTA
```

O elemento **Luz** é o único que não vem de nota: ou o responsável aprovou todas
as obrigações do dia, ou não aprovou. É também o único caminho para gerar Crion
em fim de semana e férias.

---

## Comportamento é sempre gratuito

O módulo de comportamento está liberado em todos os planos, inclusive o
gratuito. É a âncora de retenção do produto: cria um ritual diário entre
responsável e criança que independe das matérias. **Não coloque atrás de
paywall.**

---

## Testes

```bash
npm test
```

91 testes cobrindo o cálculo de XP, a geração do Crion, a validação de
comportamento, o combate e o cálculo de faixa etária.
