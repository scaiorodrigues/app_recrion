/**
 * Estado global do app: perfis, atividades, comportamento e coleção.
 *
 * Sem Firebase configurado o store funciona como fonte de verdade local,
 * o que mantém todas as telas navegáveis em modo demonstração.
 */

import { useMemo } from 'react';
import { create } from 'zustand';

import type {
  AcademicSubject,
  ActivityStatus,
  ChildProfile,
  CrionCardData,
  DailyActivity,
  DailyDutyRecord,
  Duty,
  InviteCode,
  ParentProfile,
  SubscriptionState,
  UserRole,
} from '@/types';
import {
  generateInviteCode,
  inviteExpiryDate,
  tierFromBirthDate,
  today,
} from '@/utils/profile';
import { startTrial } from '@/utils/subscription';

interface AppState {
  role: UserRole | null;
  parent: ParentProfile | null;
  children: ChildProfile[];
  /** Criança em foco: o filho logado, ou o filho selecionado pelo pai. */
  activeChildId: string | null;
  invites: InviteCode[];
  activities: DailyActivity[];
  duties: Duty[];
  dutyRecords: DailyDutyRecord[];
  cards: CrionCardData[];
  subscription: SubscriptionState;

  setRole: (role: UserRole | null) => void;
  setParent: (parent: ParentProfile | null) => void;
  setActiveChild: (childId: string | null) => void;

  addChild: (input: { name: string; birthDate: string; avatarEmoji: string }) => ChildProfile;
  removeChild: (childId: string) => void;
  createInvite: (childId: string) => InviteCode;
  redeemInvite: (code: string, uid: string) => { ok: true; child: ChildProfile } | { ok: false; reason: string };

  upsertActivity: (activity: DailyActivity) => void;
  setActivityStatus: (activityId: string, status: ActivityStatus, validatedScore?: number) => void;

  setDuties: (childId: string, duties: Duty[]) => void;
  toggleDutyDone: (childId: string, dutyId: string, date: string) => void;
  setDutyStatus: (childId: string, dutyId: string, date: string, status: DailyDutyRecord['status'], note?: string) => void;

  addCard: (card: CrionCardData) => void;
  markCardRevealed: (cardId: string) => void;

