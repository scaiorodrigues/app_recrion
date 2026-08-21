import { TRIAL_DAYS } from '@/constants/game';
import type { SubscriptionState } from '@/types';
import {
  hasPaidPlan,
  isTrialActive,
  resolveAccess,
  startTrial,
  trialDaysLeft,
} from '@/utils/subscription';

const DAY0 = new Date(2026, 7, 2, 10, 0, 0);
const daysAfter = (n: number) => new Date(DAY0.getTime() + n * 24 * 60 * 60 * 1000);

function sub(over: Partial<SubscriptionState> = {}): SubscriptionState {
  return { tier: 'free', activeSubjects: [], ...over };
}

const started = sub({ trialStartedAt: DAY0.toISOString() });

describe('trialDaysLeft', () => {
  it('começa com os 3 dias completos', () => {
    expect(trialDaysLeft(started, DAY0)).toBe(TRIAL_DAYS);
  });

  it('consome um dia por vez', () => {
    expect(trialDaysLeft(started, daysAfter(1))).toBe(2);
    expect(trialDaysLeft(started, daysAfter(2))).toBe(1);
  });

  it('zera quando o teste acaba', () => {
    expect(trialDaysLeft(started, daysAfter(3))).toBe(0);
    expect(trialDaysLeft(started, daysAfter(10))).toBe(0);
  });

  it('é zero se o teste nunca começou', () => {
    expect(trialDaysLeft(sub(), DAY0)).toBe(0);
  });
});

describe('isTrialActive', () => {
  it('vale durante os 3 dias', () => {
    expect(isTrialActive(started, daysAfter(2))).toBe(true);
  });

  it('expira no quarto dia', () => {
    expect(isTrialActive(started, daysAfter(3))).toBe(false);
  });
});

describe('hasPaidPlan', () => {
  it('plano gratuito nunca é pago', () => {
    expect(hasPaidPlan(sub(), DAY0)).toBe(false);
  });

  it('assinatura sem validade é considerada ativa', () => {
    expect(hasPaidPlan(sub({ tier: 'bundle' }), DAY0)).toBe(true);
  });

  it('assinatura vencida não vale', () => {
    const expired = sub({ tier: 'bundle', expiresAt: DAY0.toISOString() });
    expect(hasPaidPlan(expired, daysAfter(1))).toBe(false);
  });
});

describe('resolveAccess', () => {
  it('teste ativo libera tudo, inclusive a raridade máxima', () => {
    const access = resolveAccess(started, daysAfter(1));
    expect(access.trialActive).toBe(true);
    expect(access.maxRarity).toBe('LEGENDARY');
    expect(access.subjects).toHaveLength(7);
    expect(access.boardWorlds).toBe(8);
  });

  it('teste expirado tranca as matérias mas mantém o comportamento', () => {
    const access = resolveAccess(started, daysAfter(4));
    expect(access.trialExpired).toBe(true);
    expect(access.subjects).toHaveLength(0);
    expect(access.behavior).toBe(true);
  });

  it('assinatura de matéria libera só o que foi contratado', () => {
    const access = resolveAccess(
      sub({ tier: 'subject', activeSubjects: ['matematica'] }),
      daysAfter(10),
    );
    expect(access.subjects).toEqual(['matematica']);
    expect(access.maxRarity).toBe('EPIC');
    expect(access.xpMultiplier).toBe(1);
  });

  it('pacote completo libera tudo e dá os multiplicadores', () => {
    const access = resolveAccess(sub({ tier: 'bundle' }), daysAfter(10));
    expect(access.subjects).toHaveLength(7);
    expect(access.maxRarity).toBe('LEGENDARY');
    expect(access.xpMultiplier).toBeGreaterThan(1);
    expect(access.lightMultiplier).toBeGreaterThan(1);
  });

  it('plano pago vence o teste ainda em andamento', () => {
    const both = sub({ tier: 'bundle', trialStartedAt: DAY0.toISOString() });
    const access = resolveAccess(both, daysAfter(1));
    expect(access.trialActive).toBe(false);
    expect(access.xpMultiplier).toBeGreaterThan(1);
  });
});

describe('startTrial', () => {
  it('marca o início do teste', () => {
    expect(startTrial(sub(), DAY0).trialStartedAt).toBe(DAY0.toISOString());
  });

  it('não reinicia um teste já começado', () => {
    expect(startTrial(started, daysAfter(5)).trialStartedAt).toBe(DAY0.toISOString());
  });
});
