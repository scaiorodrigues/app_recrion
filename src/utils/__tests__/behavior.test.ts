import { LIGHT_ALL_DONE_BONUS, LIGHT_BONUS_XP } from '@/constants/game';
import type { DailyDutyRecord, Duty } from '@/types';
import {
  calculateBehaviorStreak,
  canSubmitToParent,
  dayOfWeekFor,
  dutiesForDate,
  summarizeBehaviorDay,
} from '@/utils/behavior';

// 2026-08-03 é uma segunda-feira.
const MONDAY = '2026-08-03';
const SATURDAY = '2026-08-01';

function duty(id: string, activeDays: Duty['activeDays'], isActive = true): Duty {
  return {
    id,
    childId: 'c1',
    category: 'HOME',
    label: `Tarefa ${id}`,
    emoji: '🏠',
    isCustom: false,
    activeDays,
    isActive,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function record(dutyId: string, over: Partial<DailyDutyRecord> = {}): DailyDutyRecord {
  return {
    id: `rec_${dutyId}`,
    dutyId,
    childId: 'c1',
    date: MONDAY,
    markedDoneByChild: false,
    status: 'PENDING',
    ...over,
  };
}

describe('dayOfWeekFor', () => {
  it('identifica o dia da semana', () => {
    expect(dayOfWeekFor(MONDAY)).toBe('MON');
    expect(dayOfWeekFor(SATURDAY)).toBe('SAT');
  });
});

describe('dutiesForDate', () => {
  it('mostra só as tarefas válidas para o dia', () => {
    const duties = [duty('d1', ['MON']), duty('d2', ['SAT'])];
    expect(dutiesForDate(duties, MONDAY).map((d) => d.id)).toEqual(['d1']);
  });

  it('esconde tarefas desativadas', () => {
    const duties = [duty('d1', ['MON'], false)];
    expect(dutiesForDate(duties, MONDAY)).toHaveLength(0);
  });
});

describe('summarizeBehaviorDay', () => {
  it('ativa a Luz só quando tudo foi aprovado', () => {
    const duties = [duty('d1', ['MON']), duty('d2', ['MON'])];
    const records = [
      record('d1', { markedDoneByChild: true, status: 'APPROVED' }),
      record('d2', { markedDoneByChild: true, status: 'APPROVED' }),
    ];

    const summary = summarizeBehaviorDay('c1', MONDAY, duties, records);
    expect(summary.allApproved).toBe(true);
    expect(summary.lightBonusXP).toBe(LIGHT_BONUS_XP + LIGHT_ALL_DONE_BONUS);
  });

  it('não dá XP de Luz com uma tarefa pendente', () => {
    const duties = [duty('d1', ['MON']), duty('d2', ['MON'])];
    const records = [record('d1', { markedDoneByChild: true, status: 'APPROVED' })];

    const summary = summarizeBehaviorDay('c1', MONDAY, duties, records);
    expect(summary.allApproved).toBe(false);
    expect(summary.lightBonusXP).toBe(0);
  });

  it('SKIPPED não penaliza nem conta como obrigação', () => {
    const duties = [duty('d1', ['MON']), duty('d2', ['MON'])];
    const records = [
      record('d1', { markedDoneByChild: true, status: 'APPROVED' }),
      record('d2', { status: 'SKIPPED' }),
    ];

    const summary = summarizeBehaviorDay('c1', MONDAY, duties, records);
    expect(summary.totalDuties).toBe(1);
    expect(summary.allApproved).toBe(true);
  });

  it('aplica o multiplicador de Luz do pacote completo', () => {
    const duties = [duty('d1', ['MON'])];
    const records = [record('d1', { markedDoneByChild: true, status: 'APPROVED' })];

    const summary = summarizeBehaviorDay('c1', MONDAY, duties, records, 1.3);
    expect(summary.lightBonusXP).toBe(Math.round((LIGHT_BONUS_XP + LIGHT_ALL_DONE_BONUS) * 1.3));
  });

  it('um dia sem tarefas não conta como aprovado', () => {
    const summary = summarizeBehaviorDay('c1', MONDAY, [], []);
    expect(summary.allApproved).toBe(false);
    expect(summary.lightBonusXP).toBe(0);
  });
});

describe('canSubmitToParent', () => {
  it('libera o envio quando a criança marcou tudo', () => {
    const duties = [duty('d1', ['MON']), duty('d2', ['MON'])];
    const records = [
      record('d1', { markedDoneByChild: true }),
      record('d2', { markedDoneByChild: true }),
    ];
    expect(canSubmitToParent(duties, records, MONDAY)).toBe(true);
  });

  it('bloqueia com tarefa faltando', () => {
    const duties = [duty('d1', ['MON']), duty('d2', ['MON'])];
    const records = [record('d1', { markedDoneByChild: true })];
    expect(canSubmitToParent(duties, records, MONDAY)).toBe(false);
  });

  it('bloqueia quando não há tarefa nenhuma no dia', () => {
    expect(canSubmitToParent([], [], MONDAY)).toBe(false);
  });
});

describe('calculateBehaviorStreak', () => {
  it('conta dias seguidos a partir do mais recente', () => {
    const summaries = [
      { childId: 'c1', date: '2026-08-01', totalDuties: 1, completedByChild: 1, approvedByParent: 1, allApproved: true, lightBonusXP: 60 },
      { childId: 'c1', date: '2026-08-02', totalDuties: 1, completedByChild: 1, approvedByParent: 1, allApproved: true, lightBonusXP: 60 },
      { childId: 'c1', date: '2026-08-03', totalDuties: 1, completedByChild: 1, approvedByParent: 1, allApproved: true, lightBonusXP: 60 },
    ];
    expect(calculateBehaviorStreak(summaries)).toBe(3);
  });

  it('zera quando o dia mais recente falhou', () => {
    const summaries = [
      { childId: 'c1', date: '2026-08-01', totalDuties: 1, completedByChild: 1, approvedByParent: 1, allApproved: true, lightBonusXP: 60 },
      { childId: 'c1', date: '2026-08-02', totalDuties: 1, completedByChild: 0, approvedByParent: 0, allApproved: false, lightBonusXP: 0 },
    ];
    expect(calculateBehaviorStreak(summaries)).toBe(0);
  });
});
