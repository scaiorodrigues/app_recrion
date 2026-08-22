import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { THEME } from '@/constants/theme';

/**
 * O app é feito para o celular. Numa tela larga — navegador, tablet — esticar o
 * conteúdo de ponta a ponta deixa os botões enormes e a leitura difícil, então
 * a coluna para de crescer e fica centralizada. Abaixo dessa largura nada muda.
 */
const MAX_CONTENT_WIDTH = 520;

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
  const column = { width: '100%' as const, maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', paddingBottom: THEME.spacing.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[column, inner]}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, column, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export default Screen;
