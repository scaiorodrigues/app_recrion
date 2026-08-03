/**
 * Laboratório de cartas: escolhe elemento, raridade e ataque, e mostra
 * a carta resultante — com revelação animada e compartilhamento.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import CardReveal from '@/components/cards/CardReveal';
import CrionCard from '@/components/cards/CrionCard';
import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { SUBJECT_ELEMENT_MAP } from '@/constants/game';
import { ELEMENT_THEME, RARITY_THRESHOLDS, THEME } from '@/constants/theme';
import { CRIONS } from '@/data/crions';
import useShareCard from '@/hooks/useShareCard';
import type { AttackSlot, Element, ElementContribution, Rarity } from '@/types';
import { today } from '@/utils/profile';

const ELEMENTS: Element[] = [
  'NATURE', 'FIRE', 'WATER', 'EARTH', 'METAL', 'WIND', 'ELECTRIC', 'LIGHT', 'ICE_NPC', 'LEGENDARY',
];

const RARITIES: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
const SLOTS: AttackSlot[] = [1, 2, 3, 4];

/** XP representativo de cada raridade, para preencher o rodapé da carta. */
const XP_BY_RARITY: Record<Rarity, number> = {
  COMMON: 28, UNCOMMON: 50, RARE: 70, EPIC: 88, LEGENDARY: 120,
};

function elementLabel(element: Element): string {
  const found = Object.values(SUBJECT_ELEMENT_MAP).find((s) => s.element === element);
  if (found) return `${found.emoji} ${found.label}`;
  return element === 'ICE_NPC' ? '❄️ Gelo' : '🌟 Lendário';
}

