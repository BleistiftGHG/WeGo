import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/context/SettingsContext';
import { registerPush, setPushEnabled } from '@/lib/push';

export function usePushNotifications() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { settings } = useSettings();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';

  useEffect(() => {
    if (settings.notifications) {
      registerPush(lang);
    } else {
      setPushEnabled(false);
    }
  }, [settings.notifications, lang]);

  useEffect(() => {
    const open = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };

    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) open(last.notification);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
      open(response.notification),
    );
    return () => subscription.remove();
  }, []);
}