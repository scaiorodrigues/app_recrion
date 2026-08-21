/**
 * Ficha de leitura — um texto curto e os exercícios que nascem dele.
 *
 * É o formato das folhinhas de alfabetização: a criança lê um textinho fatiado
 * em sílabas e depois responde sobre AQUELE texto. O que muda em relação aos
 * exercícios soltos é a retenção — no passo das perguntas o texto sai da tela,
 * então ela precisa ter guardado o que leu.
 *
 * Cinco passos: ler, completar a sílaba que falta, separar as sílabas,
 * responder sobre o texto e achar as palavras escondidas.
 */

import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import ExerciseResult from '@/components/activities/ExerciseResult';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { readingsForTier } from '@/data/readings';
import { useAppStore } from '@/stores/useAppStore';
import { buildAutoGradedActivity, scoreFromMistakes } from '@/utils/exercise';
import { today } from '@/utils/profile';
import { pickBySeed, shuffleBySeed } from '@/utils/random';
import {
  buildHuntGrid,
  matchesHunt,
  missingSyllableItems,
  splitWords,
  wordBetween,
  type Cell,
} from '@/utils/reading';

const PASSOS = ['ler', 'silaba', 'separar', 'perguntas', 'caca'] as const;
type Passo = (typeof PASSOS)[number];

const TITULO: Record<Passo, string> = {
  ler: 'Leia o texto fatiado',
  silaba: 'Complete com a sílaba que falta',
  separar: 'Separe as sílabas',
  perguntas: 'Responda sobre o texto',
  caca: 'Ache as palavras escondidas',
};

