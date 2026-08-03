/**
 * CreatureSprite — a criatura desenhada em código, com as partes separadas
 * para poderem se mover independentes.
 *
 * É a criatura simples das primeiras cartas, agora montada de formas em vez de
 * um emoji só: sombra, pernas, corpo, barriga, braço de trás, orelhas, cabeça,
 * rosto e o braço da frente, que é o que golpeia.
 *
 * O pelo é quente e tem contorno escuro de propósito: o cenário do habitat pode
 * ser de qualquer cor, e uma criatura tingida pelo elemento sumiria dentro dele.
 * O elemento aparece no corte e no detalhe da cabeça.
 *
 * O ciclo de ataque tem quatro fases, todas tiradas de um único valor `t` que
 * vai de 0 a 1 e reinicia:
 *
 *   preparo  — a criatura recua e ergue o braço
 *   golpe    — avança e desce o braço de uma vez
 *   corte    — o arco aparece e some
 *   descanso — volta ao repouso
 */

import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ELEMENT_THEME } from '@/constants/theme';
import type { Element } from '@/types';

/** Um ciclo completo de ataque, em milissegundos. */
const ATTACK_MS = 1800;

/** Marcos do ciclo, em fração de `t`. */
const PREPARO = 0.3;
const GOLPE = 0.42;
const FIM_DO_CORTE = 0.62;

/** Pelo quente com contorno — lê bem sobre qualquer cenário. */
const FUR = '#A9805C';
const BELLY = '#E8D5B7';
const LINE = '#4A3728';
const CLAW = '#FAF5EC';

interface CreatureSpriteProps {
  element: Element;
  /** Lado da caixa da criatura, em pixels. */
  size: number;
  /** Toca o ciclo de ataque em laço. Desligado, a criatura fica em repouso. */
  attacking?: boolean;
}