  setSubscription: (subscription: SubscriptionState) => void;
  reset: () => void;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const INITIAL_SUBSCRIPTION: SubscriptionState = {
  tier: 'free',
  activeSubjects: [] as AcademicSubject[],
};

export const useAppStore = create<AppState>((set, get) => ({
  role: null,
  parent: null,
  children: [],
  activeChildId: null,
  invites: [],
  activities: [],
  duties: [],
  dutyRecords: [],
  cards: [],
  subscription: INITIAL_SUBSCRIPTION,

  setRole: (role) => set({ role }),
  setParent: (parent) => set({ parent }),
  setActiveChild: (activeChildId) => set({ activeChildId }),

  addChild: ({ name, birthDate, avatarEmoji }) => {
    const child: ChildProfile = {
      id: makeId('child'),
      parentId: get().parent?.uid ?? 'local',
      name,
      birthDate,
      tier: tierFromBirthDate(birthDate),
      avatarEmoji,
      createdAt: new Date().toISOString(),
    };

    // O teste gratuito de 3 dias começa a contar no primeiro filho cadastrado.
    set((state) => ({
      children: [...state.children, child],
      activeChildId: state.activeChildId ?? child.id,
      parent: state.parent
        ? { ...state.parent, childIds: [...state.parent.childIds, child.id] }
        : state.parent,
      subscription: startTrial(state.subscription),
    }));

    return child;
  },

  removeChild: (childId) =>
    set((state) => ({
      children: state.children.filter((c) => c.id !== childId),
      activeChildId: state.activeChildId === childId ? null : state.activeChildId,
      invites: state.invites.filter((i) => i.childProfileId !== childId),
    })),

  createInvite: (childId) => {
    const invite: InviteCode = {
      code: generateInviteCode(),
      childProfileId: childId,
      parentId: get().parent?.uid ?? 'local',
      expiresAt: inviteExpiryDate(),
    };

    // Um convite ativo por filho: gerar um novo invalida o anterior.
    set((state) => ({
      invites: [...state.invites.filter((i) => i.childProfileId !== childId), invite],
    }));

    return invite;
  },

  redeemInvite: (code, uid) => {
    const normalized = code.trim().toUpperCase();
    const invite = get().invites.find((i) => i.code === normalized);

    if (!invite) return { ok: false, reason: 'Código não encontrado. Confira com o papai ou a mamãe.' };
    if (invite.usedAt) return { ok: false, reason: 'Este código já foi usado.' };
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      return { ok: false, reason: 'Este código expirou. Peça um novo.' };
    }

    const child = get().children.find((c) => c.id === invite.childProfileId);
    if (!child) return { ok: false, reason: 'Perfil não encontrado.' };

    const linked = { ...child, linkedUid: uid };

    set((state) => ({
      children: state.children.map((c) => (c.id === child.id ? linked : c)),
      invites: state.invites.map((i) =>
        i.code === normalized ? { ...i, usedAt: new Date().toISOString(), usedByUid: uid } : i,
      ),
      activeChildId: child.id,
    }));

    return { ok: true, child: linked };
  },

  upsertActivity: (activity) =>
    set((state) => {
      const exists = state.activities.some((a) => a.id === activity.id);
      return {
        activities: exists
          ? state.activities.map((a) => (a.id === activity.id ? activity : a))
          : [...state.activities, activity],
      };
    }),

  setActivityStatus: (activityId, status, validatedScore) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              status,
              ...(validatedScore !== undefined ? { validatedScore } : {}),
              ...(status === 'PENDING_VALIDATION' ? { completedAt: new Date().toISOString() } : {}),
              ...(status === 'APPROVED' || status === 'PARTIALLY_APPROVED'
                ? { validatedAt: new Date().toISOString() }
                : {}),
            }
          : a,
      ),
    })),

  setDuties: (childId, duties) =>
    set((state) => ({
      duties: [...state.duties.filter((d) => d.childId !== childId), ...duties],
    })),

  toggleDutyDone: (childId, dutyId, date) =>
    set((state) => {
      const existing = state.dutyRecords.find(
        (r) => r.dutyId === dutyId && r.childId === childId && r.date === date,
      );

      if (existing) {
        const nowDone = !existing.markedDoneByChild;
        return {
          dutyRecords: state.dutyRecords.map((r) =>
            r === existing
              ? {
                  ...r,
                  markedDoneByChild: nowDone,
                  markedDoneAt: nowDone ? new Date().toISOString() : undefined,
                }
              : r,
          ),
        };
      }

      const record: DailyDutyRecord = {
        id: makeId('rec'),
        dutyId,
        childId,
        date,
        markedDoneByChild: true,
        markedDoneAt: new Date().toISOString(),
        status: 'PENDING',
      };
      return { dutyRecords: [...state.dutyRecords, record] };
    }),

  setDutyStatus: (childId, dutyId, date, status, note) =>
    set((state) => {
      const existing = state.dutyRecords.find(
        (r) => r.dutyId === dutyId && r.childId === childId && r.date === date,
      );

      const patch = {
        status,
        validatedByParentAt: new Date().toISOString(),
        ...(note !== undefined ? { parentNote: note } : {}),
      };

      if (existing) {
        return {
          dutyRecords: state.dutyRecords.map((r) => (r === existing ? { ...r, ...patch } : r)),
        };
      }

      // O pai pode validar mesmo que a criança tenha esquecido de marcar.
      const record: DailyDutyRecord = {
        id: makeId('rec'),
        dutyId,
        childId,
        date,
        markedDoneByChild: status === 'APPROVED',
        ...patch,
      };
      return { dutyRecords: [...state.dutyRecords, record] };
    }),

  addCard: (card) =>
    set((state) => ({
      cards: state.cards.some((c) => c.id === card.id)
        ? state.cards.map((c) => (c.id === card.id ? card : c))
        : [...state.cards, card],
    })),

  markCardRevealed: (cardId) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, revealedAt: new Date().toISOString() } : c,
      ),
    })),

  setSubscription: (subscription) => set({ subscription }),

  reset: () =>
    set({
      role: null,
      parent: null,
      children: [],
      activeChildId: null,
      invites: [],
      activities: [],
      duties: [],
      dutyRecords: [],
      cards: [],
      subscription: INITIAL_SUBSCRIPTION,
    }),
}));

// ---------------------------------------------------------------------------
// Seletores
// ---------------------------------------------------------------------------

// Filtrar dentro do seletor devolveria um array novo a cada render e o Zustand
// entraria em laço infinito. Por isso o seletor pega o array cru e o recorte
// acontece em useMemo.

export function useActiveChild(): ChildProfile | null {
  const children = useAppStore((s) => s.children);
  const activeChildId = useAppStore((s) => s.activeChildId);

  return useMemo(
    () => children.find((c) => c.id === activeChildId) ?? null,
    [children, activeChildId],
  );
}

export function useTodayActivities(childId: string | null): DailyActivity[] {
  const activities = useAppStore((s) => s.activities);
  const date = today();

  return useMemo(
    () => (childId ? activities.filter((a) => a.childId === childId && a.date === date) : []),
    [activities, childId, date],
  );
}

export function useChildDuties(childId: string | null): Duty[] {
  const duties = useAppStore((s) => s.duties);

  return useMemo(
    () => (childId ? duties.filter((d) => d.childId === childId) : []),
    [duties, childId],
  );
}

export function useDutyRecords(childId: string | null, date: string): DailyDutyRecord[] {
  const records = useAppStore((s) => s.dutyRecords);

  return useMemo(
    () => (childId ? records.filter((r) => r.childId === childId && r.date === date) : []),
    [records, childId, date],
  );
}
