/**
 * Cadastro de filho. A faixa escolar sai automaticamente da data de nascimento.
 */

import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { THEME, TIER_INFO } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { ageFromBirthDate, tierFromBirthDate } from '@/utils/profile';

const AVATARS = ['🧒', '👧', '👦', '🦸', '🦸‍♀️', '🐱', '🐶', '🦊', '🐼', '🦄'];

/** Aceita a digitação progressiva de DD/MM/AAAA. */
function maskDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** 'DD/MM/AAAA' → 'AAAA-MM-DD', ou null se a data não existir no calendário. */
function toISODate(masked: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(masked);
  if (!match) return null;

  const [, day, month, year] = match;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  const parsed = new Date(y, m - 1, d);
  const valid =
    parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;

  return valid ? `${year}-${month}-${day}` : null;
}

export default function NewChild() {
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const addChild = useAppStore((s) => s.addChild);
  const createInvite = useAppStore((s) => s.createInvite);

  const isoBirth = useMemo(() => toISODate(birth), [birth]);
  const age = isoBirth ? ageFromBirthDate(isoBirth) : null;
  const tier = isoBirth ? tierFromBirthDate(isoBirth) : null;

  const birthTouched = birth.length === 10;
  const birthInvalid = birthTouched && !isoBirth;
  const ageOutOfRange = age !== null && (age < 4 || age > 12);
  const canSave = name.trim().length >= 2 && isoBirth !== null && !ageOutOfRange;

  function save() {
    if (!canSave || !isoBirth) return;

    const child = addChild({ name: name.trim(), birthDate: isoBirth, avatarEmoji: avatar });
    createInvite(child.id);
    router.replace(`/(parent)/children/${child.id}`);
  }

  return (
    <Screen>
      <Text style={{ fontSize: 26, fontWeight: '900', color: THEME.colors.primary }}>
        Cadastrar filho
      </Text>
      <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '600', marginTop: 4 }}>
        A faixa escolar é definida automaticamente pela idade.
      </Text>

      <Text style={styles.label}>Nome da criança</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Sofia"
        placeholderTextColor="#D1D5DB"
        accessibilityLabel="Nome da criança"
        style={styles.input}
      />

      <Text style={styles.label}>Data de nascimento</Text>
      <TextInput
        value={birth}
        onChangeText={(text) => setBirth(maskDate(text))}
        placeholder="DD/MM/AAAA"
        placeholderTextColor="#D1D5DB"
        keyboardType="number-pad"
        maxLength={10}
        accessibilityLabel="Data de nascimento"
        style={[styles.input, birthInvalid && { borderColor: THEME.colors.danger }]}
      />

      {birthInvalid && (
        <Text style={styles.error}>Data inválida. Use o formato DD/MM/AAAA.</Text>
      )}

      {ageOutOfRange && (
        <Text style={styles.error}>
          O Recrion foi feito para crianças de 6 a 10 anos.
        </Text>
      )}

      {tier && age !== null && !ageOutOfRange && (
        <View
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: '#F5F3FF',
            borderWidth: 2,
            borderColor: THEME.colors.primary,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '900', color: THEME.colors.primary }}>
            {TIER_INFO[tier].emoji} Faixa {TIER_INFO[tier].label}
          </Text>
          <Text style={{ fontSize: 13, color: THEME.colors.textLight, fontWeight: '600', marginTop: 2 }}>
            {age} anos • {TIER_INFO[tier].schoolYear}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Escolha um avatar</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {AVATARS.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => setAvatar(emoji)}
            accessibilityRole="button"
            accessibilityLabel={`Avatar ${emoji}`}
            accessibilityState={{ selected: avatar === emoji }}
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: avatar === emoji ? '#F5F3FF' : '#FFFFFF',
              borderWidth: 2.5,
              borderColor: avatar === emoji ? THEME.colors.primary : THEME.colors.border,
            }}
          >
            <Text style={{ fontSize: 28 }}>{emoji}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 30, gap: 12 }}>
        <Button label="Salvar e gerar convite" icon="✨" size="lg" fullWidth disabled={!canSave} onPress={save} />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = {
  label: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: THEME.colors.text,
    marginTop: 22,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.input,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: '600' as const,
    color: THEME.colors.text,
  },
  error: {
    color: THEME.colors.danger,
    fontWeight: '700' as const,
    fontSize: 13,
    marginTop: 6,
  },
};
