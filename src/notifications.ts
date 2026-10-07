import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AppData, Prefs } from './types';
import { outstanding, money, parseISO, todayISO, isSettled } from './utils';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

export async function ensurePermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', { name: 'Reminders', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Rebuilds every scheduled reminder from the current data. Cheap enough to run after each change. */
export async function rescheduleAll(data: AppData, prefs: Prefs) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!(await ensurePermission())) return;
    if (prefs.dailyReminder) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Log today’s expenses', body: 'Take a minute to add what you spent today.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0, channelId: 'reminders' },
      });
    }
    if (!prefs.dueReminders) return;
    const items = [
      ...data.borrowed.filter(r => !isSettled('borrowed', r)).map(r => ({ r, text: `You owe ${r.person} ${money(outstanding(r))}. Payment is due today.` })),
      ...data.lent.filter(r => !isSettled('lent', r)).map(r => ({ r, text: `${r.person} should return ${money(outstanding(r))} today.` })),
    ].filter(x => x.r.dueDate && x.r.dueDate >= todayISO()).sort((a, b) => a.r.dueDate.localeCompare(b.r.dueDate)).slice(0, 50);
    for (const { r, text } of items) {
      const when = parseISO(r.dueDate); when.setHours(9, 0, 0, 0);
      if (when.getTime() <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Payment reminder', body: text },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: 'reminders' },
      });
    }
  } catch (e) { console.warn('Reminder scheduling failed', e); }
}
