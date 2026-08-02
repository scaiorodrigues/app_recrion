/**
 * Coleção de cartas da criança, com destaque para o Crion de hoje.
 */

import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import CrionCard from '@/components/cards/CrionCard';
import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { RARITY_THRESHOLDS, THEME } from '@/constants/theme';
import useDailyCrion from '@/hooks/useDailyCrion';
import { useActiveChild, useAppStore } from '@/stores/useAppStore';
import { findCrionById } from '@/utils/generation';
import { formatDateBR, today } from '@/utils/profile';

export default function Collection() {
  const child = useActiveChild();
  const allCards = useAppStore((s) => s.cards);

  const date = today();
  const generation = useDailyCrion(date);

  const cards = useMemo(
    () => allCards.filter((c) => c.childId === child?.id),
    [allCards, child?.id],
  );

  const todayCard = cards.find((c) => c.date === date);
  const pastCards = useMemo(
    () => cards.filter((c) => c.date !== date).sort((a, b) => b.date.localeCompare(a.date)),
    [cards, date],
  );

  if (!child) {
    return (
      <Screen>
        <Text style={{ fontSize: 16, fontWeight: '700', color: THEME.colors.text }}>
          Entre com seu código para ver sua coleção.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ fontSize: 25, fontWeight: '900', color: THEME.colors.primary }}>
        Minha Coleção 🃏
      </Text>
      <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '700', marginTop: 2 }}>
        {cards.length} {cards.length === 1 ? 'carta conquistada' : 'cartas conquistadas'}
      </Text>

      {/* Crion de hoje */}
      {generation && !todayCard && (
        <Pressable
          onPress={() => router.push('/(child)/collection/reveal')}
          accessibilityRole="button"
          accessibilityLabel="Revelar o Crion de hoje"
          style={{
            marginTop: 22,
            padding: 24,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: '#F5F3FF',
            borderWidth: 3,
            borderColor: THEME.colors.primary,
            alignItems: 'center',
            gap: 7,
          }}
        >
          <Text style={{ fontSize: 66 }}>🥚</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: THEME.colors.primary }}>
            Seu Crion de hoje nasceu!
          </Text>
          <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '700' }}>
            Toque para revelar ✨
          </Text>
        </Pressable>
      )}

      {!generation && !todayCard && (
        <View
          style={{
            marginTop: 22,
            padding: 22,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: THEME.colors.card,
            borderWidth: 2,
            borderColor: THEME.colors.border,
            alignItems: 'center',
            gap: 7,
          }}
        >
          <Text style={{ fontSize: 50 }}>🌱</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: THEME.colors.text, textAlign: 'center' }}>
            Seu Crion de hoje ainda está crescendo
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: THEME.colors.textLight,
              textAlign: 'center',
              fontWeight: '600',
            }}
          >
            Faça suas atividades e suas tarefas — quando o papai ou a mamãe aprovar tudo, ele nasce!
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              label="Atividades"
              icon="📚"
              size="sm"
              onPress={() => router.push('/(child)/activities')}
            />
            <Button
              label="Minhas tarefas"
              icon="✨"
              size="sm"
              variant="secondary"
              onPress={() => router.push('/(child)/behavior')}
            />
          </View>
        </View>
      )}

      {/* Carta de hoje já revelada */}
      {todayCard && (
        <View style={{ marginTop: 22, alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text }}>
            Crion de hoje
          </Text>
          {(() => {
            const crion = findCrionById(todayCard.crionId);
            if (!crion) return null;
            return (
              <CrionCard
                crion={crion}
                attackSlot={todayCard.attackSlot}
                rarity={todayCard.rarity}
                xp={todayCard.xp}
                date={todayCard.date}
                childName={todayCard.childName}
                primarySubject={todayCard.primarySubject}
                foil={todayCard.foil}
                width={260}
              />
            );
          })()}
        </View>
      )}

      {/* Cartas anteriores */}
      {pastCards.length > 0 && (
        <>
          <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text, marginTop: 30, marginBottom: 12 }}>
            Cartas anteriores
          </Text>

          <View style={{ gap: 10 }}>
            {pastCards.map((card) => {
              const crion = findCrionById(card.crionId);
              if (!crion) return null;
              const rarityInfo = RARITY_THRESHOLDS[card.rarity];

              return (
                <View
                  key={card.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: THEME.colors.card,
                    borderRadius: THEME.borderRadius.card,
                    padding: 14,
                    borderWidth: 2,
                    borderColor: rarityInfo.color,
                  }}
                >
                  <Text style={{ fontSize: 34 }}>{crion.baseEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: THEME.colors.text }}>
                      {crion.name}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: rarityInfo.color }}>
                      {rarityInfo.symbol} {rarityInfo.label} • {card.xp} XP
                      {card.foil ? ' ✨' : ''}
                    </Text>
                    <Text style={{ fontSize: 12, color: THEME.colors.textLight, fontWeight: '600' }}>
                      {formatDateBR(card.date)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}
