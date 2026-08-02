/**
 * Validação das tarefas do dia: aprovar tudo de uma vez ou item por item.
 */

import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { BEHAVIOR_CATEGORIES } from '@/constants/game';
import { THEME } from '@/constants/theme';
import { notifyBehaviorApproved } from '@/services/notifications';
import { useAppStore } from '@/stores/useAppStore';
import { dutiesForDate, summarizeBehaviorDay } from '@/utils/behavior';
import { today } from '@/utils/profile';
import type { DutyStatus } from '@/types';

const STATUS_STYLE: Record<DutyStatus, { emoji: string; label: string; color: string }> = {
  PENDING: { emoji: '⏳', label: 'Aguardando', color: THEME.colors.textLight },
  APPROVED: { emoji: '✅', label: 'Aprovado', color: THEME.colors.success },
  REJECTED: { emoji: '❌', label: 'Não feito', color: THEME.colors.danger },
  SKIPPED: { emoji: '➖', label: 'Não vale hoje', color: THEME.colors.textLight },
};

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ValidateBehavior() {
  const child = useAppStore((s) => s.children.find((c) => c.id === s.activeChildId));
  const allDuties = useAppStore((s) => s.duties);
  const allRecords = useAppStore((s) => s.dutyRecords);
  const setDutyStatus = useAppStore((s) => s.setDutyStatus);

  const date = today();

  const duties = useMemo(
    () => (child ? dutiesForDate(allDuties.filter((d) => d.childId === child.id), date) : []),
    [allDuties, child, date],
  );

  const records = useMemo(
    () => allRecords.filter((r) => r.childId === child?.id && r.date === date),
    [allRecords, child?.id, date],
  );

  const summary = child
    ? summarizeBehaviorDay(child.id, date, allDuties.filter((d) => d.childId === child.id), records)
    : null;

  if (!child) {
    return (
      <Screen>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>Selecione um filho primeiro.</Text>
        <View style={{ marginTop: 16 }}>
          <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  function approveAll() {
    duties.forEach((duty) => setDutyStatus(child!.id, duty.id, date, 'APPROVED'));
    void notifyBehaviorApproved();
  }

  return (
    <Screen>
      <Text style={{ fontSize: 25, fontWeight: '900', color: THEME.colors.primary }}>
        Validar tarefas
      </Text>
      <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '600', marginTop: 2 }}>
        {child.name} • hoje
      </Text>

      {duties.length === 0 ? (
        <View style={{ marginTop: 28, gap: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: THEME.colors.text }}>
            Nenhuma tarefa configurada para hoje.
          </Text>
          <Button
            label="Configurar tarefas"
            icon="⚙️"
            onPress={() => router.push('/(parent)/behavior/config')}
          />
        </View>
      ) : (
        <>
          {summary && (
            <View
              style={{
                marginTop: 18,
                padding: 15,
                borderRadius: THEME.borderRadius.card,
                backgroundColor: summary.allApproved ? '#DCFCE7' : '#FFFFFF',
                borderWidth: 2,
                borderColor: summary.allApproved ? THEME.colors.success : THEME.colors.border,
                gap: 3,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '900', color: THEME.colors.text }}>
                {summary.approvedByParent} de {summary.totalDuties} aprovadas
              </Text>
              <Text style={{ fontSize: 13, color: THEME.colors.textLight, fontWeight: '600' }}>
                {summary.allApproved
                  ? `Luz ativada! +${summary.lightBonusXP} XP no Crion de hoje ✨`
                  : 'Aprove todas para liberar o Crion de Luz.'}
              </Text>
            </View>
          )}

          <View style={{ marginTop: 18 }}>
            <Button label="Aprovar tudo" icon="✅" size="lg" fullWidth onPress={approveAll} />
          </View>

          <View style={{ marginTop: 20, gap: 10 }}>
            {duties.map((duty) => {
              const record = records.find((r) => r.dutyId === duty.id);
              const status: DutyStatus = record?.status ?? 'PENDING';
              const category = BEHAVIOR_CATEGORIES[duty.category];
              const statusStyle = STATUS_STYLE[status];

              return (
                <View
                  key={duty.id}
                  style={{
                    backgroundColor: THEME.colors.card,
                    borderRadius: THEME.borderRadius.card,
                    padding: 14,
                    borderWidth: 2,
                    borderColor: status === 'APPROVED' ? THEME.colors.success : THEME.colors.border,
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 26 }}>{duty.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.colors.text }}>
                        {duty.label}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: category.color }}>
                        {category.label}
                        {record?.markedDoneByChild && record.markedDoneAt
                          ? ` • marcada às ${formatTime(record.markedDoneAt)}`
                          : ' • ainda não marcada'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: statusStyle.color }}>
                      {statusStyle.emoji} {statusStyle.label}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
                    {(['APPROVED', 'REJECTED', 'SKIPPED'] as DutyStatus[]).map((option) => (
                      <Pressable
                        key={option}
                        onPress={() => setDutyStatus(child.id, duty.id, date, option)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: status === option }}
                        accessibilityLabel={`${duty.label}: ${STATUS_STYLE[option].label}`}
                        style={{
                          paddingVertical: 7,
                          paddingHorizontal: 12,
                          borderRadius: 999,
                          backgroundColor: status === option ? STATUS_STYLE[option].color : '#FFFFFF',
                          borderWidth: 2,
                          borderColor: status === option ? STATUS_STYLE[option].color : THEME.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '800',
                            color: status === option ? '#FFFFFF' : THEME.colors.text,
                          }}
                        >
                          {STATUS_STYLE[option].emoji} {STATUS_STYLE[option].label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      <View style={{ marginTop: 24 }}>
        <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
