import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { radii, spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';
import {
  fetchChatRides,
  fetchLastMessages,
  type ChatRide,
  type Message,
} from '@/lib/chat';
import { fetchNames } from '@/lib/names';
import { fetchRequests } from '@/lib/requests';
import { supabase } from '@/lib/supabase';

export default function Messages() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, typography } = useTheme();
  const [rides, setRides] = useState<ChatRide[]>([]);
  const [last, setLast] = useState<Record<string, Message>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);

    if (uid) {
      const accepted = (await fetchRequests()).filter((q) => q.status === 'accepted');
      const ids = Array.from(new Set(accepted.map((q) => q.ride_id)));
      const list = await fetchChatRides(uid, ids);
      const lastMessages = await fetchLastMessages(list.map((r) => r.id));

      setRides(list);
      setLast(lastMessages);
      setNames(await fetchNames(Object.values(lastMessages).map((m) => m.sender_id)));
    }
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.title, styles.title]}>{t('tabs.messages')}</Text>

        {rides.length === 0 ? (
          <Text style={[typography.caption, styles.empty]}>{t('chat.noChats')}</Text>
        ) : null}

        {rides.map((ride) => {
          const m = last[ride.id];
          const who = m ? (m.sender_id === userId ? t('chat.you') : (names[m.sender_id] ?? t('chat.someone'))) : '';
          return (
            <Pressable
              key={ride.id}
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: ride.id } })}
              style={[styles.card, { backgroundColor: colors.input, borderColor: colors.border }]}
            >
              <Text style={typography.body}>
                {ride.origin_name} → {ride.destination_name}
              </Text>
              <Text style={typography.caption}>{formatTime(ride.departure_time)}</Text>
              <Text style={typography.caption} numberOfLines={1}>
                {m ? `${who}: ${m.body}` : t('chat.empty')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  title: { marginTop: spacing.md },
  empty: { textAlign: 'center', marginTop: spacing.lg },
  card: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
});