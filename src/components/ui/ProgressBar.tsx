import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { THEME } from '@/constants/theme';

interface ProgressBarProps {
  /** 0 a 1 */
  progress: number;
  color?: string;
  height?: number;
  label?: string;
  showStars?: boolean;
  totalStars?: number;
}

export function ProgressBar({
  progress,
  color = THEME.colors.primary,
  height = 14,
  label,
  showStars = false,
  totalStars = 7,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const width = useSharedValue(clamped);

  useEffect(() => {
    width.value = withTiming(clamped, { duration: 450 });
  }, [clamped, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ color: THEME.colors.textLight, fontSize: 13, fontWeight: '600' }}>
          {label}
        </Text>
      )}

      <View
        style={{
          height,
          backgroundColor: '#E5E7EB',
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[{ height: '100%', backgroundColor: color, borderRadius: height / 2 }, fillStyle]}
        />
      </View>

      {showStars && (
        <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
          {Array.from({ length: totalStars }).map((_, i) => (
            <Text key={i} style={{ fontSize: 18, opacity: i < clamped * totalStars ? 1 : 0.25 }}>
              ⭐
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default ProgressBar;