function Chip({
  label,
  selected,
  color,
  onPress,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 13,
        borderRadius: 999,
        backgroundColor: selected ? color : '#FFFFFF',
        borderWidth: 2,
        borderColor: selected ? color : THEME.colors.border,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '800',
          color: selected ? '#FFFFFF' : THEME.colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function CardLab() {
  const [element, setElement] = useState<Element>('WATER');
  const [rarity, setRarity] = useState<Rarity>('COMMON');
  const [slot, setSlot] = useState<AttackSlot>(1);
  const [crionIndex, setCrionIndex] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [foil, setFoil] = useState(false);

  const { cardRef, shareCard, sharing } = useShareCard();

  /** Crions que existem para a combinação escolhida. */
  const matches = useMemo(
    () => CRIONS.filter((c) => c.element === element && c.rarity === rarity),
    [element, rarity],
  );

  const crion = matches[crionIndex % Math.max(1, matches.length)] ?? null;

  /** Raridades que realmente existem para o elemento selecionado. */
  const availableRarities = useMemo(
    () => new Set(CRIONS.filter((c) => c.element === element).map((c) => c.rarity)),
    [element],
  );

  function pickElement(next: Element) {
    setElement(next);
    setCrionIndex(0);
    // Mantém a raridade se existir para o novo elemento; senão volta para a primeira.
    const pool = CRIONS.filter((c) => c.element === next);
    if (!pool.some((c) => c.rarity === rarity)) {
      setRarity(pool[0]?.rarity ?? 'COMMON');
    }
  }

  const date = today();
  const xp = XP_BY_RARITY[rarity];

  /** Matérias de exemplo, só para a demonstração mostrar os losangos. */
  const contributions: ElementContribution[] = useMemo(() => {
    if (!crion) return [];
    const primary: ElementContribution = {
      subject: 'portugues',
      element: 'NATURE',
      value: 100,
      primary: crion.element === 'NATURE',
    };
    return [
      { ...primary, element: crion.element, primary: true },
      { subject: 'matematica', element: 'FIRE', value: 85, primary: false },
      { subject: 'comportamento', element: 'LIGHT', value: 100, primary: false },
    ];
  }, [crion]);

  if (revealing && crion) {
    return (
      <Screen>
        <CardReveal
          crion={crion}
          attackSlot={slot}
          rarity={rarity}
          xp={xp}
          date={date}
          childName="Sofia"
          contributions={contributions}
          foil={foil}
        />
        <View style={{ marginTop: 24, alignItems: 'center' }}>
          <Button label="Voltar ao laboratório" variant="ghost" onPress={() => setRevealing(false)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: THEME.colors.primary }}>
          Laboratório de Cartas
        </Text>
        <Button label="Voltar" size="sm" variant="ghost" onPress={() => router.back()} />
      </View>

      <Text style={{ fontSize: 13, color: THEME.colors.textLight, marginTop: 4, fontWeight: '600' }}>
        {CRIONS.length} Crions no banco • {CRIONS.length * 4} cartas possíveis
      </Text>

      {/* Elemento */}
      <Text style={styles.sectionTitle}>Elemento</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ELEMENTS.map((e) => (
          <Chip
            key={e}
            label={elementLabel(e)}
            selected={element === e}
            color={ELEMENT_THEME[e].accent}
            onPress={() => pickElement(e)}
          />
        ))}
      </ScrollView>

      {/* Raridade */}
      <Text style={styles.sectionTitle}>Raridade</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {RARITIES.map((r) => (
          <Chip
            key={r}
            label={`${RARITY_THRESHOLDS[r].symbol} ${RARITY_THRESHOLDS[r].label}`}
            selected={rarity === r}
            color={RARITY_THRESHOLDS[r].color}
            disabled={!availableRarities.has(r)}
            onPress={() => {
              setRarity(r);
              setCrionIndex(0);
            }}
          />
        ))}
      </ScrollView>

      {/* Ataque */}
      <Text style={styles.sectionTitle}>Ataque da carta</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SLOTS.map((s) => (
          <Chip
            key={s}
            label={crion?.attacks.find((a) => a.slot === s)?.name ?? `Ataque ${s}`}
            selected={slot === s}
            color={THEME.colors.primary}
            onPress={() => setSlot(s)}
          />
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Acabamento</Text>
      <View style={styles.row}>
        <Chip
          label={foil ? '✨ Holográfica' : 'Normal'}
          selected={foil}
          color="#8B5CF6"
          onPress={() => setFoil((v) => !v)}
        />
      </View>

      {/* Carta */}
      <View style={{ alignItems: 'center', marginTop: 22 }}>
        {crion ? (
          <>
            <View ref={cardRef} collapsable={false} style={{ backgroundColor: THEME.colors.background }}>
              <CrionCard
                crion={crion}
                attackSlot={slot}
                rarity={rarity}
                xp={xp}
                date={date}
                childName="Sofia"
                contributions={contributions}
                foil={foil}
              />
            </View>

            {matches.length > 1 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
                <Button
                  label="◀"
                  size="sm"
                  variant="ghost"
                  onPress={() => setCrionIndex((i) => (i - 1 + matches.length) % matches.length)}
                />
                <Text style={{ fontWeight: '800', color: THEME.colors.textLight }}>
                  {(crionIndex % matches.length) + 1} / {matches.length}
                </Text>
                <Button
                  label="▶"
                  size="sm"
                  variant="ghost"
                  onPress={() => setCrionIndex((i) => (i + 1) % matches.length)}
                />
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button label="Ver revelação" icon="🥚" onPress={() => setRevealing(true)} />
              <Button
                label="Compartilhar"
                icon="📤"
                variant="secondary"
                loading={sharing}
                onPress={() => shareCard(crion.name)}
              />
            </View>

            <Text
              style={{
                marginTop: 18,
                fontSize: 13,
                color: THEME.colors.textLight,
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              {crion.description}
            </Text>
          </>
        ) : (
          <Text style={{ color: THEME.colors.textLight, fontWeight: '600' }}>
            Nenhum Crion para essa combinação.
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = {
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: THEME.colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  row: { gap: 8, paddingRight: 16 },
};
