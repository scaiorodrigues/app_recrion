/**
 * Detalhe do filho: código de convite com QR Code para vincular a conta dele.
 */

import { Share, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { THEME, TIER_INFO } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { isInviteExpired } from '@/utils/profile';

export default function ChildDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const child = useAppStore((s) => s.children.find((c) => c.id === id));
  const invite = useAppStore((s) => s.invites.find((i) => i.childProfileId === id));
  const createInvite = useAppStore((s) => s.createInvite);

  if (!child) {
    return (
      <Screen>
        <Text style={{ fontSize: 16, fontWeight: '700', color: THEME.colors.text }}>
          Perfil não encontrado.
        </Text>
        <View style={{ marginTop: 16 }}>
          <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const tier = TIER_INFO[child.tier];
  const expired = invite ? isInviteExpired(invite.expiresAt) : true;
  const used = Boolean(invite?.usedAt);
  const codeUsable = invite && !expired && !used;

  const shareCode = async () => {
    if (!invite) return;
    await Share.share({
      message: `Código do Recriô para ${child.name}: ${invite.code}\n\nBaixe o app, entre com a conta da criança e digite este código.`,
    });
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 62 }}>{child.avatarEmoji}</Text>
        <Text style={{ fontSize: 26, fontWeight: '900', color: THEME.colors.primary }}>
          {child.name}
        </Text>
        <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '700' }}>
          {tier.emoji} {tier.label} • {tier.schoolYear}
        </Text>
      </View>

      {child.linkedUid ? (
        <View
          style={{
            marginTop: 30,
            padding: 18,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: '#DCFCE7',
            borderWidth: 2,
            borderColor: THEME.colors.success,
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 36 }}>✅</Text>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#15803D' }}>
            Conta vinculada!
          </Text>
          <Text style={{ fontSize: 13, color: '#15803D', textAlign: 'center', fontWeight: '600' }}>
            {child.name} já entra direto com o próprio login.
          </Text>
        </View>
      ) : (
        <View
          style={{
            marginTop: 28,
            padding: 20,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: THEME.colors.card,
            borderWidth: 2,
            borderColor: THEME.colors.border,
            alignItems: 'center',
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.colors.text }}>
            Código de convite
          </Text>

          {codeUsable && invite ? (
            <>
              <Text
                style={{
                  fontSize: 42,
                  fontWeight: '900',
                  letterSpacing: 8,
                  color: THEME.colors.primary,
                }}
                accessibilityLabel={`Código ${invite.code.split('').join(' ')}`}
              >
                {invite.code}
              </Text>

              <View style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: 12 }}>
                <QRCode value={invite.code} size={150} backgroundColor="#FFFFFF" />
              </View>

              <Text
                style={{
                  fontSize: 13,
                  color: THEME.colors.textLight,
                  textAlign: 'center',
                  fontWeight: '600',
                }}
              >
                Vale por 7 dias. A criança digita este código no primeiro acesso.
              </Text>

              <Button label="Compartilhar código" icon="📤" onPress={shareCode} />
            </>
          ) : (
            <>
              <Text style={{ fontSize: 14, color: THEME.colors.danger, fontWeight: '700', textAlign: 'center' }}>
                {used ? 'Este código já foi usado.' : 'Este código expirou.'}
              </Text>
              <Button
                label="Gerar novo código"
                icon="🔄"
                onPress={() => createInvite(child.id)}
              />
            </>
          )}
        </View>
      )}

      <View style={{ marginTop: 26, gap: 10 }}>
        <Button
          label="Configurar tarefas de comportamento"
          icon="✨"
          variant="secondary"
          fullWidth
          onPress={() => {
            useAppStore.getState().setActiveChild(child.id);
            router.push('/(parent)/behavior');
          }}
        />
        <Button label="Voltar ao painel" variant="ghost" onPress={() => router.replace('/(parent)/dashboard')} />
      </View>
    </Screen>
  );
}
