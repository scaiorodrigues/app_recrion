/**
 * Configuração das obrigações: lista sugerida por categoria + tarefas personalizadas.
 */

import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { BEHAVIOR_CATEGORIES } from '@/constants/game';
import { THEME } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { suggestedDutiesForTier } from '@/utils/behavior';
import type { BehaviorCategoryId, DayOfWeek, Duty } from '@/types';

const ALL_DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const WEEKDAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const DAY_LABEL: Record<DayOfWeek, string> = {
  MON: 'Seg', TUE: 'Ter', WED: 'Qua', THU: 'Qui', FRI: 'Sex', SAT: 'Sáb', SUN: 'Dom',
};

const CUSTOM_EMOJIS = ['⭐', '🎯', '💪', '📌', '🏆', '🎨', '🎵', '🌱'];

export default function BehaviorConfig() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const allDuties = useAppStore((s) => s.duties);
  const setDuties = useAppStore((s) => s.setDuties);

  const [customLabel, setCustomLabel] = useState('');
  const [customEmoji, setCustomEmoji] = useState(CUSTOM_EMOJIS[0]);
  const [customCategory, setCustomCategory] = useState<BehaviorCategoryId>('HOME');

  const duties = useMemo(
    () => allDuties.filter((d) => d.childId === child?.id),
    [allDuties, child?.id],
  );

  if (!child) {
    return (
      <Screen>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>Selecione um filho primeiro.</Text>
        <View style={{ marginTop: 16 }}>
          <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const suggestions = suggestedDutiesForTier(child.tier);

  /** Liga/desliga uma sugestão. Ao ligar, nasce ativa em dias úteis. */
  function toggleSuggestion(suggestionId: string) {
    const existing = duties.find((d) => !d.isCustom && d.id.endsWith(`_${suggestionId}`));

    if (existing) {
      setDuties(child!.id, duties.filter((d) => d.id !== existing.id));
      return;
    }

    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    const duty: Duty = {
      id: `${child!.id}_${suggestion.id}`,
      childId: child!.id,
      category: suggestion.category,
      label: suggestion.label,
      emoji: suggestion.emoji,
      isCustom: false,
      // Higiene e saúde valem todo dia; o resto começa em dias de escola.
      activeDays:
        suggestion.category === 'HYGIENE' || suggestion.category === 'HEALTH'
          ? [...ALL_DAYS]
          : [...WEEKDAYS],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setDuties(child!.id, [...duties, duty]);
  }

  function toggleDay(dutyId: string, day: DayOfWeek) {
    setDuties(
      child!.id,
      duties.map((d) => {
        if (d.id !== dutyId) return d;
        const has = d.activeDays.includes(day);
        return {
          ...d,
          activeDays: has ? d.activeDays.filter((x) => x !== day) : [...d.activeDays, day],
        };
      }),
    );
  }

  function addCustom() {
    const label = customLabel.trim();
    if (label.length < 3) return;

    const duty: Duty = {
      id: `${child!.id}_custom_${Date.now().toString(36)}`,
      childId: child!.id,
      category: customCategory,
      label,
      emoji: customEmoji,
      isCustom: true,
      activeDays: [...ALL_DAYS],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setDuties(child!.id, [...duties, duty]);
    setCustomLabel('');
  }

  const categoryIds = Object.keys(BEHAVIOR_CATEGORIES) as BehaviorCategoryId[];

  return (
    <Screen>
      <Text style={{ fontSize: 25, fontWeight: '900', color: THEME.colors.primary }}>
        Tarefas de {child.name}
      </Text>
      <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '600', marginTop: 2 }}>
        Escolha o que deve aparecer para a criança todo dia.
      </Text>

      {categoryIds.map((categoryId) => {
        const category = BEHAVIOR_CATEGORIES[categoryId];
        const categorySuggestions = suggestions.filter((s) => s.category === categoryId);
        const customs = duties.filter((d) => d.isCustom && d.category === categoryId);

        return (
          <View key={categoryId} style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Text style={{ fontSize: 22 }}>{category.emoji}</Text>
              <Text style={{ fontSize: 17, fontWeight: '900', color: category.color }}>
                {category.label}
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {[...categorySuggestions.map((s) => ({
                key: s.id,
                label: s.label,
                emoji: s.emoji,
                duty: duties.find((d) => !d.isCustom && d.id === `${child.id}_${s.id}`),
                onToggle: () => toggleSuggestion(s.id),
              })), ...customs.map((d) => ({
                key: d.id,
                label: d.label,
                emoji: d.emoji,
                duty: d,
                onToggle: () => setDuties(child.id, duties.filter((x) => x.id !== d.id)),
              }))].map(({ key, label, emoji, duty, onToggle }) => {
                const enabled = Boolean(duty);

                return (
                  <View key={key} style={{ gap: 6 }}>
                    <Pressable
                      onPress={onToggle}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: enabled }}
                      accessibilityLabel={label}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: enabled ? `${category.color}18` : THEME.colors.card,
                        borderRadius: THEME.borderRadius.card,
                        padding: 13,
                        borderWidth: 2,
                        borderColor: enabled ? category.color : THEME.colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{emoji}</Text>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: THEME.colors.text }}>
                        {label}
                      </Text>
                      <Text style={{ fontSize: 20 }}>{enabled ? '✅' : '⬜'}</Text>
                    </Pressable>

                    {/* Dias da semana só aparecem quando a tarefa está ativa */}
                    {duty && (
                      <View style={{ flexDirection: 'row', gap: 5, paddingLeft: 8, flexWrap: 'wrap' }}>
                        {ALL_DAYS.map((day) => {
                          const on = duty.activeDays.includes(day);
                          return (
                            <Pressable
                              key={day}
                              onPress={() => toggleDay(duty.id, day)}
                              accessibilityRole="button"
                              accessibilityLabel={`${DAY_LABEL[day]} ${on ? 'ativo' : 'inativo'}`}
                              style={{
                                paddingVertical: 4,
                                paddingHorizontal: 9,
                                borderRadius: 999,
                                backgroundColor: on ? category.color : '#FFFFFF',
                                borderWidth: 1.5,
                                borderColor: on ? category.color : THEME.colors.border,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '800',
                                  color: on ? '#FFFFFF' : THEME.colors.textLight,
                                }}
                              >
                                {DAY_LABEL[day]}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Tarefa personalizada */}
      <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text, marginTop: 30, marginBottom: 10 }}>
        Criar tarefa personalizada
      </Text>

      <View
        style={{
          backgroundColor: THEME.colors.card,
          borderRadius: THEME.borderRadius.card,
          padding: 15,
          borderWidth: 1,
          borderColor: THEME.colors.border,
          gap: 12,
        }}
      >
        <TextInput
          value={customLabel}
          onChangeText={setCustomLabel}
          placeholder="Ex: Praticar violão 10 minutos"
          placeholderTextColor="#D1D5DB"
          accessibilityLabel="Nome da tarefa personalizada"
          style={{
            backgroundColor: '#F9FAFB',
            borderRadius: THEME.borderRadius.input,
            borderWidth: 2,
            borderColor: THEME.colors.border,
            paddingHorizontal: 12,
            paddingVertical: 11,
            fontSize: 15,
            fontWeight: '600',
            color: THEME.colors.text,
          }}
        />

        <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
          {CUSTOM_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => setCustomEmoji(emoji)}
              accessibilityRole="button"
              accessibilityState={{ selected: customEmoji === emoji }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: customEmoji === emoji ? THEME.colors.primary : THEME.colors.border,
                backgroundColor: customEmoji === emoji ? '#F5F3FF' : '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 21 }}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
          {categoryIds.map((id) => {
            const category = BEHAVIOR_CATEGORIES[id];
            const selected = customCategory === id;
            return (
              <Pressable
                key={id}
                onPress={() => setCustomCategory(id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 11,
                  borderRadius: 999,
                  backgroundColor: selected ? category.color : '#FFFFFF',
                  borderWidth: 2,
                  borderColor: selected ? category.color : THEME.colors.border,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: selected ? '#FFFFFF' : THEME.colors.text }}>
                  {category.emoji} {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Adicionar tarefa"
          icon="➕"
          disabled={customLabel.trim().length < 3}
          onPress={addCustom}
        />
      </View>

      <View style={{ marginTop: 26 }}>
        <Button label="Concluir" icon="✅" size="lg" fullWidth onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
