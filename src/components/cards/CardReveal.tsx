/**
 * Revelação da carta: ovo que treme, racha e libera o Crion,
 * seguido do flip 3D que mostra a frente da carta.
 */

import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { RARITY_THRESHOLDS, THEME } from '@/constants/theme';
import type { AttackSlot, Crion, Rarity, Subject } from '@/types';

import CrionCard, { CARD_WIDTH } from './CrionCard';

type Phase = 'egg' | 'cracking' | 'card';

interface CardRevealProps {
  crion: Crion;
  attackSlot: AttackSlot;
  rarity: Rarity;
  xp: number;
  date: string;
  childName: string;
  primarySubject: Subject;
  cardWidth?: number;
  onRevealed?: () => void;
}

export function CardReveal({
  crion,
  attackSlot,
  rarity,
  xp,
  date,
  childName,
  primarySubject,
  cardWidth = CARD_WIDTH,
  onRevealed,
}: CardRevealProps) {
  const [phase, setPhase] = useState<Phase>('egg');
  const rarityInfo = RARITY_THRESHOLDS[rarity];

  const shake = useSharedValue(0);
  const eggScale = useSharedValue(1);
  const eggOpacity = useSharedValue(1);
  const flip = useSharedValue(0);
  const cardScale = useSharedValue(0.6);

  // O ovo treme continuamente até a criança tocar nele.
  useEffect(() => {
    if (phase !== 'egg') return;
    shake.value = withRepeat(
      withSequence(
        withTiming(-1, { duration: 90 }),
        withTiming(1, { duration: 90 }),
        withTiming(0, { duration: 90 }),
        withTiming(0, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [phase, shake]);

  const finishReveal = useCallback(() => {
    setPhase('card');
    onRevealed?.();
  }, [onRevealed]);

  const handlePress = useCallback(() => {
    if (phase !== 'egg') return;

    setPhase('cracking');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Três tremidas fortes, o ovo incha e some.
    shake.value = withSequence(
      withTiming(-2, { duration: 70 }),
      withTiming(2, { duration: 70 }),
      withTiming(-2, { duration: 70 }),
      withTiming(2, { duration: 70 }),
      withTiming(0, { duration: 70 }),
    );

    eggScale.value = withSequence(
      withTiming(1.25, { duration: 380, easing: Easing.out(Easing.back(2)) }),
      withTiming(0, { duration: 220, easing: Easing.in(Easing.ease) }),
    );

    eggOpacity.value = withDelay(420, withTiming(0, { duration: 200 }));

    // A carta entra virada e completa o flip.
    cardScale.value = withDelay(560, withTiming(1, { duration: 420, easing: Easing.out(Easing.back(1.4)) }));
    flip.value = withDelay(
      620,
      withTiming(1, { duration: 640, easing: Easing.inOut(Easing.ease) }, (done) => {
        if (done) runOnJS(finishReveal)();
      }),
    );
  }, [phase, shake, eggScale, eggOpacity, cardScale, flip, finishReveal]);

  const eggStyle = useAnimatedStyle(() => ({
    opacity: eggOpacity.value,
    transform: [
      { rotate: `${shake.value * 6}deg` },
      { scale: eggScale.value },
    ],
  }));

  // O verso fica visível na primeira metade do giro; a frente, na segunda.
  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [
      { perspective: 1200 },
      { scale: cardScale.value },
      { rotateY: `${flip.value * 180}deg` },
    ],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [
      { perspective: 1200 },
      { scale: cardScale.value },
      { rotateY: `${flip.value * 180 - 180}deg` },
    ],
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 560 }}>
      {phase === 'egg' && (
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Tocar para chocar o ovo e revelar seu Crion"
          style={{ alignItems: 'center', gap: 20 }}
        >
          <Animated.View style={eggStyle}>
            <Text style={{ fontSize: 150 }}>🥚</Text>
          </Animated.View>

          <Text style={{ fontSize: 20, fontWeight: '900', color: THEME.colors.primary }}>
            Seu Crion está chegando!
          </Text>
          <Text style={{ fontSize: 15, color: THEME.colors.textLight, fontWeight: '600' }}>
            Toque no ovo para revelar ✨
          </Text>
        </Pressable>
      )}

      {phase !== 'egg' && (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Ovo desaparecendo */}
          <Animated.View style={[{ position: 'absolute' }, eggStyle]}>
            <Text style={{ fontSize: 150 }}>🥚</Text>
          </Animated.View>

          {/* Verso da carta */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: cardWidth,
                height: cardWidth * (500 / 300),
                borderRadius: THEME.borderRadius.card,
                backgroundColor: THEME.colors.primary,
                borderWidth: 4,
                borderColor: rarityInfo.color,
                alignItems: 'center',
                justifyContent: 'center',
                backfaceVisibility: 'hidden',
              },
              backStyle,
            ]}
          >
            <Text style={{ fontSize: 70 }}>✨</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginTop: 8 }}>
              RECRIÔ
            </Text>
          </Animated.View>

          {/* Frente da carta */}
          <Animated.View style={[{ backfaceVisibility: 'hidden' }, frontStyle]}>
            <CrionCard
              crion={crion}
              attackSlot={attackSlot}
              rarity={rarity}
              xp={xp}
              date={date}
              childName={childName}
              primarySubject={primarySubject}
              width={cardWidth}
            />
          </Animated.View>
        </View>
      )}

      {phase === 'card' && (
        <View style={{ marginTop: 20, alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: rarityInfo.color }}>
            {crion.name} apareceu!
          </Text>
          <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '600' }}>
            {'★'.repeat(rarityInfo.stars)} {rarityInfo.label} • {xp} XP
          </Text>
        </View>
      )}
    </View>
  );
}

export default CardReveal;