export default function ReadingSheetActivity() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const upsertActivity = useAppStore((s) => s.upsertActivity);

  const date = today();
  const [startedAt] = useState(() => Date.now());
  const tier = child?.tier ?? 'TIER_1';
  const seed = `${date}:${child?.id ?? 'demo'}:ficha`;

  const sheet = useMemo(() => pickBySeed(readingsForTier(tier), seed), [tier, seed]);
  const silabas = useMemo(() => missingSyllableItems(sheet, seed), [sheet, seed]);
  const separar = useMemo(() => splitWords(sheet, seed), [sheet, seed]);
  const grade = useMemo(() => buildHuntGrid(sheet.hunt, seed), [sheet, seed]);

  const [passo, setPasso] = useState<Passo>('ler');
  const [mistakes, setMistakes] = useState(0);
  const [sent, setSent] = useState(false);

  const indice = PASSOS.indexOf(passo);

  function erra() {
    setMistakes((n) => n + 1);
  }

  function avanca() {
    const proximo = PASSOS[indice + 1];
    if (proximo) {
      setPasso(proximo);
      return;
    }
    if (!child) return;
    upsertActivity(
      buildAutoGradedActivity({
        childId: child.id,
        date,
        subject: 'portugues',
        tier: child.tier,
        exerciseId: 'ficha-leitura',
        mistakes,
        startedAt,
      }),
    );
    setSent(true);
  }

  if (sent) {
    return <ExerciseResult mistakes={mistakes} score={scoreFromMistakes(mistakes)} />;
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 21, fontWeight: '900', color: THEME.colors.primary }}>
          {sheet.title}
        </Text>
        <Button label="Sair" size="sm" variant="ghost" onPress={() => router.back()} />
      </View>

      <View style={{ marginTop: 12 }}>
        <ProgressBar
          progress={indice / PASSOS.length}
          color={THEME.colors.primary}
          label={`${indice + 1} de ${PASSOS.length} — ${TITULO[passo]}`}
          showStars
          totalStars={PASSOS.length}
        />
      </View>

      {passo === 'ler' && <PassoLer sheet={sheet} onDone={avanca} />}
      {passo === 'silaba' && <PassoSilaba itens={silabas} onErro={erra} onDone={avanca} />}
      {passo === 'separar' && (
        <PassoSeparar palavras={separar} seed={seed} onErro={erra} onDone={avanca} />
      )}
      {passo === 'perguntas' && (
        <PassoPerguntas perguntas={sheet.questions} seed={seed} onErro={erra} onDone={avanca} />
      )}
      {passo === 'caca' && (
        <PassoCaca grade={grade} alvos={sheet.hunt} onErro={erra} onDone={avanca} />
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------------------

function PassoLer({
  sheet,
  onDone,
}: {
  sheet: ReturnType<typeof readingsForTier>[number];
  onDone: () => void;
}) {
  return (
    <>
      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <Text style={{ fontSize: 62 }}>{sheet.scene}</Text>
      </View>

      <View
        style={{
          marginTop: 14,
          padding: 18,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: '#DCFCE7',
          borderWidth: 3,
          borderColor: '#22C55E',
          gap: 12,
        }}
      >
        {sheet.lines.map((linha, i) => (
          <View key={i} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {linha.map((palavra, j) => (
              <View
                key={`${i}_${j}`}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 9,
                  borderRadius: 8,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: '#86EFAC',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#15803D', letterSpacing: 1 }}>
                  {palavra.syllables.join(' | ')}
                </Text>
              </View>
            ))}
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#15803D', alignSelf: 'center' }}>
              .
            </Text>
          </View>
        ))}
      </View>

      <Text
        style={{
          marginTop: 16,
          fontSize: 13,
          color: THEME.colors.textLight,
          textAlign: 'center',
          fontWeight: '700',
        }}
      >
        Leia em voz alta, batendo palma a cada pedacinho.
      </Text>

      <View style={{ marginTop: 20 }}>
        <Button label="Já li!" icon="📖" size="lg" fullWidth onPress={onDone} />
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------

function PassoSilaba({
  itens,
  onErro,
  onDone,
}: {
  itens: ReturnType<typeof missingSyllableItems>;
  onErro: () => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [erradas, setErradas] = useState<string[]>([]);
  const item = itens[i];

  if (!item) {
    return <SemConteudo onDone={onDone} />;
  }

  function toca(opcao: string) {
    if (erradas.includes(opcao)) return;
    if (opcao !== item.syllables[item.hiddenIndex]) {
      onErro();
      setErradas((prev) => [...prev, opcao]);
      return;
    }
    if (i + 1 < itens.length) {
      setI(i + 1);
      setErradas([]);
      return;
    }
    onDone();
  }

  return (
    <>
      <View
        style={{
          marginTop: 22,
          padding: 24,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: '#FFFFFF',
          borderWidth: 3,
          borderColor: THEME.colors.border,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {item.syllables.map((s, k) => (
          <Text
            key={k}
            style={{
              fontSize: 30,
              fontWeight: '900',
              letterSpacing: 2,
              color: k === item.hiddenIndex ? THEME.colors.border : THEME.colors.text,
            }}
          >
            {k === item.hiddenIndex ? '____' : s}
          </Text>
        ))}
      </View>

      <View style={{ marginTop: 20, gap: 12 }}>
        {item.options.map((opcao) => {
          const errada = erradas.includes(opcao);
          return (
            <Pressable
              key={opcao}
              onPress={() => toca(opcao)}
              disabled={errada}
              accessibilityRole="button"
              accessibilityLabel={`Sílaba ${opcao}`}
              accessibilityState={{ disabled: errada }}
              style={{
                paddingVertical: 16,
                borderRadius: THEME.borderRadius.card,
                backgroundColor: errada ? '#FEE2E2' : '#FFFFFF',
                borderWidth: 3,
                borderColor: errada ? '#DC2626' : THEME.colors.border,
                alignItems: 'center',
                opacity: errada ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: '900', letterSpacing: 2, color: THEME.colors.text }}>
                {opcao}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------

function PassoSeparar({
  palavras,
  seed,
  onErro,
  onDone,
}: {
  palavras: ReturnType<typeof splitWords>;
  seed: string;
  onErro: () => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [postas, setPostas] = useState<number[]>([]);
  const [errada, setErrada] = useState<number | null>(null);
  const palavra = palavras[i];

  const embaralhadas = useMemo(() => {
    if (!palavra) return [];
    return shuffleBySeed(
      palavra.syllables.map((s, pos) => ({ s, pos })),
      `${seed}:${palavra.text}:sep`,
    );
  }, [palavra, seed]);

  if (!palavra) return <SemConteudo onDone={onDone} />;

  function toca(pos: number) {
    if (postas.includes(pos)) return;
    if (pos !== postas.length) {
      // Insistir na mesma sílaba errada não conta de novo.
      if (errada !== pos) onErro();
      setErrada(pos);
      return;
    }
    const proximas = [...postas, pos];
    setErrada(null);
    if (proximas.length < palavra.syllables.length) {
      setPostas(proximas);
      return;
    }
    if (i + 1 < palavras.length) {
      setI(i + 1);
      setPostas([]);
      return;
    }
    onDone();
  }

  return (
    <>
      <Text
        style={{
          marginTop: 22,
          fontSize: 32,
          fontWeight: '900',
          letterSpacing: 3,
          textAlign: 'center',
          color: THEME.colors.text,
        }}
      >
        {palavra.text}
      </Text>

      <View
        style={{
          marginTop: 14,
          minHeight: 70,
          padding: 14,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: '#DCFCE7',
          borderWidth: 3,
          borderColor: '#22C55E',
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {postas.length === 0 ? (
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }}>
            Toque nos pedacinhos na ordem certa
          </Text>
        ) : (
          postas.map((pos, k) => (
            <Text key={pos} style={{ fontSize: 24, fontWeight: '900', color: '#15803D', letterSpacing: 1 }}>
              {k > 0 ? '+ ' : ''}
              {palavra.syllables[pos]}
            </Text>
          ))
        )}
      </View>

      <View style={{ marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {embaralhadas
          .filter((c) => !postas.includes(c.pos))
          .map((c) => (
            <Pressable
              key={c.pos}
              onPress={() => toca(c.pos)}
              accessibilityRole="button"
              accessibilityLabel={`Pedacinho ${c.s}`}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: THEME.borderRadius.button,
                backgroundColor: errada === c.pos ? '#FEE2E2' : '#FFFFFF',
                borderWidth: 3,
                borderColor: errada === c.pos ? '#DC2626' : THEME.colors.border,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: '900', letterSpacing: 2, color: THEME.colors.text }}>
                {c.s}
              </Text>
            </Pressable>
          ))}
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------

function PassoPerguntas({
  perguntas,
  seed,
  onErro,
  onDone,
}: {
  perguntas: { prompt: string; answer: string; options: string[] }[];
  seed: string;
  onErro: () => void;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [erradas, setErradas] = useState<string[]>([]);
  const pergunta = perguntas[i];

  const opcoes = useMemo(
    () => (pergunta ? shuffleBySeed(pergunta.options, `${seed}:${pergunta.prompt}`) : []),
    [pergunta, seed],
  );

  if (!pergunta) return <SemConteudo onDone={onDone} />;

  function toca(opcao: string) {
    if (erradas.includes(opcao)) return;
    if (opcao !== pergunta.answer) {
      onErro();
      setErradas((prev) => [...prev, opcao]);
      return;
    }
    if (i + 1 < perguntas.length) {
      setI(i + 1);
      setErradas([]);
      return;
    }
    onDone();
  }

  return (
    <>
      <View
        style={{
          marginTop: 22,
          padding: 20,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: '#EFF6FF',
          borderWidth: 3,
          borderColor: '#3B82F6',
        }}
      >
        <Text style={{ fontSize: 19, fontWeight: '900', color: '#1D4ED8', textAlign: 'center' }}>
          {pergunta.prompt}
        </Text>
      </View>

      <View style={{ marginTop: 18, gap: 12 }}>
        {opcoes.map((opcao) => {
          const errada = erradas.includes(opcao);
          return (
            <Pressable
              key={opcao}
              onPress={() => toca(opcao)}
              disabled={errada}
              accessibilityRole="button"
              accessibilityLabel={`Resposta ${opcao}`}
              accessibilityState={{ disabled: errada }}
              style={{
                paddingVertical: 16,
                borderRadius: THEME.borderRadius.card,
                backgroundColor: errada ? '#FEE2E2' : '#FFFFFF',
                borderWidth: 3,
                borderColor: errada ? '#DC2626' : THEME.colors.border,
                alignItems: 'center',
                opacity: errada ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 19, fontWeight: '900', color: THEME.colors.text }}>
                {opcao}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------

function PassoCaca({
  grade,
  alvos,
  onErro,
  onDone,
}: {
  grade: ReturnType<typeof buildHuntGrid>;
  alvos: readonly string[];
  onErro: () => void;
  onDone: () => void;
}) {
  const [achadas, setAchadas] = useState<string[]>([]);
  const [inicio, setInicio] = useState<Cell | null>(null);

  /** Todas as células que já fazem parte de uma palavra achada. */
  const marcadas = useMemo(() => {
    const set = new Set<string>();
    for (const p of grade.placements) {
      if (!achadas.includes(p.word)) continue;
      for (let k = 0; k < p.word.length; k++) {
        set.add(`${p.row + p.dRow * k},${p.col + p.dCol * k}`);
      }
    }
    return set;
  }, [grade.placements, achadas]);

  function toca(row: number, col: number) {
    if (!inicio) {
      setInicio({ row, col });
      return;
    }
    if (inicio.row === row && inicio.col === col) {
      setInicio(null);
      return;
    }

    const lida = wordBetween(grade, inicio, { row, col });
    setInicio(null);

    // Fora da linha reta é escorregão de dedo, não erro de leitura: a seleção
    // só recomeça. Erro mesmo é apontar uma linha que não esconde palavra.
    if (!lida) return;

    const alvo = matchesHunt(lida, alvos);
    if (!alvo || achadas.includes(alvo)) {
      onErro();
      return;
    }

    const proximas = [...achadas, alvo];
    setAchadas(proximas);
    if (proximas.length === alvos.length) onDone();
  }

  return (
    <>
      <View style={{ marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {alvos.map((alvo) => {
          const ok = achadas.includes(alvo);
          return (
            <View
              key={alvo}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 13,
                borderRadius: 999,
                backgroundColor: ok ? '#DCFCE7' : '#FFFFFF',
                borderWidth: 2.5,
                borderColor: ok ? THEME.colors.success : THEME.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '900',
                  letterSpacing: 1,
                  color: ok ? '#15803D' : THEME.colors.text,
                  textDecorationLine: ok ? 'line-through' : 'none',
                }}
              >
                {alvo}
              </Text>
            </View>
          );
        })}
      </View>

      <Text
        style={{
          marginTop: 16,
          fontSize: 13,
          color: THEME.colors.textLight,
          textAlign: 'center',
          fontWeight: '700',
        }}
      >
        {inicio ? 'Agora toque na ÚLTIMA letra da palavra' : 'Toque na PRIMEIRA letra da palavra'}
      </Text>

      <View style={{ marginTop: 14, alignItems: 'center' }}>
        {grade.cells.map((linha, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {linha.map((letra, c) => {
              const marcada = marcadas.has(`${r},${c}`);
              const selecionada = inicio?.row === r && inicio?.col === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => toca(r, c)}
                  accessibilityRole="button"
                  accessibilityLabel={`Letra ${letra}, linha ${r + 1}, coluna ${c + 1}`}
                  style={{
                    width: 40,
                    height: 40,
                    margin: 2,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: marcada ? '#DCFCE7' : selecionada ? '#EDE9FE' : '#FFFFFF',
                    borderWidth: 2,
                    borderColor: marcada
                      ? THEME.colors.success
                      : selecionada
                        ? THEME.colors.primary
                        : THEME.colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '900',
                      color: marcada ? '#15803D' : THEME.colors.text,
                    }}
                  >
                    {letra}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------

/** Escape para o caso raro de uma ficha não render itens para um passo. */
function SemConteudo({ onDone }: { onDone: () => void }) {
  return (
    <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
      <Text style={{ fontSize: 46 }}>🙂</Text>
      <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.colors.text, textAlign: 'center' }}>
        Este passo não tem nada para hoje.
      </Text>
      <Button label="Seguir" onPress={onDone} />
    </View>
  );
}
