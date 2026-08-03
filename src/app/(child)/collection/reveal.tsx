/**
 * Revelação do Crion do dia. A carta é salva ao terminar a animação.
 */

import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import CardReveal from '@/components/cards/CardReveal';
import CrionCard from '@/components/cards/CrionCard';
import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { RARITY_THRESHOLDS, THEME } from '@/constants/theme';
import useDailyCrion from '@/hooks/useDailyCrion';
import useShareCard from '@/hooks/useShareCard';
import { notifyCrionReady } from '@/services/notifications';
import { useAppStore } from '@/stores/useAppStore';
import { today } from '@/utils/profile';

export default function Reveal() {
  const date = today();
  const generation = useDailyCrion(date);
  const addCard = useAppStore((s) => s.addCard);
  const markCardRevealed = useAppStore((s) => s.markCardRevealed);

  const [revealed, setRevealed] = useState(false);
  const { cardRef, shareCard, sharing } = useShareCard();

  const handleRevealed = useCallback(() => {
    if (!generation) return;

    addCard(generation.card);
    markCardRevealed(generation.card.id);
    void notifyCrionReady(generation.crion.name, RARITY_THRESHOLDS[generation.rarity].label);
    setRevealed(true);
  }, [generation, addCard, markCardRevealed]);

  if (!generation) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', paddingTop: 70, gap: 12 }}>
          <Text style={{ fontSize: 60 }}>🌱</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: THEME.colors.text, textAlign: 'center' }}>
            Nenhum Crion pronto ainda hoje.
          </Text>
          <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const { crion, card, rarity, xp, attackSlot, foil, contributions, stats, artUris } =
    generation;

  return (
    <Screen>
      <CardReveal
        crion={crion}
        attackSlot={attackSlot}
        rarity={rarity}
        xp={xp}
        date={card.date}
        childName={card.childName}
        contributions={contributions}
        stats={stats}
        artUris={artUris}
        foil={foil}
        onRevealed={handleRevealed}
      />

      {revealed && (
        <>
          {/* Cópia oculta usada só para capturar a imagem compartilhável. */}
          <View style={{ position: 'absolute', left: -9999 }}>
            <View ref={cardRef} collapsable={false} style={{ backgroundColor: THEME.colors.background }}>
              <CrionCard
                crion={crion}
                attackSlot={attackSlot}
                rarity={rarity}
                xp={xp}
                date={card.date}
                childName={card.childName}
                contributions={contributions}
                stats={stats}
                artUris={artUris}
                foil={foil}
                showParticles={false}
              />
            </View>
          </View>

          <View style={{ marginTop: 24, gap: 10, alignItems: 'center' }}>
            <Button
              label="Compartilhar minha carta"
              icon="📤"
              size="lg"
              variant="secondary"
              loading={sharing}
              onPress={() => shareCard(crion.name)}
            />
            <Button
              label="Ver minha coleção"
              variant="ghost"
              onPress={() => router.replace('/(child)/collection')}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
