import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { radii, spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';
import { supabase } from '@/lib/supabase';

type Ride = {
  id: string;
  driver_id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  seats: number;
  note: string | null;
};

export default function Rides() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, typography } = useTheme();
  const [rides, setRides] = useState<Ride[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth.user?.id ?? null);
    const { data } = await supabase
      .from('rides')
      .select('id, driver_id, origin_name, destination_name, departure_time, seats, note')
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });
    setRides((data as Ride[]) ?? []);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const remove = async (id: string) => {
    await supabase.from('rides').delete().eq('id', id);
    load();
  };

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
      <FlatList
        data={rides}
        keyExtractor={(ride) => ride.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[typography.title, styles.title]}>{t('rides.title')}</Text>
            <Button label={t('rides.offer')} onPress={() => router.push('/offer')} />
          </View>
        }
        ListEmptyComponent={
          <Text style={[typography.caption, styles.empty]}>{t('rides.empty')}</Text>
        }
        renderItem={({ item }) => (
          <View
            style={[styles.card, { backgroundColor: colors.input, borderColor: colors.border }]}
          >
            <Text style={typography.body}>
              {item.origin_name} → {item.destination_name}
            </Text>
            <Text style={typography.caption}>
              {formatTime(item.departure_time)} · {t('rides.seatsLeft', { count: item.seats })}
            </Text>
            {item.note ? <Text style={typography.caption}>{item.note}</Text> : null}
            {item.driver_id === userId ? (
              <Pressable onPress={() => remove(item.id)} style={styles.delete}>
                <Text style={[typography.caption, { color: colors.text }]}>
                  {t('rides.delete')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.sm },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  title: { marginTop: spacing.md },
  empty: { textAlign: 'center', marginTop: spacing.lg },
  card: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  delete: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
});