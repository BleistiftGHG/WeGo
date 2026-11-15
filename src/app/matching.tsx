import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
  destination_name: string;
  departure_time: string;
  seats: number;
  note: string | null;
};

type NearbyRide = Ride & { distance: number };

export default function Matching() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { t, i18n } = useTranslation();
  const { colors, typography, isDark } = useTheme();
  const { settings } = useSettings();
  const { status, coords, enable } = useUserLocation();

  const [rides, setRides] = useState<Ride[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth.user?.id ?? null);
    const { data } = await supabase
      .from('rides')
      .select(
        'id, driver_id, origin_name, origin_lat, origin_lng, destination_name, departure_time, seats, note',
      )
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });
    setRides((data as Ride[]) ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const nearby = useMemo<NearbyRide[]>(() => {
    if (!coords) return [];
    return rides
      .filter((r) => r.driver_id !== userId && !(r.origin_lat === 0 && r.origin_lng === 0))
      .map((r) => ({
        ...r,
        distance: distanceMeters(coords, { lat: r.origin_lat, lng: r.origin_lng }),
      }))
      .filter((r) => r.distance <= RADIUS_METERS)
      .sort((a, b) => a.distance - b.distance);
  }, [rides, coords, userId]);

  const focus = (ride: NearbyRide) => {
    setSelectedId(ride.id);
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

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const header = (
    <View style={styles.header}>
      <Text style={typography.title}>{t('matching.title')}</Text>
      <Text style={typography.caption}>{t('matching.subtitle')}</Text>
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
        onLayout={fitAll}
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
            onPress={() => focus(ride)}
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
        <FlatList
          data={nearby}
          keyExtractor={(ride) => ride.id}
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
              <Text style={[typography.caption, styles.emptyText]}>
                {t('matching.empty')}
              </Text>
            )
          }
          renderItem={({ item }) => {
            const selected = item.id === selectedId;
            return (
              <Pressable
                onPress={() => focus(item)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.input,
                    borderColor: selected ? colors.text : colors.border,
                    borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <Text style={typography.body}>
                  {item.origin_name} → {item.destination_name}
                </Text>
                <Text style={typography.caption}>
                  {formatTime(item.departure_time)} ·{' '}
                  {t('rides.seatsLeft', { count: item.seats })}
                </Text>
                <Text style={typography.caption}>
                  {t('matching.away', {
                    distance: formatDistance(item.distance, settings.metric),
                  })}
                </Text>
                {item.note ? <Text style={typography.caption}>{item.note}</Text> : null}
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
  map: { height: '45%' },
  sheet: {
    flex: 1,
    marginTop: -radii.lg,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, gap: spacing.sm },
  header: { marginBottom: spacing.sm, gap: spacing.xs },
  card: { padding: spacing.md, borderRadius: radii.md, gap: spacing.xs },
  empty: { gap: spacing.md, marginTop: spacing.md },
  emptyText: { textAlign: 'center', marginTop: spacing.md },
});