/**
 * Partículas elementais que flutuam sobre a arte da carta.
 * Cada elemento tem seu próprio símbolo e ritmo de subida.
 */

import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { Element } from '@/types';

const PARTICLE_BY_ELEMENT: Record<Element, { symbol: string; count: number; duration: number }> = {
  NATURE: { symbol: '🍃', count: 5, duration: 4200 },
  FIRE: { symbol: '🔥', count: 6, duration: 2600 },
  WATER: { symbol: '💧', count: 6, duration: 3400 },
  EARTH: { symbol: '🪨', count: 4, duration: 4800 },
  METAL: { symbol: '⚙️', count: 4, duration: 5200 },
  WIND: { symbol: '🌬️', count: 5, duration: 3000 },
  ELECTRIC: { symbol: '⚡', count: 6, duration: 2200 },
  LIGHT: { symbol: '✨', count: 8, duration: 3200 },
  ICE_NPC: { symbol: '❄️', count: 6, duration: 4000 },
  LEGENDARY: { symbol: '🌟', count: 8, duration: 2800 },
};

interface ParticleProps {
  symbol: string;
  delay: number;
  duration: number;
  left: number;
  size: number;
}

function Particle({ symbol, delay, duration, left, size }: ParticleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false),
    );
  }, [delay, duration, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateY: -p * 130 },
        { translateX: Math.sin(p * Math.PI * 2) * 12 },
        { scale: 0.7 + Math.sin(p * Math.PI) * 0.4 },
      ],
      // Aparece e some suavemente nas pontas do ciclo.
      opacity: Math.sin(p * Math.PI) * 0.85,
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', bottom: 0, left }, style]} pointerEvents="none">
      <Text style={{ fontSize: size }}>{symbol}</Text>
    </Animated.View>
  );
}

interface ElementParticlesProps {
  element: Element;
  width: number;
}

export function ElementParticles({ element, width }: ElementParticlesProps) {
  const config = PARTICLE_BY_ELEMENT[element] ?? PARTICLE_BY_ELEMENT.LIGHT;

  return (
    <View style={{ ...StyleSheetAbsoluteFill }} pointerEvents="none">
      {Array.from({ length: config.count }).map((_, i) => (
        <Particle
          key={i}
          symbol={config.symbol}
          delay={(config.duration / config.count) * i}
          duration={config.duration}
          left={((i + 0.5) / config.count) * (width - 24)}
          size={12 + (i % 3) * 4}
        />
      ))}
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export default ElementParticles;
