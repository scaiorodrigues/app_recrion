import { SENTENCES_BY_TIER } from '@/data/sentences';
import { WORDS_BY_TIER } from '@/data/words';
import { buildAutoGradedActivity, scoreFromMistakes } from '@/utils/exercise';
import type { Tier } from '@/types';

const TIERS: Tier[] = ['TIER_1', 'TIER_2', 'TIER_3', 'TIER_4'];

describe('scoreFromMistakes', () => {
  it('dá nota cheia para quem não errou', () => {
    expect(scoreFromMistakes(0)).toBe(100);
  });

  it('desconta a cada erro', () => {
    expect(scoreFromMistakes(1)).toBeLessThan(scoreFromMistakes(0));
    expect(scoreFromMistakes(3)).toBeLessThan(scoreFromMistakes(1));
  });

  it('não deixa a nota cair a zero por mais que a criança erre', () => {
    expect(scoreFromMistakes(50)).toBeGreaterThanOrEqual(40);
  });
});

describe('buildAutoGradedActivity', () => {
  const base = {
    childId: 'child_1',
    date: '2026-08-04',
    subject: 'portugues' as const,
    tier: 'TIER_2' as Tier,
    exerciseId: 'ler-frase',
    startedAt: Date.now() - 4000,
  };

  it('já nasce aprovada, sem esperar o responsável', () => {
    const activity = buildAutoGradedActivity({ ...base, mistakes: 0 });
    expect(activity.status).toBe('APPROVED');
    expect(activity.validatedAt).toBeTruthy();
  });

  it('usa a própria nota como nota validada', () => {
    const activity = buildAutoGradedActivity({ ...base, mistakes: 2 });
    expect(activity.validatedScore).toBe(activity.score);
  });

  it('guarda os erros como redoCount, que é o que mede acerto de primeira', () => {
    expect(buildAutoGradedActivity({ ...base, mistakes: 0 }).redoCount).toBe(0);
    expect(buildAutoGradedActivity({ ...base, mistakes: 3 }).redoCount).toBe(3);
  });

  it('respeita uma atividade por matéria por dia no id', () => {
    const a = buildAutoGradedActivity({ ...base, exerciseId: 'ler-frase', mistakes: 0 });
    const b = buildAutoGradedActivity({ ...base, exerciseId: 'ordenar-frase', mistakes: 1 });
    expect(a.id).toBe(b.id);
  });

  it('registra a duração da atividade', () => {
    const activity = buildAutoGradedActivity({ ...base, mistakes: 0 });
    expect(activity.durationSeconds).toBeGreaterThanOrEqual(3);
  });
});

describe('banco de frases', () => {
  it('tem frases para todas as faixas', () => {
    TIERS.forEach((tier) => expect(SENTENCES_BY_TIER[tier].length).toBeGreaterThan(0));
  });

  it('tem frases suficientes para as 3 rodadas do exercício', () => {
    TIERS.forEach((tier) => expect(SENTENCES_BY_TIER[tier].length).toBeGreaterThanOrEqual(3));
  });

  it('nunca repete a cena certa entre as erradas', () => {
    TIERS.forEach((tier) => {
      SENTENCES_BY_TIER[tier].forEach((s) => {
        expect(s.distractors).not.toContain(s.scene);
        expect(new Set(s.distractors).size).toBe(s.distractors.length);
      });
    });
  });

  it('dá sempre duas cenas erradas, para a escolha ter três opções', () => {
    TIERS.forEach((tier) => {
      SENTENCES_BY_TIER[tier].forEach((s) => expect(s.distractors).toHaveLength(2));
    });
  });

  it('não tem id repetido', () => {
    const ids = TIERS.flatMap((tier) => SENTENCES_BY_TIER[tier].map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cresce em palavras conforme a faixa avança', () => {
    const media = (tier: Tier) => {
      const frases = SENTENCES_BY_TIER[tier];
      return frases.reduce((sum, s) => sum + s.words.length, 0) / frases.length;
    };
    expect(media('TIER_2')).toBeGreaterThan(media('TIER_1'));
  });
});

describe('banco de palavras', () => {
  it('tem palavras suficientes para os 4 pares do exercício de ligar', () => {
    TIERS.forEach((tier) => expect(WORDS_BY_TIER[tier].length).toBeGreaterThanOrEqual(4));
  });

  it('não repete emoji dentro da faixa, senão duas figuras ficam iguais', () => {
    TIERS.forEach((tier) => {
      const emojis = WORDS_BY_TIER[tier].map((w) => w.emoji);
      expect(new Set(emojis).size).toBe(emojis.length);
    });
  });
});
