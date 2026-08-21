import type { DailyActivity, DailyDutyRecord, Duty } from '@/types';
import {
  calculatePierMetrics,
  concentrationIndicator,
  firstTryIndicator,
  organizationIndicator,
  readIndicator,
  repetitionIndicator,
  sameDayIndicator,
  studyStreaks,
} from '@/utils/pier';

/** TIER_2 recomenda 8 a 12 minutos por atividade. */
const TIER = 'TIER_2' as const;

function activity(over: Partial<DailyActivity> = {}): DailyActivity {
  return {
    id: `act_${Math.random()}`,
    childId: 'c1',
    date: '2026-08-02',
    subject: 'portugues',
    tier: TIER,
    status: 'APPROVED',
    score: 100,
    ...over,
  };
}

function duty(id: string, category: Duty['category'] = 'STUDY'): Duty {
  return {
    id,
    childId: 'c1',
    category,
    label: `Tarefa ${id}`,
    emoji: '📚',
    isCustom: false,
    activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function record(dutyId: string, status: DailyDutyRecord['status']): DailyDutyRecord {
  return {
    id: `rec_${dutyId}`,
    dutyId,
    childId: 'c1',
    date: '2026-08-02',
    markedDoneByChild: status === 'APPROVED',
    status,
  };
}

describe('concentração', () => {
  it('conta as atividades feitas dentro do tempo recomendado', () => {
    const result = concentrationIndicator(
      [
        activity({ durationSeconds: 10 * 60 }), // dentro de 8–12 min
        activity({ durationSeconds: 60 }), // rápido demais: chutou
        activity({ durationSeconds: 60 * 60 }), // devagar demais: dispersou
      ],
      TIER,
    );

    expect(result.count).toBe(1);
    expect(result.total).toBe(3);
    expect(result.score).toBe(33);
  });

  it('dá uma folga acima do teto para quem capricha', () => {
    // Teto é 12 min; a folga vai até 18 min.
    const result = concentrationIndicator([activity({ durationSeconds: 17 * 60 })], TIER);
    expect(result.count).toBe(1);
  });

  it('ignora atividades ainda não validadas', () => {
    const result = concentrationIndicator(
      [activity({ status: 'PENDING_VALIDATION', durationSeconds: 600 })],
      TIER,
    );
    expect(result.total).toBe(0);
    expect(result.score).toBe(0);
  });
});

describe('repetição', () => {
  it('mede dias com estudo, não quantidade de atividades', () => {
    const dates = ['2026-08-03', '2026-08-02', '2026-08-01', '2026-07-31'];

    // Três atividades, mas todas no mesmo dia: constância de 1 dia em 4.
    const result = repetitionIndicator(
      [
        activity({ date: '2026-08-02' }),
        activity({ date: '2026-08-02' }),
        activity({ date: '2026-08-02' }),
      ],
      dates,
    );

    expect(result.count).toBe(1);
    expect(result.total).toBe(4);
    expect(result.score).toBe(25);
  });

  it('quem estuda todo dia pontua o máximo', () => {
    const dates = ['2026-08-03', '2026-08-02', '2026-08-01'];
    const result = repetitionIndicator(dates.map((date) => activity({ date })), dates);
    expect(result.score).toBe(100);
  });
});

describe('organização', () => {
  it('usa só as obrigações da categoria Estudo', () => {
    const duties = [duty('d1'), duty('d2'), duty('d3', 'HYGIENE')];
    const records = [
      record('d1', 'APPROVED'),
      record('d2', 'REJECTED'),
      record('d3', 'APPROVED'), // higiene não entra
    ];

    const result = organizationIndicator(duties, records);
    expect(result.count).toBe(1);
    expect(result.total).toBe(2);
  });

  it('ignora o que o responsável marcou como não aplicável', () => {
    const duties = [duty('d1'), duty('d2')];
    const records = [record('d1', 'APPROVED'), record('d2', 'SKIPPED')];

    const result = organizationIndicator(duties, records);
    expect(result.total).toBe(1);
    expect(result.score).toBe(100);
  });
});

describe('aula dada, aula estudada hoje', () => {
  it('conta a atividade concluída no próprio dia', () => {
    const result = sameDayIndicator([
      activity({ date: '2026-08-02', completedAt: new Date(2026, 7, 2, 16).toISOString() }),
    ]);
    expect(result.score).toBe(100);
  });

  it('não conta a atividade que ficou para o dia seguinte', () => {
    const result = sameDayIndicator([
      activity({ date: '2026-08-02', completedAt: new Date(2026, 7, 3, 10).toISOString() }),
    ]);
    expect(result.score).toBe(0);
  });
});

describe('acerto de primeira', () => {
  it('conta só o que passou sem refazer', () => {
    const result = firstTryIndicator([
      activity({ redoCount: 0 }),
      activity({ redoCount: 2 }),
    ]);
    expect(result.count).toBe(1);
    expect(result.total).toBe(2);
  });

  it('aprovação parcial não conta como acerto de primeira', () => {
    const result = firstTryIndicator([activity({ status: 'PARTIALLY_APPROVED', redoCount: 0 })]);
    expect(result.count).toBe(0);
  });
});

describe('sequências de estudo', () => {
  const dates = ['2026-08-05', '2026-08-04', '2026-08-03', '2026-08-02', '2026-08-01'];

  it('conta a sequência atual a partir do dia mais recente', () => {
    const result = studyStreaks(
      [activity({ date: '2026-08-05' }), activity({ date: '2026-08-04' })],
      dates,
    );
    expect(result.current).toBe(2);
  });

  it('zera a sequência atual quando faltou hoje', () => {
    const result = studyStreaks([activity({ date: '2026-08-04' })], dates);
    expect(result.current).toBe(0);
  });

  it('guarda a maior sequência do período', () => {
    const result = studyStreaks(
      [
        activity({ date: '2026-08-03' }),
        activity({ date: '2026-08-02' }),
        activity({ date: '2026-08-01' }),
      ],
      dates,
    );
    expect(result.current).toBe(0);
    expect(result.longest).toBe(3);
  });
});

describe('calculatePierMetrics', () => {
  const dates = ['2026-08-02', '2026-08-01'];

  it('monta o painel completo', () => {
    const metrics = calculatePierMetrics({
      activities: [
        activity({
          date: '2026-08-02',
          durationSeconds: 10 * 60,
          completedAt: new Date(2026, 7, 2, 16).toISOString(),
          redoCount: 0,
        }),
      ],
      duties: [duty('d1')],
      dutyRecords: [record('d1', 'APPROVED')],
      tier: TIER,
      datesDesc: dates,
    });

    expect(metrics.concentration.score).toBe(100);
    expect(metrics.repetition.score).toBe(50); // 1 dia de 2
    expect(metrics.organization.score).toBe(100);
    expect(metrics.sameDay.score).toBe(100);
    expect(metrics.firstTry.score).toBe(100);
    expect(metrics.currentStreak).toBe(1);
    expect(metrics.overall).toBe(90); // média dos cinco
  });

  it('não quebra sem nenhum dado', () => {
    const metrics = calculatePierMetrics({
      activities: [],
      duties: [],
      dutyRecords: [],
      tier: TIER,
      datesDesc: dates,
    });

    expect(metrics.overall).toBe(0);
    expect(metrics.currentStreak).toBe(0);
  });
});

describe('readIndicator', () => {
  it.each([
    [95, 'Excelente'],
    [75, 'Bom'],
    [55, 'Em construção'],
    [20, 'Precisa de atenção'],
    [0, 'Sem dados ainda'],
  ])('nota %i lê como "%s"', (score, label) => {
    expect(readIndicator(score).label).toBe(label);
  });
});
