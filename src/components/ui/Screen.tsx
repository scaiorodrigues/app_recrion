import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  backgroundColor?: string;
  padded?: boolean;
}

export function Screen({
  children,
  scroll = true,
  backgroundColor = THEME.colors.background,
  padded = true,
}: ScreenProps) {
  const inner = padded ? { padding: THEME.spacing.md } : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[inner, { paddingBottom: THEME.spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export default Screen;
