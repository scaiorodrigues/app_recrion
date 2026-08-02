/**
 * Lista de filhos cadastrados.
 */

import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { THEME, TIER_INFO } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';

export default function ChildrenList() {
  const children = useAppStore((s) => s.children);

  return (
    <Screen>
      <Text style={{ fontSize: 26, fontWeight: '900', color: THEME.colors.primary }}>
        Meus filhos
      </Text>

      <View style={{ marginTop: 20, gap: 10 }}>
        {children.length === 0 && (
          <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '600' }}>
            Nenhum filho cadastrado ainda.
          </Text>
        )}

        {children.map((child) => {
          const tier = TIER_INFO[child.tier];

          return (
            <Pressable
              key={child.id}
              onPress={() => router.push(`/(parent)/children/${child.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir perfil de ${child.name}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: THEME.colors.card,
                borderRadius: THEME.borderRadius.card,
                padding: 16,
                borderWidth: 1,
                borderColor: THEME.colors.border,
              }}
            >
              <Text style={{ fontSize: 36 }}>{child.avatarEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text }}>
                  {child.name}
                </Text>
                <Text style={{ fontSize: 13, color: THEME.colors.textLight, fontWeight: '600' }}>
                  {tier.emoji} {tier.label} • {child.linkedUid ? 'conta vinculada' : 'aguardando vínculo'}
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: THEME.colors.textLight }}>›</Text>
            </Pressable>
          );
        })}

        <Button
          label="Cadastrar filho"
          icon="➕"
          fullWidth
          onPress={() => router.push('/(parent)/children/new')}
        />
      </View>
    </Screen>
  );
}
