/**
 * CrionCard — a carta é o Crion usando UM ataque específico.
 * O mesmo Crion gera até 4 cartas diferentes, uma por ataque desbloqueado.
 */

import { forwardRef, useEffect } from 'react';
import { Image, Text, View } from 'react-native';
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
import type { AttackSlot, Crion, Rarity, Subject } from '@/types';
import { formatDateBR } from '@/utils/profile';

import ElementParticles from './ElementParticles';

export const CARD_WIDTH = 300;
export const CARD_HEIGHT = 500;

/** Escala visual das barras de atributo. */
const STAT_MAX = { hp: 200, atk: 120, def: 100, spd: 110 };

interface CrionCardProps {
  crion: Crion;
  attackSlot: AttackSlot;
  rarity: Rarity;
  /** XP do dia que gerou a carta. */
  xp: number;
  date: string;
  childName: string;
  primarySubject: Subject;
  imageUri?: string;
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

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const filled = Math.round((Math.min(value, max) / max) * 10);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ width: 34, fontSize: 10, fontWeight: '800', color: THEME.colors.textLight }}>
        {label}
      </Text>

      <View style={{ flex: 1, flexDirection: 'row', gap: 1.5 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 7,
              borderRadius: 2,
              backgroundColor: i < filled ? color : '#E5E7EB',
            }}
          />
        ))}
      </View>

      <Text style={{ width: 26, fontSize: 11, fontWeight: '800', color: THEME.colors.text, textAlign: 'right' }}>
        {value}
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