export function CreatureSprite({ element, size, attacking = true }: CreatureSpriteProps) {
  const theme = ELEMENT_THEME[element];
  const t = useSharedValue(0);

  useEffect(() => {
    if (!attacking) {
      t.value = withTiming(0, { duration: 300 });
      return;
    }
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: ATTACK_MS, easing: Easing.linear }), -1, false);
  }, [attacking, t]);

  const s = (n: number) => n * size;
  const stroke = { borderWidth: Math.max(1.5, s(0.013)), borderColor: LINE };

  /** O corpo inteiro: recua, avança no golpe e volta ao lugar. */
  const bodyStyle = useAnimatedStyle(() => {
    const marcos = [0, PREPARO, GOLPE, FIM_DO_CORTE, 1];
    return {
      transform: [
        { translateX: interpolate(t.value, marcos, [0, -0.05, 0.09, 0.05, 0]) * size },
        { translateY: interpolate(t.value, marcos, [0, -0.012, 0.022, 0.01, 0]) * size },
        { rotate: `${interpolate(t.value, marcos, [0, 7, -11, -5, 0])}deg` },
      ],
    };
  });

  /** O braço da frente: sobe no preparo e desce de uma vez no golpe. */
  const armStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(t.value, [0, PREPARO, GOLPE, FIM_DO_CORTE, 1], [10, -76, 64, 46, 10])}deg`,
      },
    ],
  }));

  /** O arco do corte, na cor do elemento. */
  const slashStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [PREPARO, GOLPE, FIM_DO_CORTE], [0, 1, 0], 'clamp'),
    transform: [
      { rotate: '-40deg' },
      { scale: interpolate(t.value, [PREPARO, GOLPE, FIM_DO_CORTE], [0.5, 1.1, 1.55], 'clamp') },
    ],
  }));

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      {/* sombra no chão */}
      <View
        style={{
          position: 'absolute',
          left: s(0.24),
          bottom: s(0.015),
          width: s(0.52),
          height: s(0.07),
          borderRadius: s(0.035),
          backgroundColor: 'rgba(20,20,20,0.28)',
        }}
      />

      <Animated.View style={[{ width: size, height: size }, bodyStyle]}>
        {/* pernas — ficam por baixo, mas passam da barra do corpo */}
        <View style={[paw(s, stroke), { left: s(0.27), bottom: s(0.04) }]} />
        <View style={[paw(s, stroke), { left: s(0.55), bottom: s(0.04) }]} />

        {/* braço de trás, parado */}
        <View
          style={{
            position: 'absolute',
            left: s(0.68),
            top: s(0.4),
            width: s(0.13),
            height: s(0.3),
            borderRadius: s(0.065),
            backgroundColor: FUR,
            transform: [{ rotate: '-16deg' }],
            ...stroke,
          }}
        />

        {/* corpo */}
        <View
          style={{
            position: 'absolute',
            left: s(0.22),
            bottom: s(0.11),
            width: s(0.56),
            height: s(0.5),
            borderRadius: s(0.28),
            backgroundColor: FUR,
            ...stroke,
          }}
        />
        {/* barriga */}
        <View
          style={{
            position: 'absolute',
            left: s(0.32),
            bottom: s(0.14),
            width: s(0.36),
            height: s(0.35),
            borderRadius: s(0.18),
            backgroundColor: BELLY,
          }}
        />

        {/* orelhas, atrás da cabeça */}
        <View style={[ear(s, stroke), { left: s(0.25) }]} />
        <View style={[ear(s, stroke), { left: s(0.62) }]} />

        {/* cabeça */}
        <View
          style={{
            position: 'absolute',
            left: s(0.28),
            top: s(0.05),
            width: s(0.44),
            height: s(0.42),
            borderRadius: s(0.22),
            backgroundColor: FUR,
            ...stroke,
          }}
        />
        {/* rosto claro */}
        <View
          style={{
            position: 'absolute',
            left: s(0.33),
            top: s(0.11),
            width: s(0.34),
            height: s(0.28),
            borderRadius: s(0.17),
            backgroundColor: BELLY,
          }}
        />
        {/* manchas em volta dos olhos, como as da preguiça */}
        <View style={[mask(s), { left: s(0.35) }]} />
        <View style={[mask(s), { left: s(0.53) }]} />
        {/* olhos */}
        <View style={[eye(s), { left: s(0.385) }]} />
        <View style={[eye(s), { left: s(0.565) }]} />
        {/* focinho */}
        <View
          style={{
            position: 'absolute',
            left: s(0.462),
            top: s(0.275),
            width: s(0.076),
            height: s(0.055),
            borderRadius: s(0.038),
            backgroundColor: LINE,
          }}
        />
        {/* sorriso */}
        <View
          style={{
            position: 'absolute',
            left: s(0.44),
            top: s(0.325),
            width: s(0.12),
            height: s(0.06),
            borderBottomWidth: Math.max(1.5, s(0.012)),
            borderColor: LINE,
            borderBottomLeftRadius: s(0.06),
            borderBottomRightRadius: s(0.06),
          }}
        />
        {/* folhinha do elemento, na orelha */}
        <View
          style={{
            position: 'absolute',
            left: s(0.6),
            top: s(0.015),
            width: s(0.13),
            height: s(0.07),
            borderTopLeftRadius: s(0.065),
            borderBottomRightRadius: s(0.065),
            backgroundColor: theme.glow,
            transform: [{ rotate: '-25deg' }],
          }}
        />

        {/* braço da frente — é ele que golpeia */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: s(0.18),
              top: s(0.38),
              width: s(0.14),
              height: s(0.33),
              borderRadius: s(0.07),
              backgroundColor: FUR,
              transformOrigin: 'center top',
              ...stroke,
            },
            armStyle,
          ]}
        >
          {/* garras */}
          <View style={[claw(s), { left: s(0.006), transform: [{ rotate: '-16deg' }] }]} />
          <View style={[claw(s), { left: s(0.05) }]} />
          <View style={[claw(s), { left: s(0.094), transform: [{ rotate: '16deg' }] }]} />
        </Animated.View>
      </Animated.View>

      {/* o corte: um arco aberto, na cor do elemento */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: s(-0.04),
            top: s(0.3),
            width: s(0.62),
            height: s(0.62),
            borderRadius: s(0.31),
            borderWidth: s(0.05),
            borderColor: theme.glow,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
          },
          slashStyle,
        ]}
      />
    </View>
  );
}

type Stroke = { borderWidth: number; borderColor: string };

const paw = (s: (n: number) => number, stroke: Stroke) => ({
  position: 'absolute' as const,
  width: s(0.18),
  height: s(0.15),
  borderRadius: s(0.075),
  backgroundColor: FUR,
  ...stroke,
});

const ear = (s: (n: number) => number, stroke: Stroke) => ({
  position: 'absolute' as const,
  top: s(0.035),
  width: s(0.15),
  height: s(0.15),
  borderRadius: s(0.075),
  backgroundColor: FUR,
  ...stroke,
});

const mask = (s: (n: number) => number) => ({
  position: 'absolute' as const,
  top: s(0.155),
  width: s(0.12),
  height: s(0.1),
  borderRadius: s(0.06),
  backgroundColor: '#C9A17A',
});

const eye = (s: (n: number) => number) => ({
  position: 'absolute' as const,
  top: s(0.185),
  width: s(0.062),
  height: s(0.062),
  borderRadius: s(0.031),
  backgroundColor: '#27272A',
});

const claw = (s: (n: number) => number) => ({
  position: 'absolute' as const,
  bottom: s(-0.035),
  width: s(0.035),
  height: s(0.08),
  borderRadius: s(0.018),
  backgroundColor: CLAW,
  borderWidth: Math.max(1, s(0.008)),
  borderColor: LINE,
});

export default CreatureSprite;
