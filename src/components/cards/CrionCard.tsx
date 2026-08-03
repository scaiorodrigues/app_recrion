/**
 * CrionCard — a carta é o Crion usando UM ataque específico.
 * O mesmo Crion gera até 4 cartas diferentes, uma por ataque desbloqueado,
 * e a arte muda de pose conforme a habilidade usada.
 *
 * Layout: faixa de cima com o nome do Crion e os elementos que o alimentaram,
 * área central livre só para a arte, a raridade ancorada no canto inferior
 * direito dessa área, e o campo descritivo ocupando o terço de baixo — ataque,
 * o que a habilidade faz, matérias e XP do dia.
 */

import { forwardRef, useEffect } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ELEMENT_THEME, RARITY_THRESHOLDS, THEME } from '@/constants/theme';
import { SUBJECT_ELEMENT_MAP } from '@/constants/game';
import type {
  ArtLayerUris,
  AttackSlot,
  Crion,
  Element,
  ElementContribution,
  FinalStats,
  Rarity,
} from '@/types';
import { formatDateBR } from '@/utils/profile';
import { calculateFinalStats } from '@/utils/stats';

import CrionArt from './CrionArt';

export const CARD_WIDTH = 300;
export const CARD_HEIGHT = 500;

/** Faixa de cima: nome do Crion e os elementos que o alimentaram. */
const TOP_BAND = 106;

/** O campo descritivo de baixo ocupa um terço da carta. */
const BOTTOM_BAND = CARD_HEIGHT / 3;

/**
 * O que sobra no meio fica LIVRE de qualquer informação — é onde mora o
 * centro de importância da arte. A arte sangra por toda a carta; o texto vive
 * nas faixas de cima e de baixo.
 */
export const CLEAR_AREA = CARD_HEIGHT - TOP_BAND - BOTTOM_BAND;

interface CrionCardProps {
  crion: Crion;
  attackSlot: AttackSlot;
  rarity: Rarity;
  /** XP do dia que gerou a carta. */
  xp: number;
  date: string;
  childName: string;
  /** Matérias que alimentaram a carta, com as notas do dia. */
  contributions?: ElementContribution[];
  /** Atributos finais já calculados. Se faltar, a carta calcula sozinha. */
  stats?: FinalStats;
  /** Camadas de arte já geradas. */
  artUris?: ArtLayerUris;
  width?: number;
  showParticles?: boolean;
  /** Dá vida à arte composta com um movimento lento de três segundos. */
  animateArt?: boolean;
  /** Carta holográfica — sai só no dia perfeito. */
  foil?: boolean;
}