/** Reflexo holográfico que desliza sobre a arte da carta. */
function FoilSheen({ pulse }: { pulse: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -140 + pulse.value * 280 }, { rotate: '18deg' }],
    opacity: 0.28 + pulse.value * 0.24,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', top: -40, bottom: -40, width: 70 },
        style,
      ]}
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
    primarySubject,
    imageUri,
    width = CARD_WIDTH,
    showParticles = true,
    foil = false,
  },
  ref,
) {
  const elementTheme = ELEMENT_THEME[crion.element];
  const rarityInfo = RARITY_THRESHOLDS[rarity];
  const tierInfo = TIER_INFO[crion.tier];
  const subjectInfo = SUBJECT_ELEMENT_MAP[primarySubject];

  const attack = crion.attacks.find((a) => a.slot === attackSlot) ?? crion.attacks[0];
  const scale = width / CARD_WIDTH;
  const height = CARD_HEIGHT * scale;

  const { isPremium, pulse } = useRarityGlow(rarity, foil);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: isPremium ? 0.35 + pulse.value * 0.55 : 0,
    transform: [{ scale: 1 + pulse.value * 0.02 }],
  }));

  return (
    <View style={{ width, height }}>
      {/* Halo externo das raridades altas */}
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
        accessibilityLabel={`Carta ${crion.name}, ${rarityInfo.label}, ataque ${attack.name}`}
        style={{
          width,
          height,
          borderRadius: THEME.borderRadius.card,
          backgroundColor: THEME.colors.card,
          borderWidth: 3,
          borderColor: rarityInfo.color,
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho: nome + elemento */}
        <LinearGradient
          colors={elementTheme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 12 * scale, paddingVertical: 8 * scale }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 22 * scale,
                fontWeight: '900',
                color: elementTheme.accent,
                letterSpacing: 0.5,
              }}
            >
              {crion.name.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 22 * scale }}>{subjectElementEmoji(crion.element)}</Text>
            <View style={{ marginLeft: 6 * scale }}>
              <RaritySymbol rarity={rarity} size={20 * scale} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={{ fontSize: 11 * scale, fontWeight: '800', color: rarityInfo.color }}>
              {rarityInfo.label.toUpperCase()}
              {foil ? ' • HOLOGRÁFICA' : ''}
            </Text>
            <Text style={{ fontSize: 11 * scale, color: elementTheme.accent }}>•</Text>
            <Text style={{ fontSize: 11 * scale, fontWeight: '700', color: elementTheme.accent }}>
              {tierInfo.emoji} {tierInfo.label.toUpperCase()}
            </Text>
          </View>
        </LinearGradient>

        {/* Arte + habitat */}
        <View
          style={{
            // Absorve a sobra de altura da carta, mantendo a arte como foco visual.
            flex: 1,
            minHeight: 190 * scale,
            backgroundColor: elementTheme.bg,
            alignItems: 'center',
            justifyContent: 'center',
            borderTopWidth: 2,
            borderBottomWidth: 2,
            borderColor: elementTheme.accent,
          }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
              accessibilityLabel={`Ilustração de ${crion.name}`}
            />
          ) : (
            // Sem arte gerada ainda: placeholder com o animal base do Crion.
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 76 * scale }}>{crion.baseEmoji}</Text>
              <Text style={{ fontSize: 12 * scale, fontWeight: '700', color: elementTheme.accent }}>
                {crion.baseAnimal}
              </Text>
            </View>
          )}

          {showParticles && <ElementParticles element={crion.element} width={width} />}

          {/* Faixa holográfica que atravessa a arte — assinatura do dia perfeito */}
          {foil && <FoilSheen pulse={pulse} />}

          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: `${elementTheme.accent}E6`,
              paddingVertical: 3 * scale,
            }}
          >
            <Text style={{ fontSize: 10 * scale, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
              {crion.habitat}
            </Text>
          </View>
        </View>

        {/* Atributos */}
        <View style={{ paddingHorizontal: 12 * scale, paddingVertical: 8 * scale, gap: 4 * scale }}>
          <StatBar label="HP" value={crion.baseHP} max={STAT_MAX.hp} color="#22C55E" />
          <StatBar label="ATK" value={crion.baseAtk} max={STAT_MAX.atk} color="#EF4444" />
          <StatBar label="DEF" value={crion.baseDef} max={STAT_MAX.def} color="#3B82F6" />
          <StatBar label="VEL" value={crion.baseSpd} max={STAT_MAX.spd} color="#F59E0B" />
        </View>

        {/* Ataque desta carta */}
        <View
          style={{
            marginHorizontal: 10 * scale,
            padding: 8 * scale,
            borderRadius: 10,
            backgroundColor: elementTheme.bg,
            borderWidth: 1.5,
            borderColor: elementTheme.accent,
            gap: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ fontSize: 13 * scale }}>⚔️</Text>
            <Text
              numberOfLines={1}
              style={{ flex: 1, fontSize: 13 * scale, fontWeight: '900', color: elementTheme.accent }}
            >
              {attack.name.toUpperCase()}
            </Text>
          </View>

          <Text style={{ fontSize: 10 * scale, fontWeight: '700', color: THEME.colors.textLight }}>
            Poder: {attack.power}   Precisão: {attack.accuracy}%
            {attack.effect ? `   ${effectLabel(attack.effect)}` : ''}
          </Text>

          <Text
            numberOfLines={2}
            style={{ fontSize: 10 * scale, fontStyle: 'italic', color: THEME.colors.text }}
          >
            "{attack.description}"
          </Text>
        </View>

        {/* Rodapé: origem da carta */}
        <View
          style={{
            paddingHorizontal: 12 * scale,
            paddingVertical: 6 * scale,
            borderTopWidth: 1,
            borderColor: THEME.colors.border,
            gap: 1,
          }}
        >
          <Text style={{ fontSize: 9.5 * scale, color: THEME.colors.textLight, fontWeight: '600' }}>
            📅 {formatDateBR(date)}
          </Text>
          <Text style={{ fontSize: 9.5 * scale, color: THEME.colors.textLight, fontWeight: '600' }}>
            {subjectInfo.emoji} {subjectInfo.subjectLabel.toUpperCase()} • XP: {xp}
          </Text>
          <Text style={{ fontSize: 9.5 * scale, color: elementTheme.accent, fontWeight: '800' }}>
            ✨ Conquistado por {childName}
          </Text>
        </View>
      </View>
    </View>
  );
});

function subjectElementEmoji(element: Crion['element']): string {
  const found = Object.values(SUBJECT_ELEMENT_MAP).find((s) => s.element === element);
  if (found) return found.emoji;
  return element === 'ICE_NPC' ? '❄️' : '🌟';
}

function effectLabel(effect: NonNullable<Crion['attacks'][number]['effect']>): string {
  const labels: Record<string, string> = {
    BURN: '🔥 Queimadura',
    FREEZE: '❄️ Congelar',
    PARALYZE: '⚡ Paralisia',
    CONFUSE: '💫 Confusão',
    HEAL_SELF: '💚 Cura',
    HEAL_ALL: '💚 Cura total',
    IGNORE_DEFENSE: '🗡️ Perfura',
  };
  return labels[effect] ?? '';
}

export default CrionCard;
