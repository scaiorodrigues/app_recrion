/**
 * Login da criança: entra com Google e, no primeiro acesso,
 * digita o código de convite gerado pelo pai.
 */

import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { THEME } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';

const CODE_LENGTH = 6;

export default function ChildLogin() {
  const [signedIn, setSignedIn] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const redeemInvite = useAppStore((s) => s.redeemInvite);
  const setRole = useAppStore((s) => s.setRole);
  const children = useAppStore((s) => s.children);

  // Se esta conta já foi vinculada antes, entra direto — sem pedir código de novo.
  function signInWithGoogle() {
    const alreadyLinked = children.find((c) => c.linkedUid === 'child_demo');
    setRole('child');

    if (alreadyLinked) {
      useAppStore.getState().setActiveChild(alreadyLinked.id);
      router.replace('/(child)/activities');
      return;
    }
    setSignedIn(true);
  }

  function submitCode() {
    setError(null);
    const result = redeemInvite(code, 'child_demo');

    if (!result.ok) {
      setError(result.reason);
      return;
    }
    router.replace('/(child)/activities');
  }

  if (!signedIn) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
          <Text style={{ fontSize: 70 }}>🧒</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: THEME.colors.secondary }}>
            Oi! Vamos começar?
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
            Entre com sua conta para ver suas atividades e seus Crions.
          </Text>
        </View>

        <View style={{ marginTop: 50, gap: 14 }}>
          <Button
            label="Entrar com Google"
            icon="🔐"
            size="lg"
            variant="secondary"
            fullWidth
            onPress={signInWithGoogle}
          />
          <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingTop: 44, gap: 12 }}>
        <Text style={{ fontSize: 66 }}>🔑</Text>
        <Text style={{ fontSize: 25, fontWeight: '900', color: THEME.colors.primary }}>
          Código do papai ou da mamãe
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: THEME.colors.textLight,
            textAlign: 'center',
            fontWeight: '600',
            paddingHorizontal: 16,
          }}
        >
          Peça o código de 6 letrinhas para o seu responsável e digite aqui.
        </Text>
      </View>

      <View style={{ marginTop: 36, gap: 12 }}>
        <TextInput
          value={code}
          onChangeText={(text) => {
            setCode(text.toUpperCase().slice(0, CODE_LENGTH));
            setError(null);
          }}
          placeholder="AB3K7X"
          placeholderTextColor="#D1D5DB"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={CODE_LENGTH}
          accessibilityLabel="Código de convite"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: THEME.borderRadius.input,
            borderWidth: 3,
            borderColor: error ? THEME.colors.danger : THEME.colors.primary,
            paddingVertical: 18,
            fontSize: 34,
            fontWeight: '900',
            textAlign: 'center',
            letterSpacing: 10,
            color: THEME.colors.text,
          }}
        />

        {error && (
          <Text style={{ color: THEME.colors.danger, fontWeight: '700', textAlign: 'center' }}>
            {error}
          </Text>
        )}

        <Button
          label="Entrar"
          icon="✨"
          size="lg"
          fullWidth
          disabled={code.length < CODE_LENGTH}
          onPress={submitCode}
        />

        <Button label="Voltar" variant="ghost" onPress={() => setSignedIn(false)} />
      </View>
    </Screen>
  );
}