/** Símbolo de expansão no canto, como nas cartas de Magic. */
function RaritySymbol({ rarity, size }: { rarity: Rarity; size: number }) {
  const info = RARITY_THRESHOLDS[rarity];

  return (
    <View
      accessibilityLabel={`Raridade ${info.label}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: info.color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
      }}
    >
      <Text style={{ fontSize: size * 0.55, color: info.onColor, fontWeight: '900' }}>
        {info.symbol}
      </Text>
    </View>
  );
}

/** Losango do elemento, com a nota da matéria que o gerou. */
function ElementBadge({
  contribution,
  size,
}: {
  contribution: ElementContribution;
  size: number;
}) {
  const info = SUBJECT_ELEMENT_MAP[contribution.subject];
  const theme = ELEMENT_THEME[contribution.element];

  return (
    <View
      accessibilityLabel={`${info.subjectLabel}: ${contribution.value} pontos`}
      style={{ alignItems: 'center' }}
    >
      {/* Girar 45° faz o quadrado ocupar √2 do lado: a caixa reserva essa diagonal
          para o número não encostar na ponta de baixo do losango. */}
      <View style={{ width: size * 1.42, height: size * 1.42, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: size,
            height: size,
            backgroundColor: theme.bg,
            borderWidth: contribution.primary ? 2.5 : 1.5,
            borderColor: theme.accent,
            transform: [{ rotate: '45deg' }],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: size * 0.5, transform: [{ rotate: '-45deg' }] }}>
            {info.emoji}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.shadowed,
          { fontSize: size * 0.34, fontWeight: '900', color: theme.accent, marginTop: -1 },
        ]}
      >
        {contribution.value}
      </Text>
    </View>
  );
}

/** Brilho pulsante — Mítica, Lendária e qualquer carta holográfica recebem. */
function useRarityGlow(rarity: Rarity, foil: boolean) {
  const pulse = useSharedValue(0);
  const isPremium = rarity === 'EPIC' || rarity === 'LEGENDARY' || foil;

  useEffect(() => {
    if (!isPremium) return;
    pulse.value = withRepeat(
      withTiming(1, {
        duration: foil ? 1100 : rarity === 'LEGENDARY' ? 1400 : 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [isPremium, pulse, rarity, foil]);

  return { isPremium, pulse };
}

/** Reflexo holográfico que desliza sobre a carta. */
function FoilSheen({ pulse }: { pulse: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -140 + pulse.value * 320 }, { rotate: '18deg' }],
    opacity: 0.28 + pulse.value * 0.24,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: -40, bottom: -40, width: 70 }, style]}
    >
      <LinearGradient
        colors={['transparent', '#FFFFFF', '#A78BFA', '#67E8F9', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

export const CrionCard = forwardRef<View, CrionCardProps>(function CrionCard(
  {
    crion,
    attackSlot,
    rarity,
    xp,
    date,
    childName,
    contributions = [],
    stats,
    artUris,
    width = CARD_WIDTH,
    showParticles = true,
    animateArt = true,
    foil = false,
  },
  ref,
) {
  const elementTheme = ELEMENT_THEME[crion.element];
  const rarityInfo = RARITY_THRESHOLDS[rarity];

  const attack = crion.attacks.find((a) => a.slot === attackSlot) ?? crion.attacks[0];
  const finalStats = stats ?? calculateFinalStats(crion, rarity, xp);

  const scale = width / CARD_WIDTH;
  const height = CARD_HEIGHT * scale;
  const topBand = TOP_BAND * scale;
  const bottomBand = BOTTOM_BAND * scale;

  const { isPremium, pulse } = useRarityGlow(rarity, foil);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: isPremium ? 0.35 + pulse.value * 0.55 : 0,
    transform: [{ scale: 1 + pulse.value * 0.02 }],
  }));

  // No máximo três losangos cabem sem apertar o nome.
  const visibleContributions = contributions.slice(0, 3);

  return (
    <View style={{ width, height }}>
      {isPremium && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              borderRadius: THEME.borderRadius.card + 8,
              backgroundColor: rarityInfo.color,
            },
            glowStyle,
          ]}
        />
      )}

      <View
        ref={ref}
        collapsable={false}
        accessibilityRole="image"
        accessibilityLabel={
          `Carta ${crion.name}, ${rarityInfo.label}, usando ${attack.name}. ` +
          `Ataque ${finalStats.atk}, defesa ${finalStats.def}. ` +
          `Conquistada por ${childName} em ${formatDateBR(date)}.`
        }
        style={{
          width,
          height,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: elementTheme.bg,
          borderWidth: 3.5,
          borderColor: rarityInfo.color,
          overflow: 'hidden',
        }}
      >
        {/* A arte sangra por toda a carta, atrás de tudo */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <CrionArt
            crion={crion}
            attackSlot={attackSlot}
            uris={artUris}
            width={width}
            height={height}
            showParticles={showParticles}
            animate={animateArt}
          />
        </View>

        {/* Faixa superior: o nome do Crion e os elementos que o alimentaram */}
        <View style={{ height: topBand }}>
          <LinearGradient
            colors={['rgba(0,0,0,0.78)', 'rgba(0,0,0,0.34)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7 * scale,
              paddingHorizontal: 12 * scale,
              paddingTop: 9 * scale,
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.shadowed,
                {
                  flex: 1,
                  fontSize: 24 * scale,
                  fontWeight: '900',
                  color: '#FFFFFF',
                  fontStyle: 'italic',
                  letterSpacing: 0.3,
                },
              ]}
            >
              {crion.name}
            </Text>

            <Text style={[styles.shadowed, { fontSize: 13 * scale, color: 'rgba(255,255,255,0.65)' }]}>
              —
            </Text>

            <View style={{ flexDirection: 'row', gap: 5 * scale }}>
              {visibleContributions.map((c) => (
                <ElementBadge key={c.subject} contribution={c} size={19 * scale} />
              ))}
            </View>
          </View>
        </View>

        {/* Área livre: só a arte. A raridade encosta no canto de baixo à direita. */}
        <View
          pointerEvents="none"
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            paddingHorizontal: 12 * scale,
            paddingBottom: 5 * scale,
          }}
        >
          {/* Selo escuro: a raridade cai sobre a arte, que pode ser clara */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5 * scale,
              backgroundColor: 'rgba(12,10,20,0.66)',
              borderRadius: 999,
              paddingLeft: 8 * scale,
              paddingRight: 3 * scale,
              paddingVertical: 3 * scale,
            }}
          >
            <Text
              style={{
                fontSize: 10 * scale,
                fontWeight: '900',
                color: rarityInfo.color,
                letterSpacing: 0.7,
              }}
            >
              {rarityInfo.label.toUpperCase()}
            </Text>
            <RaritySymbol rarity={rarity} size={15 * scale} />
          </View>
        </View>

        {/* Campo descritivo: um terço da carta, sobre painel escuro translúcido */}
        <View
          style={{
            height: bottomBand,
            backgroundColor: 'rgba(12,10,20,0.72)',
            borderTopWidth: 1,
            borderTopColor: `${rarityInfo.color}66`,
            paddingHorizontal: 11 * scale,
            paddingTop: 8 * scale,
            paddingBottom: 8 * scale,
          }}
        >
          {/* O ataque desta carta, marcado pelo elemento da própria habilidade */}
          <Text
            numberOfLines={1}
            style={{ fontSize: 15 * scale, fontWeight: '900', color: '#FFFFFF' }}
          >
            {subjectElementEmoji(attack.element)} {attack.power} · {attack.name.toUpperCase()}
          </Text>

          {/* O que a habilidade faz — é o que dá corpo ao campo descritivo */}
          <Text
            style={{
              marginTop: 7 * scale,
              fontSize: 11.5 * scale,
              lineHeight: 16 * scale,
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.80)',
            }}
          >
            {attack.description}
          </Text>

          <View style={{ flex: 1 }} />

          {/* Matérias à esquerda, XP do dia à direita */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 * scale }}>
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontSize: 8.5 * scale,
                fontWeight: '700',
                color: 'rgba(255,255,255,0.78)',
              }}
            >
              {visibleContributions
                .map((c) => `${SUBJECT_ELEMENT_MAP[c.subject].subjectLabel} ${c.value}`)
                .join('  ·  ')}
            </Text>
            <Text style={{ fontSize: 8.5 * scale, color: 'rgba(255,255,255,0.45)' }}>—</Text>
            <View style={{ flex: 1 }} />
            <Text
              numberOfLines={1}
              style={{ fontSize: 8.5 * scale, fontWeight: '800', color: 'rgba(255,255,255,0.82)' }}
            >
              {xp} XP
            </Text>
          </View>
        </View>

        {foil && <FoilSheen pulse={pulse} />}
      </View>
    </View>
  );
});

/** Sombra que garante leitura do texto branco sobre qualquer arte. */
const styles = {
  shadowed: {
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
};

function subjectElementEmoji(element: Element): string {
  const found = Object.values(SUBJECT_ELEMENT_MAP).find((s) => s.element === element);
  if (found) return found.emoji;
  return element === 'ICE_NPC' ? '❄️' : '🌟';
}

export { subjectElementEmoji };
export default CrionCard;
