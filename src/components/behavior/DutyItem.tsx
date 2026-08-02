/**
 * Item de tarefa da criança: checkbox grande com animação de estrela ao marcar.
 */

import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { THEME } from '@/constants/theme';

interface DutyItemProps {
  emoji: string;
  label: string;
  color: string;
  done: boolean;
  /** Bloqueia o toque enquanto o pai valida. */
  locked?: boolean;
  onToggle: () => void;
}

export function DutyItem({ emoji, label, color, done, locked = false, onToggle }: DutyItemProps) {
  const scale = useSharedValue(1);
  const starScale = useSharedValue(0);

  // Estrela salta quando a tarefa passa a concluída.
  useEffect(() => {
    if (done) {
      starScale.value = withSequence(
        withSpring(1.4, { damping: 6 }),
        withTiming(1, { duration: 180, easing: Easing.out(Easing.ease) }),
      );
    } else {
      starScale.value = withTiming(0, { duration: 150 });
    }
  }, [done, starScale]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
    opacity: starScale.value,
  }));

  function handlePress() {
    if (locked) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withTiming(0.96, { duration: 90 }),
      withSpring(1, { damping: 8 }),
    );
    onToggle();
  }

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        onPress={handlePress}
        disabled={locked}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: locked }}
        accessibilityLabel={label}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: done ? `${color}1A` : THEME.colors.card,
          borderRadius: THEME.borderRadius.card,
          padding: 15,
          borderWidth: 2.5,
          borderColor: done ? color : THEME.colors.border,
          opacity: locked ? 0.75 : 1,
        }}
      >
        <Text style={{ fontSize: 30 }}>{emoji}</Text>

        <Text
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: '800',
            color: THEME.colors.text,
            textDecorationLine: done ? 'line-through' : 'none',
          }}
        >
          {label}
        </Text>

        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: done ? color : '#FFFFFF',
            borderWidth: 3,
            borderColor: done ? color : THEME.colors.border,
          }}
        >
          <Animated.Text style={[{ fontSize: 20 }, starStyle]}>✨</Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default DutyItem;
