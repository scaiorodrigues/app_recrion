import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { THEME } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

const VARIANT_STYLE: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: THEME.colors.primary, text: '#FFFFFF' },
  secondary: { bg: THEME.colors.secondary, text: '#FFFFFF' },
  ghost: { bg: 'transparent', text: THEME.colors.primary, border: THEME.colors.primary },
  danger: { bg: THEME.colors.danger, text: '#FFFFFF' },
};

const SIZE_STYLE: Record<Size, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 14 },
  md: { paddingVertical: 13, paddingHorizontal: 20, fontSize: 16 },
  lg: { paddingVertical: 17, paddingHorizontal: 26, fontSize: 19 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const palette = VARIANT_STYLE[variant];
  const dimensions = SIZE_STYLE[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => ({
        backgroundColor: palette.bg,
        borderRadius: THEME.borderRadius.button,
        borderWidth: palette.border ? 2 : 0,
        borderColor: palette.border,
        paddingVertical: dimensions.paddingVertical,
        paddingHorizontal: dimensions.paddingHorizontal,
        opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed && !inactive ? 0.98 : 1 }],
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loading ? (
          <ActivityIndicator color={palette.text} size="small" />
        ) : (
          icon && <Text style={{ fontSize: dimensions.fontSize }}>{icon}</Text>
        )}
        <Text
          style={{
            color: palette.text,
            fontSize: dimensions.fontSize,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default Button;
