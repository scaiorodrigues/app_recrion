/**
 * A arte da carta, montada em quatro camadas independentes:
 *
 *   4. borda   — o efeito que liga o fundo aos contornos da carta
 *   3. fundo   — o cenário do habitat
 *   2. efeito  — a energia elemental em volta da criatura
 *   1. criatura — a criatura na pose do ataque
 *
 * Cada camada aceita uma imagem pronta (`uris`). Enquanto a arte não existe,
 * a camada é desenhada proceduralmente, então a estrutura já é a definitiva.
 */

import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ELEMENT_THEME } from '@/constants/theme';
import type { ArtLayerUris, AttackSlot, Crion, Element } from '@/types';

import ElementParticles from './ElementParticles';

interface CrionArtProps {
  crion: Crion;
  attackSlot: AttackSlot;
  /** Imagens já geradas, camada a camada. */
  uris?: ArtLayerUris;
  width: number;
  height: number;
  showParticles?: boolean;
  /** Dá vida à arte composta com um movimento lento de três segundos. */
  animate?: boolean;
}

/** Duração do ciclo de respiração da arte, em milissegundos. */
const BREATH_MS = 3000;

/**
 * Arte composta com um movimento lento e contínuo: a imagem cresce e sobe de
 * leve, ida e volta em três segundos. É sutil de propósito — a criatura
 * parece respirar sem que a carta vire um vídeo.
 */
function BreathingArt({ uri, animate }: { uri: string; animate: boolean }) {
  const breath = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;
    breath.value = withRepeat(
      withTiming(1, { duration: BREATH_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [animate, breath]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: 1.03 + breath.value * 0.035 },
      { translateY: -breath.value * 5 },
    ],
  }));

  return (
    <Animated.View style={[FILL, style]}>
      <Image source={{ uri }} style={FILL} resizeMode="cover" />
    </Animated.View>
  );
}

/** Quanto o efeito cresce conforme o ataque fica mais forte. */
const SLOT_INTENSITY: Record<AttackSlot, number> = { 1: 0.35, 2: 0.55, 3: 0.75, 4: 1 };

/**
 * A pose muda a inclinação e a escala da criatura, para que o mesmo Crion
 * leia diferente em cada carta mesmo sem arte gerada.
 */
const SLOT_POSE: Record<AttackSlot, { rotate: string; scale: number; translateY: number }> = {
  1: { rotate: '-8deg', scale: 0.92, translateY: 6 },
  2: { rotate: '10deg', scale: 1.0, translateY: 0 },
  3: { rotate: '0deg', scale: 1.06, translateY: -6 },
  4: { rotate: '-4deg', scale: 1.16, translateY: -10 },
};

const FILL = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

/** Camada 4 — a energia que sangra do fundo para as bordas da carta. */
function EdgeLayer({ element, intensity }: { element: Element; intensity: number }) {
  const theme = ELEMENT_THEME[element];
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.3 * intensity,
  }));

  return (
    <Animated.View style={[FILL, style]} pointerEvents="none">
      {/* Luz saindo do centro para as quatro bordas */}
      <LinearGradient
        colors={[theme.glow, 'transparent', 'transparent', theme.glow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={FILL}
      />
      <LinearGradient
        colors={[theme.accent, 'transparent']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0.35 }}
        style={FILL}
      />
    </Animated.View>
  );
}

/** Camada 3 — o cenário do habitat. */
function BackgroundLayer({ element }: { element: Element }) {
  const theme = ELEMENT_THEME[element];

  return (
    <LinearGradient
      colors={[theme.gradient[1], theme.bg, theme.gradient[0]]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={FILL}
    />
  );
}

/** Camada 2 — a energia elemental em volta da criatura. */
function EffectLayer({ element, intensity }: { element: Element; intensity: number }) {
  const theme = ELEMENT_THEME[element];
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [breathe]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + breathe.value * 0.25 * intensity }],
    opacity: (0.3 + breathe.value * 0.35) * intensity,
  }));

  return (
    <View style={[FILL, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
      <Animated.View
        style={[
          {
            width: '78%',
            aspectRatio: 1,
            borderRadius: 999,
            backgroundColor: theme.glow,
          },
          style,
        ]}
      />
    </View>
  );
}

export function CrionArt({
  crion,
  attackSlot,
  uris,
  width,
  height,
  showParticles = true,
  animate = true,
}: CrionArtProps) {
  const intensity = SLOT_INTENSITY[attackSlot];
  const pose = SLOT_POSE[attackSlot];
  const attack = crion.attacks.find((a) => a.slot === attackSlot) ?? crion.attacks[0];

  // Arte composta em uma imagem só (caminho da geração manual): ela já traz
  // criatura, efeito, fundo e borda, então as camadas separadas não entram —
  // e nem as partículas, que só duplicariam o efeito já pintado.
  if (uris?.full) {
    return (
      <View
        style={{ width, height, overflow: 'hidden' }}
        accessibilityLabel={`${crion.name} usando ${attack.name}`}
      >
        <BreathingArt uri={uris.full} animate={animate} />
      </View>
    );
  }

  return (
    <View
      style={{ width, height, overflow: 'hidden' }}
      accessibilityLabel={`${crion.name} usando ${attack.name}`}
    >
      {/* 4 — borda */}
      {uris?.edge ? (
        <Image source={{ uri: uris.edge }} style={FILL} resizeMode="cover" />
      ) : (
        <EdgeLayer element={crion.element} intensity={intensity} />
      )}

      {/* 3 — fundo */}
      {uris?.background ? (
        <Image source={{ uri: uris.background }} style={FILL} resizeMode="cover" />
      ) : (
        <BackgroundLayer element={crion.element} />
      )}

      {/* Recoloca a borda por cima do fundo procedural, senão ela some */}
      {!uris?.background && <EdgeLayer element={crion.element} intensity={intensity} />}

      {/* 2 — efeito */}
      {uris?.effect ? (
        <Image source={{ uri: uris.effect }} style={FILL} resizeMode="contain" />
      ) : (
        <EffectLayer element={crion.element} intensity={intensity} />
      )}

      {/* 1 — criatura, na pose do ataque */}
      <View style={[FILL, { alignItems: 'center', justifyContent: 'center' }]}>
        {uris?.creature ? (
          <Image
            source={{ uri: uris.creature }}
            style={{
              width: '100%',
              height: '100%',
              transform: [{ rotate: pose.rotate }, { scale: pose.scale }],
            }}
            resizeMode="contain"
          />
        ) : (
          <Text
            style={{
              fontSize: height * 0.42 * pose.scale,
              transform: [{ rotate: pose.rotate }, { translateY: pose.translateY }],
            }}
          >
            {crion.baseEmoji}
          </Text>
        )}
      </View>

      {showParticles && <ElementParticles element={crion.element} width={width} />}
    </View>
  );
}

export default CrionArt;
