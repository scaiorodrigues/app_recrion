/**
 * Envio e agendamento de notificações locais com Expo Notifications.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PUSH_NOTIFICATIONS } from '@/constants/notifications';
import { THEME } from '@/constants/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ANDROID_CHANNEL_ID = 'recrion-default';

/** Expo Notifications não existe no web; o app segue funcionando sem avisos. */
const SUPPORTED = Platform.OS === 'android' || Platform.OS === 'ios';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!SUPPORTED) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Recrion',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: THEME.colors.primary,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

interface NotifyPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Dispara imediatamente.
 * Uma notificação que falha nunca deve derrubar o fluxo da criança ou do pai.
 */
export async function notifyNow({ title, body, data }: NotifyPayload): Promise<void> {
  if (!SUPPORTED) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {} },
      trigger: null,
    });
  } catch {
    // Permissão negada ou canal indisponível: segue sem avisar.
  }
}

export async function notifyActivityCompleted(childName: string, subject: string) {
  const n = PUSH_NOTIFICATIONS.ACTIVITY_COMPLETED;
  await notifyNow({ title: n.title(childName), body: n.body(subject), data: n.data });
}

export async function notifyBehaviorCompleted(childName: string) {
  const n = PUSH_NOTIFICATIONS.BEHAVIOR_COMPLETED;
  await notifyNow({ title: n.title(childName), body: n.body(), data: n.data });
}

export async function notifyActivityApproved(parentName: string) {
  const n = PUSH_NOTIFICATIONS.ACTIVITY_APPROVED;
  await notifyNow({ title: n.title(), body: n.body(parentName), data: n.data });
}

export async function notifyBehaviorApproved() {
  const n = PUSH_NOTIFICATIONS.BEHAVIOR_APPROVED;
  await notifyNow({ title: n.title(), body: n.body(), data: n.data });
}

export async function notifyCrionReady(crionName: string, rarityLabel: string) {
  const n = PUSH_NOTIFICATIONS.CRION_READY;
  await notifyNow({ title: n.title(crionName), body: n.body(rarityLabel), data: n.data });
}

/** Lembrete diário no horário escolhido pelo pai. */
export async function scheduleDailyReminder(
  childName: string,
  hour: number,
  minute: number,
): Promise<string | null> {
  if (!SUPPORTED) return null;

  const n = PUSH_NOTIFICATIONS.DAILY_REMINDER;

  return Notifications.scheduleNotificationAsync({
    content: { title: n.title(), body: n.body(childName), data: n.data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelScheduled(id: string): Promise<void> {
  if (!SUPPORTED) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}
