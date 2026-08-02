/**
 * Painel do responsável: filhos, pendências de validação e progresso do dia.
 */

import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import { SUBJECT_ELEMENT_MAP } from '@/constants/game';
import { THEME, TIER_INFO } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { notifyActivityApproved } from '@/services/notifications';
import { today } from '@/utils/profile';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: THEME.colors.card,
        borderRadius: THEME.borderRadius.card,
        padding: 16,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        gap: 10,
      }}
    >
      {children}
    </View>
  );
}

export default function ParentDashboard() {
  const parent = useAppStore((s) => s.parent);
  const children = useAppStore((s) => s.children);
  const activities = useAppStore((s) => s.activities);
  const setActivityStatus = useAppStore((s) => s.setActivityStatus);
  const setActiveChild = useAppStore((s) => s.setActiveChild);

  const date = today();
  const pending = activities.filter((a) => a.status === 'PENDING_VALIDATION');

  function approve(activityId: string, score: number, partial: boolean) {
    setActivityStatus(
      activityId,
      partial ? 'PARTIALLY_APPROVED' : 'APPROVED',
      partial ? Math.round(score * 0.5) : score,
    );
    void notifyActivityApproved(parent?.name ?? 'Seu responsável');
  }

  return (
    <Screen>
      <Text style={{ fontSize: 27, fontWeight: '900', color: THEME.colors.primary }}>
        Olá, {parent?.name ?? 'Responsável'}!
      </Text>
      <Text style={{ fontSize: 14, color: THEME.colors.textLight, fontWeight: '600', marginTop: 2 }}>
        Acompanhe o dia dos seus filhos.
      </Text>

      {/* Pendências de validação */}
      <Text style={styles.section}>
        Aguardando sua aprovação {pending.length > 0 && `(${pending.length})`}
      </Text>

      {pending.length === 0 ? (
        <Card>
          <Text style={{ fontSize: 15, fontWeight: '700', color: THEME.colors.text }}>
            Tudo em dia! 🎉
          </Text>
          <Text style={{ fontSize: 13, color: THEME.colors.textLight }}>
            Nenhuma atividade esperando validação agora.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {pending.map((activity) => {
            const child = children.find((c) => c.id === activity.childId);
            const subject = SUBJECT_ELEMENT_MAP[activity.subject];

            return (
              <Card key={activity.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 24 }}>{subject.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.colors.text }}>
                      {child?.name ?? 'Criança'} • {subject.subjectLabel}
                    </Text>
                    <Text style={{ fontSize: 13, color: THEME.colors.textLight, fontWeight: '600' }}>
                      Acertou {activity.score}% da atividade
                      {activity.durationSeconds
                        ? ` • ${Math.round(activity.durationSeconds / 60)} min`
                        : ''}
                    </Text>
                    {(activity.redoCount ?? 0) > 0 && (
                      <Text style={{ fontSize: 12, color: THEME.colors.secondary, fontWeight: '800' }}>
                        🔄 Refeita {activity.redoCount}{' '}
                        {activity.redoCount === 1 ? 'vez' : 'vezes'}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Button
                    label="Aprovar"
                    icon="✅"
                    size="sm"
                    onPress={() => approve(activity.id, activity.score, false)}
                  />
                  <Button
                    label="Aprovar em parte"
                    size="sm"
                    variant="secondary"
                    onPress={() => approve(activity.id, activity.score, true)}
                  />
                  <Button
                    label="Refazer"
                    size="sm"
                    variant="danger"
                    onPress={() => setActivityStatus(activity.id, 'PENDING_REDO')}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Métricas do método */}
      {children.length > 0 && (
        <View style={{ marginTop: 22 }}>
          <Button
            label="Ver métricas do Método Prof. Pier"
            icon="📊"
            variant="secondary"
            fullWidth
            onPress={() => router.push('/(parent)/dashboard/metrics')}
          />
        </View>
      )}

      {/* Filhos */}
      <Text style={styles.section}>Seus filhos</Text>

      {children.length === 0 ? (
        <Card>
          <Text style={{ fontSize: 15, fontWeight: '700', color: THEME.colors.text }}>
            Nenhum filho cadastrado ainda
          </Text>
          <Text style={{ fontSize: 13, color: THEME.colors.textLight }}>
            Cadastre uma criança para gerar o código de convite dela.
          </Text>
          <Button
            label="Cadastrar filho"
            icon="➕"
            onPress={() => router.push('/(parent)/children/new')}
          />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {children.map((child) => {
            const tier = TIER_INFO[child.tier];
            const todayActivities = activities.filter(
              (a) => a.childId === child.id && a.date === date,
            );
            const approved = todayActivities.filter(
              (a) => a.status === 'APPROVED' || a.status === 'PARTIALLY_APPROVED',
            ).length;

            return (
              <Pressable
                key={child.id}
                onPress={() => {
                  setActiveChild(child.id);
                  router.push('/(parent)/behavior');
                }}
                accessibilityRole="button"
                accessibilityLabel={`Ver ${child.name}`}
              >
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 38 }}>{child.avatarEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: '900', color: THEME.colors.text }}>
                        {child.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: THEME.colors.textLight, fontWeight: '600' }}>
                        {tier.emoji} {tier.label} • {tier.schoolYear}
                      </Text>
                      <Text style={{ fontSize: 13, color: THEME.colors.primary, fontWeight: '700', marginTop: 2 }}>
                        {approved} de {todayActivities.length} atividades aprovadas hoje
                      </Text>
                    </View>
                    <Text style={{ fontSize: 20, color: THEME.colors.textLight }}>›</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}

          <Button
            label="Cadastrar outro filho"
            icon="➕"
            variant="ghost"
            onPress={() => router.push('/(parent)/children/new')}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = {
  section: {
    fontSize: 17,
    fontWeight: '900' as const,
    color: THEME.colors.text,
    marginTop: 26,
    marginBottom: 10,
  },
};
