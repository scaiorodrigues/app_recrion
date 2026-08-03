/**
 * CrionCard — a carta é o Crion usando UM ataque específico.
 * O mesmo Crion gera até 4 cartas diferentes, uma por ataque desbloqueado,
 * e a arte muda de pose conforme a habilidade usada.
 *
 * Layout: ATK/DEF no topo à esquerda, raridade à direita, arte em quatro
 * camadas, nome em destaque com os elementos ao lado, o ataque desta carta,
 * as matérias que a alimentaram e o rodapé de origem.
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

import { ELEMENT_THEME, RARITY_THRESHOLDS, THEME, TIER_INFO } from '@/constants/theme';
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
      style={{ alignItems: 'center', gap: 1 }}
    >
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
      <Text style={{ fontSize: size * 0.3, fontWeight: '900', color: theme.accent }}>
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
    foil = false,
  },
  ref,
) {
  const elementTheme = ELEMENT_THEME[crion.element];
  const rarityInfo = RARITY_THRESHOLDS[rarity];
  const tierInfo = TIER_INFO[crion.tier];

  const attack = crion.attacks.find((a) => a.slot === attackSlot) ?? crion.attacks[0];
  const finalStats = stats ?? calculateFinalStats(crion, rarity, xp);

  const scale = width / CARD_WIDTH;
  const height = CARD_HEIGHT * scale;
  // A arte ocupa a altura que sobra depois do cabeçalho, do nome, do ataque,
  // da linha de matérias e do rodapé — assim a carta fecha sem vão branco.
  const artHeight = 288 * scale;

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
        accessibilityLabel={`Carta ${crion.name}, ${rarityInfo.label}, usando ${attack.name}. Ataque ${finalStats.atk}, defesa ${finalStats.def}.`}
        style={{
          width,
          height,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: THEME.colors.card,
          borderWidth: 3.5,
          borderColor: rarityInfo.color,
          overflow: 'hidden',
        }}
      >
        {/* Topo: ataque e defesa finais à esquerda, raridade à direita */}
        <LinearGradient
          colors={elementTheme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12 * scale,
            paddingVertical: 7 * scale,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
            <Text style={{ fontSize: 27 * scale, fontWeight: '900', color: elementTheme.accent }}>
              {finalStats.atk}
            </Text>
            <Text style={{ fontSize: 19 * scale, fontWeight: '800', color: `${elementTheme.accent}AA` }}>
              -{finalStats.def}
            </Text>
            {finalStats.bonusAtk > 0 && (
              <Text style={{ fontSize: 10 * scale, fontWeight: '900', color: THEME.colors.success }}>
                +{finalStats.bonusAtk}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 * scale }}>
            <Text style={{ fontSize: 11 * scale, fontWeight: '800', color: elementTheme.accent }}>
              {tierInfo.emoji}
            </Text>
            <RaritySymbol rarity={rarity} size={21 * scale} />
          </View>
        </LinearGradient>

        {/* Arte em quatro camadas */}
        <View style={{ borderTopWidth: 2, borderBottomWidth: 2, borderColor: elementTheme.accent }}>
          <CrionArt
            crion={crion}
            attackSlot={attackSlot}
            uris={artUris}
            width={width - 7}
            height={artHeight}
            showParticles={showParticles}
          />
        </View>

        {/* Nome, epíteto e os elementos com as notas das matérias */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12 * scale,
            paddingTop: 6 * scale,
            gap: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 25 * scale,
                fontWeight: '900',
                color: elementTheme.accent,
                fontStyle: 'italic',
                letterSpacing: 0.3,
              }}
            >
              {crion.name}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: 10.5 * scale, fontWeight: '700', color: THEME.colors.textLight }}
            >
              {crion.epithet}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 * scale }}>
            {visibleContributions.map((c) => (
              <ElementBadge key={c.subject} contribution={c} size={22 * scale} />
            ))}
          </View>
        </View>

        {/* Ataque desta carta */}
        <View
          style={{
            marginHorizontal: 11 * scale,
            marginTop: 6 * scale,
            paddingHorizontal: 9 * scale,
            paddingVertical: 6 * scale,
            borderRadius: 9,
            backgroundColor: elementTheme.bg,
            borderWidth: 1.5,
            borderColor: elementTheme.accent,
            gap: 1,
          }}
        >
          <Text
            numberOfLines={1}
            style={{ fontSize: 11.5 * scale, fontWeight: '900', color: elementTheme.accent }}
          >
            ⚔️ {attack.name.toUpperCase()} · {attack.power} · {attack.accuracy}%
          </Text>
          <Text
            numberOfLines={2}
            style={{ fontSize: 9.5 * scale, fontStyle: 'italic', color: THEME.colors.text }}
          >
            « {attack.description} »
          </Text>
        </View>

        {/* Matérias que alimentaram a carta */}
        {visibleContributions.length > 0 && (
          <Text
            numberOfLines={1}
            style={{
              paddingHorizontal: 12 * scale,
              marginTop: 5 * scale,
              fontSize: 9 * scale,
              fontWeight: '700',
              color: THEME.colors.textLight,
            }}
          >
            {visibleContributions
              .map((c) => `${SUBJECT_ELEMENT_MAP[c.subject].subjectLabel} ${c.value}`)
              .join('  ·  ')}
          </Text>
        )}

        {/* Rodapé de origem */}
        <View
          style={{
            marginTop: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12 * scale,
            paddingVertical: 6 * scale,
            borderTopWidth: 1,
            borderColor: THEME.colors.border,
          }}
        >
          <Text style={{ fontSize: 9.5 * scale, fontWeight: '800', color: THEME.colors.textLight }}>
            Recrion — {xp} XP
          </Text>
          <Text style={{ fontSize: 9 * scale, fontWeight: '700', color: elementTheme.accent }}>
            ✨ {childName} · {formatDateBR(date)}
          </Text>
        </View>

        {foil && <FoilSheen pulse={pulse} />}
      </View>
    </View>
  );
});

function subjectElementEmoji(element: Element): string {
  const found = Object.values(SUBJECT_ELEMENT_MAP).find((s) => s.element === element);
  if (found) return found.emoji;
  return element === 'ICE_NPC' ? '❄️' : '🌟';
}

export { subjectElementEmoji };
export default CrionCard;
