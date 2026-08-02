/**
 * Catálogo de notificações push. Todos os textos em português.
 */

export const PUSH_NOTIFICATIONS = {
  /** Filho marcou uma atividade acadêmica como concluída. */
  ACTIVITY_COMPLETED: {
    trigger: 'filho_marca_atividade_concluida',
    recipient: 'pai',
    title: (childName: string) => `${childName} concluiu uma atividade! 🎉`,
    body: (subject: string) => `Atividade de ${subject} aguardando sua aprovação.`,
    data: { screen: '/(parent)/dashboard/pending' },
  },

  /** Filho marcou todas as tarefas de comportamento. */
  BEHAVIOR_COMPLETED: {
    trigger: 'filho_marca_todas_tarefas_comportamento',
    recipient: 'pai',
    title: (childName: string) => `${childName} completou todas as tarefas de hoje! ✨`,
    body: () => 'Confirme as tarefas para liberar o Crion de Luz.',
    data: { screen: '/(parent)/behavior/validate' },
  },

  /** Pai aprovou atividade acadêmica. */
  ACTIVITY_APPROVED: {
    trigger: 'pai_aprova_atividade',
    recipient: 'filho',
    title: () => 'Atividade aprovada! 🌟',
    body: (parentName: string) => `${parentName} aprovou sua atividade. Continue assim!`,
    data: { screen: '/(child)/activities' },
  },

  /** Pai aprovou o comportamento do dia. */
  BEHAVIOR_APPROVED: {
    trigger: 'pai_aprova_comportamento',
    recipient: 'filho',
    title: () => 'Tarefas aprovadas! ✨',
    body: () => 'Seu Crion de Luz ficou mais forte hoje!',
    data: { screen: '/(child)/collection' },
  },

  /** Crion do dia gerado, após a última aprovação. */
  CRION_READY: {
    trigger: 'crion_do_dia_gerado',
    recipient: 'filho',
    title: (crionName: string) => `Seu Crion nasceu! Conheça o ${crionName}! 🥚✨`,
    body: (rarity: string) => `Um Crion ${rarity} foi gerado hoje. Toque para revelar!`,
    data: { screen: '/(child)/collection/reveal' },
  },

  /** Lembrete diário — horário e dias configuráveis pelo pai. */
  DAILY_REMINDER: {
    trigger: 'agendado_diariamente',
    recipient: 'filho',
    title: () => 'Hora de estudar! 📚',
    body: (childName: string) => `Vamos ${childName}? Seu Crion de hoje está esperando por você!`,
    data: { screen: '/(child)/activities' },
  },
} as const;

export type NotificationKey = keyof typeof PUSH_NOTIFICATIONS;
