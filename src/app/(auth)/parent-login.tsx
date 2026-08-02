/**
 * Login do responsável com Google.
 *
 * Sem credenciais Firebase configuradas, o botão cria uma sessão local
 * de demonstração para que o fluxo inteiro continue navegável.
 */

import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { isFirebaseConfigured } from '@/services/firebase';
import { useAppStore } from '@/stores/useAppStore';

export default function ParentLogin() {
  const [loading, setLoading] = useState(false);
  const setParent = useAppStore((s) => s.setParent);
  const setRole = useAppStore((s) => s.setRole);

  async function signIn() {
    setLoading(true);
    try {
      // TODO: trocar pelo fluxo real do Google Sign-In quando o Firebase
      // estiver configurado (GoogleSignin.signIn + signInWithCredential).
      setParent({
        uid: 'parent_demo',
        email: 'responsavel@exemplo.com',
        name: 'Responsável',
        childIds: [],
        createdAt: new Date().toISOString(),
      });
      setRole('parent');
      router.replace('/(parent)/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
        <Text style={{ fontSize: 70 }}>👨‍👩‍👧</Text>
        <Text style={{ fontSize: 28, fontWeight: '900', color: THEME.colors.primary }}>
          Bem-vindo!
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: THEME.colors.textLight,
            textAlign: 'center',
            fontWeight: '600',
            paddingHorizontal: 20,
          }}
        >
          Entre com sua conta Google para cadastrar seus filhos e acompanhar o progresso deles.
        </Text>
      </View>

      <View style={{ marginTop: 50 }}>
        <Button
          label="Entrar com Google"
          icon="🔐"
          size="lg"
          fullWidth
          loading={loading}
          onPress={signIn}
        />
      </View>

      {!isFirebaseConfigured && (
        <View
          style={{
            marginTop: 28,
            padding: 14,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: '#FEF3C7',
            borderWidth: 1,
            borderColor: '#F59E0B',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400E' }}>
            Modo demonstração
          </Text>
          <Text style={{ fontSize: 12, color: '#92400E', marginTop: 4, lineHeight: 17 }}>
            O Firebase ainda não foi configurado. Os dados ficam apenas neste aparelho e são
            perdidos ao fechar o app. Consulte o README para conectar seu projeto.
          </Text>
        </View>
      )}

      <View style={{ marginTop: 24, alignItems: 'center' }}>
        <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
