/**
 * Tabuleiro: mundos temáticos liberados por faixa etária e elemento do dia.
 */

import { Text, View } from 'react-native';

import Screen from '@/components/ui/Screen';
import { SUBSCRIPTION_PLANS } from '@/constants/game';
import { THEME, TIER_INFO } from '@/constants/theme';
import { QUADRANTS_PER_WORLD, WORLDS, WORLD_THEME_COLORS } from '@/data/worlds';
import useDailyCrion from '@/hooks/useDailyCrion';
import { useAppStore } from '@/stores/useAppStore';
import { today } from '@/utils/profile';
import type { Tier } from '@/types';

const TIER_ORDER: Tier[] = ['TIER_1', 'TIER_2', 'TIER_3', 'TIER_4'];

export default function Board() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const subscription = useAppStore((s) => s.subscription);
  const generation = useDailyCrion(today());

  if (!child) {
    return (
      <Screen>
        <Text style={{ fontSize: 16, fontWeight: '700', color: THEME.colors.text }}>
          Entre com seu código para ver o tabuleiro.
        </Text>
      </Screen>
    );
  }

  const childTierIndex = TIER_ORDER.indexOf(child.tier);
  const dailyElement = generation?.element ?? null;

  // No plano gratuito só entram o primeiro mundo e o Jardim Celestial.
  const freeWorldIds = ['w1', 'w7'];
  const worldLimitApplies = subscription.tier === 'free';

  return (
    <Screen>
      <Text style={{ fontSize: 25, fontWeight: '900', color: THEME.colors.primary }}>
        Tabuleiro 🗺️
      </Text>
      <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '700', marginTop: 2 }}>
        {dailyElement
          ? `Seu Crion de hoje é de ${dailyElement === 'LIGHT' ? 'Luz ✨' : dailyElement}`
          : 'Gere o Crion de hoje para desafiar os mundos'}
      </Text>

      <View style={{ marginTop: 22, gap: 12 }}>
        {WORLDS.map((world) => {
          const theme = WORLD_THEME_COLORS[world.theme];
          const tierLocked = TIER_ORDER.indexOf(world.minTier) > childTierIndex;
          const planLocked = worldLimitApplies && !freeWorldIds.includes(world.id);

          // O Jardim Celestial exige que o Crion do dia seja de Luz.
          const elementLocked =
            world.requiresElement !== null && dailyElement !== world.requiresElement;

          const locked = tierLocked || planLocked || elementLocked;

          const reason = tierLocked
            ? `🔒 A partir da faixa ${TIER_INFO[world.minTier].label}`
            : planLocked
              ? '🔒 Disponível na assinatura'
              : elementLocked
                ? '✨ Precisa de um Crion de Luz hoje'
                : `${QUADRANTS_PER_WORLD} quadrantes`;

          return (
            <View
              key={world.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                backgroundColor: locked ? THEME.colors.card : theme.bg,
                borderRadius: THEME.borderRadius.card,
                padding: 16,
                borderWidth: 2.5,
                borderColor: locked ? THEME.colors.border : theme.accent,
                opacity: locked ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 32 }}>{theme.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text }}>
                  {world.name}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: locked ? THEME.colors.textLight : theme.accent }}>
                  {reason}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text
        style={{
          marginTop: 22,
          fontSize: 12,
          color: THEME.colors.textLight,
          textAlign: 'center',
          fontWeight: '600',
          lineHeight: 18,
        }}
      >
        O combate entra na próxima atualização. Continue colecionando seus Crions! 🃏
      </Text>

      {subscription.tier === 'free' && (
        <Text
          style={{
            marginTop: 10,
            fontSize: 12,
            color: THEME.colors.textLight,
            textAlign: 'center',
            fontWeight: '600',
          }}
        >
          Plano gratuito: {SUBSCRIPTION_PLANS.free.boardWorlds} mundos liberados.
        </Text>
      )}
    </Screen>
  );
}
