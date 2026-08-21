/**
 * Planos de assinatura. O módulo de comportamento nunca entra no paywall.
 */

import { Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { SUBSCRIPTION_PLANS, TRIAL_DAYS } from '@/constants/game';
import { THEME } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { resolveAccess } from '@/utils/subscription';
import type { SubscriptionTier } from '@/types';

interface PlanCard {
  tier: SubscriptionTier;
  title: string;
  price: string;
  highlight: boolean;
  features: string[];
}

const PLANS: PlanCard[] = [
  {
    tier: 'free',
    title: `Teste de ${TRIAL_DAYS} dias`,
    price: 'R$ 0',
    highlight: false,
    features: [
      'Acesso total por 3 dias: todas as matérias',
      'Todas as raridades, inclusive a Lendária holográfica',
      'Todos os mundos do tabuleiro',
      '✨ Comportamento completo, para sempre — mesmo depois do teste',
      'Limite diário de atividades continua valendo',
    ],
  },
  {
    tier: 'subject',
    title: 'Uma matéria',
    price: SUBSCRIPTION_PLANS.subject.price,
    highlight: false,
    features: [
      'Atividades ilimitadas na matéria escolhida',
      '✨ Comportamento completo, para sempre',
      'Crions até Épico',
      'Mundos do tabuleiro liberados',
    ],
  },
  {
    tier: 'bundle',
    title: 'Pacote completo',
    price: SUBSCRIPTION_PLANS.bundle.price,
    highlight: true,
    features: [
      'Todas as matérias, sem limite',
      '✨ Comportamento completo, para sempre',
      'Crions até Lendário',
      '+20% de XP em todas as matérias',
      '+30% de XP de Luz no comportamento',
      'Crions exclusivos do pacote',
      'Relatório avançado de comportamento',
    ],
  },
];

export default function Subscription() {
  const subscription = useAppStore((s) => s.subscription);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const access = resolveAccess(subscription);

  return (
    <Screen>
      <Text style={{ fontSize: 26, fontWeight: '900', color: THEME.colors.primary }}>
        Assinatura
      </Text>
      <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '600', marginTop: 2 }}>
        O módulo de comportamento é gratuito em todos os planos.
      </Text>

      {access.trialActive && (
        <View
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: '#F5F3FF',
            borderWidth: 2,
            borderColor: THEME.colors.primary,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '900', color: THEME.colors.primary }}>
            Teste em andamento — {access.trialDaysLeft}{' '}
            {access.trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}
          </Text>
          <Text style={{ fontSize: 13, color: THEME.colors.textLight, fontWeight: '600', marginTop: 3 }}>
            Seu filho está com acesso a tudo. Assine antes do fim para não perder a sequência.
          </Text>
        </View>
      )}

      {access.trialExpired && (
        <View
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: THEME.borderRadius.card,
            backgroundColor: '#FEF3C7',
            borderWidth: 2,
            borderColor: THEME.colors.secondary,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#92400E' }}>
            O teste de {TRIAL_DAYS} dias terminou
          </Text>
          <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '600', marginTop: 3 }}>
            As tarefas de comportamento e os Crions de Luz continuam liberados, sempre.
          </Text>
        </View>
      )}

      <View style={{ marginTop: 22, gap: 14 }}>
        {PLANS.map((plan) => {
          const active =
            plan.tier === 'free'
              ? subscription.tier === 'free' && access.trialActive
              : subscription.tier === plan.tier;

          return (
            <View
              key={plan.tier}
              style={{
                backgroundColor: THEME.colors.card,
                borderRadius: THEME.borderRadius.card,
                padding: 18,
                borderWidth: 3,
                borderColor: active
                  ? THEME.colors.success
                  : plan.highlight
                    ? THEME.colors.secondary
                    : THEME.colors.border,
                gap: 10,
              }}
            >
              {plan.highlight && !active && (
                <Text style={{ fontSize: 11, fontWeight: '900', color: THEME.colors.secondary }}>
                  ⭐ MAIS ESCOLHIDO
                </Text>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: THEME.colors.text }}>
                  {plan.title}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: THEME.colors.primary }}>
                  {plan.price}
                </Text>
              </View>

              <View style={{ gap: 5 }}>
                {plan.features.map((feature) => (
                  <Text key={feature} style={{ fontSize: 13, color: THEME.colors.text, fontWeight: '600' }}>
                    • {feature}
                  </Text>
                ))}
              </View>

              {active ? (
                <Text style={{ fontSize: 14, fontWeight: '900', color: THEME.colors.success }}>
                  {plan.tier === 'free' ? '✅ Teste em andamento' : '✅ Seu plano atual'}
                </Text>
              ) : (
                <Button
                  label={plan.tier === 'free' ? 'Teste já utilizado' : 'Assinar'}
                  variant={plan.highlight ? 'secondary' : 'primary'}
                  fullWidth
                  disabled={plan.tier === 'free'}
                  onPress={() =>
                    // TODO: trocar pela compra real via RevenueCat quando os
                    // produtos estiverem configurados no Google Play Console.
                    setSubscription({
                      tier: plan.tier,
                      activeSubjects:
                        plan.tier === 'bundle'
                          ? ['portugues', 'matematica', 'ingles', 'ciencias', 'logica', 'arte', 'musica']
                          : ['portugues'],
                    })
                  }
                />
              )}
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
          lineHeight: 17,
        }}
      >
        Os pagamentos são processados pelo Google Play. Você pode cancelar quando quiser.
      </Text>
    </Screen>
  );
}
