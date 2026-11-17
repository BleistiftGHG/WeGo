import { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { MapPin } from '@/components/MapPin';
import { darkMapStyle } from '@/constants/mapStyle';
import { radii, spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/context/SettingsContext';
import { useUserLocation, type Coords } from '@/hooks/useUserLocation';
import { distanceMeters, formatDistance } from '@/lib/nearby';
import { fetchNames } from '@/lib/names';
import { cancelRequest, fetchRequests, requestRide, type RideRequest } from '@/lib/requests';
import { supabase } from '@/lib/supabase';

const FALLBACK_ORIGIN: Coords = { latitude: 51.1657, longitude: 10.4515 };
const FALLBACK_DELTA = 8;
const FOCUS_DELTA = 0.02;
const RADIUS_METERS = 30000;

type Ride = {
  id: string;
  driver_id: string;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  origin_town: string | null;
  meeting_point: string | null;
  meeting_lat: number | null;
  meeting_lng: number | null;
  destination_name: string;
  departure_time: string;
  seats: number;
  note: string | null;
};

type NearbyRide = Ride & { distance: number };

function Pill({ label }: { label: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: colors.surface }]}>
      <Text style={[typography.caption, { color: colors.onSurface, fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
}

export default function Matching() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { t, i18n } = useTranslation();
  const { colors, typography, isDark } = useTheme();
  const { settings } = useSettings();
  const { status, coords, enable } = useUserLocation();

  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth.user?.id ?? null);
    const { data } = await supabase
      .from('rides')
      .select(
        'id, driver_id, origin_name, origin_lat, origin_lng, origin_town, meeting_point, meeting_lat, meeting_lng, destination_name, departure_time, seats, note',
      )
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });
    const list = (data as Ride[]) ?? [];
    setRides(list);
    setRequests(await fetchRequests());
    setNames(await fetchNames(list.map((r) => r.driver_id)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const nearby = useMemo<NearbyRide[]>(() => {
    if (!coords) return [];
    return rides
      .map((r) => ({
        ...r,
        distance: distanceMeters(coords, { lat: r.origin_lat, lng: r.origin_lng }),
      }))
      .filter((r) => !(r.origin_lat === 0 && r.origin_lng === 0) && r.distance <= RADIUS_METERS)
      .sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
  }, [rides, coords]);

  const dayLabel = useCallback(
    (iso: string) => {
      const d = new Date(iso);
      const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
      const diff = Math.round((startOf(d) - startOf(new Date())) / 86400000);
      if (diff === 0) return t('matching.today');
      if (diff === 1) return t('matching.tomorrow');
      return d.toLocaleDateString(i18n.language, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    },
    [t, i18n.language],
  );

  const sections = useMemo(() => {
    const groups = new Map<string, NearbyRide[]>();
    for (const ride of nearby) {
      const d = new Date(ride.departure_time);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      groups.set(key, [...(groups.get(key) ?? []), ride]);
    }
    return Array.from(groups.entries()).map(([key, data]) => ({
      key,
      title: dayLabel(data[0].departure_time),
      data,
    }));
  }, [nearby, dayLabel]);

  const myRequestFor = (rideId: string) =>
    requests.find(
      (q) => q.ride_id === rideId && q.passenger_id === userId && q.status !== 'cancelled',
    );

  const toggleRequest = async (ride: Ride) => {
    setBusyId(ride.id);
    setFailed(false);
    const existing = myRequestFor(ride.id);
    const ok =
      existing && (existing.status === 'pending' || existing.status === 'accepted')
        ? await cancelRequest(existing.id)
        : await requestRide(ride.id);
    if (!ok) setFailed(true);
    await load();
    setBusyId(null);
  };

  const select = (ride: NearbyRide) => {
    setSelectedId((prev) => (prev === ride.id ? null : ride.id));
    mapRef.current?.animateToRegion(
      {
        latitude: ride.origin_lat,
        longitude: ride.origin_lng,
        latitudeDelta: FOCUS_DELTA,
        longitudeDelta: FOCUS_DELTA,
      },
      500,
    );
  };

  const fitAll = () => {
    if (!coords) return;
    const points = [
      coords,
      ...nearby.map((r) => ({ latitude: r.origin_lat, longitude: r.origin_lng })),
    ];
    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 120, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  };

  const openMeeting = (r: Ride) => {
    const name = r.meeting_point ?? '';
    const hasPin = r.meeting_lat != null && r.meeting_lng != null;
    const text = encodeURIComponent(`${name}, ${r.origin_town ?? ''}`);
    const url = hasPin
      ? Platform.select({
          ios: `http://maps.apple.com/?ll=${r.meeting_lat},${r.meeting_lng}&q=${encodeURIComponent(name)}`,
          default: `geo:${r.meeting_lat},${r.meeting_lng}?q=${r.meeting_lat},${r.meeting_lng}(${encodeURIComponent(name)})`,
        })
      : Platform.select({
          ios: `http://maps.apple.com/?q=${text}`,
          default: `geo:0,0?q=${text}`,
        });
    if (url) Linking.openURL(url);
  };

  const formatClock = (iso: string) =>
    new Date(iso).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });

  const header = (
    <View style={styles.header}>
      <Text style={typography.title}>{t('matching.title')}</Text>
      <Text style={typography.caption}>{t('matching.subtitle')}</Text>
      {failed ? <Text style={typography.caption}>{t('requests.error')}</Text> : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        customMapStyle={isDark ? darkMapStyle : undefined}
        initialRegion={{
          ...(coords ?? FALLBACK_ORIGIN),
          latitudeDelta: coords ? 0.3 : FALLBACK_DELTA,
          longitudeDelta: coords ? 0.3 : FALLBACK_DELTA,
        }}
        onMapReady={fitAll}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {coords ? (
          <Marker coordinate={coords} anchor={{ x: 0.5, y: 0.5 }}>
            <MapPin size={12} />
          </Marker>
        ) : null}
        {nearby.map((ride) => (
          <Marker
            key={ride.id}
            coordinate={{ latitude: ride.origin_lat, longitude: ride.origin_lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => select(ride)}
          >
            <MapPin size={ride.id === selectedId ? 28 : 18} />
          </Marker>
        ))}
      </MapView>

      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.background, borderColor: colors.divider },
        ]}
      >
        <SectionList
          sections={sections}
          keyExtractor={(ride) => ride.id}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={header}
          ListEmptyComponent={
            status === 'denied' ? (
              <View style={styles.empty}>
                <Text style={[typography.caption, styles.emptyText]}>
                  {t('matching.noLocation')}
                </Text>
                <Button label={t('matching.enableLocation')} onPress={enable} />
              </View>
            ) : (
              <Text style={[typography.caption, styles.emptyText]}>{t('matching.empty')}</Text>
            )
          }
          renderSectionHeader={({ section }) => (
            <Text style={[typography.caption, styles.sectionHeader]}>{section.title}</Text>
          )}
          renderItem={({ item }) => {
            const open = item.id === selectedId;
            const own = item.driver_id === userId;
            const mine = myRequestFor(item.id);
            const active = mine?.status === 'pending' || mine?.status === 'accepted';
            const full = item.seats < 1;
            const driver = names[item.driver_id];

            const badge = own
              ? t('matching.yours')
              : mine?.status === 'accepted'
                ? t('requests.accepted')
                : mine?.status === 'pending'
                  ? t('requests.requested')
                  : null;

            const requestLabel = active ? t('requests.cancel') : t('requests.request');

            return (
              <Pressable
                onPress={() => select(item)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.input,
                    borderColor: open ? colors.text : colors.border,
                    borderWidth: open ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={styles.topRow}>
                  <Text style={typography.heading}>{formatClock(item.departure_time)}</Text>
                  <View style={styles.topRight}>
                    {badge ? <Pill label={badge} /> : null}
                    <Text style={typography.caption}>
                      {full ? t('requests.full') : t('rides.seatsLeft', { count: item.seats })}
                    </Text>
                  </View>
                </View>

                <Text style={typography.body} numberOfLines={1}>
                  {(item.origin_town ?? item.origin_name)} → {item.destination_name}
                </Text>

                <Text style={typography.caption} numberOfLines={1}>
                  {[driver, formatDistance(item.distance, settings.metric)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>

                {open ? (
                  <View style={[styles.details, { borderTopColor: colors.divider }]}>
                    {item.meeting_point ? (
                      <View style={styles.detailRow}>
                        <Text style={typography.caption}>{t('matching.meeting')}</Text>
                        <Text style={typography.body}>{item.meeting_point}</Text>
                        <Pressable onPress={() => openMeeting(item)} hitSlop={8}>
                          <Text
                            style={[typography.caption, { color: colors.text, fontWeight: '600' }]}
                          >
                            {t('matching.openInMaps')} ↗
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}

                    {item.note ? (
                      <View style={styles.detailRow}>
                        <Text style={typography.caption}>{t('matching.vehicle')}</Text>
                        <Text style={typography.body}>{item.note}</Text>
                      </View>
                    ) : null}

                    {!own && mine?.status !== 'declined' ? (
                      <Button
                        label={requestLabel}
                        onPress={() => toggleRequest(item)}
                        disabled={busyId === item.id || (full && !active)}
                      />
                    ) : null}
                    {!own && mine?.status === 'declined' ? (
                      <Text style={typography.caption}>{t('requests.declined')}</Text>
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          }}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { height: '40%' },
  sheet: {
    flex: 1,
    marginTop: -radii.lg,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  header: { marginBottom: spacing.xs, gap: spacing.xs },
  sectionHeader: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  card: {
    padding: spacing.md,
    borderRadius: radii.md,
    gap: 4,
    marginBottom: spacing.sm,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
  },
  details: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  detailRow: { gap: 2 },
  empty: { gap: spacing.md, marginTop: spacing.md },
  emptyText: { textAlign: 'center', marginTop: spacing.md },
});