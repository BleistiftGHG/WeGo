import { useMemo, useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin } from '@/components/MapPin';
import { RideCard } from '@/components/RideCard';
import { placeDrivers, type PlacedDriver } from '@/constants/drivers';
import { darkMapStyle } from '@/constants/mapStyle';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useUserLocation, type Coords } from '@/hooks/useUserLocation';

const FALLBACK_ORIGIN: Coords = { latitude: 51.1657, longitude: 10.4515 };
const OVERVIEW_DELTA = 0.02;
const FOCUS_DELTA = 0.006;

export default function Matching() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { coords } = useUserLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const origin = coords ?? FALLBACK_ORIGIN;
  const drivers = useMemo(() => placeDrivers(origin), [origin]);

  const focus = (driver: PlacedDriver) => {
    setSelectedId(driver.id);
    mapRef.current?.animateToRegion(
      { ...driver.coordinate, latitudeDelta: FOCUS_DELTA, longitudeDelta: FOCUS_DELTA },
      500,
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        userInterfaceStyle="dark"
        customMapStyle={darkMapStyle}
        initialRegion={{
          ...origin,
          latitudeDelta: OVERVIEW_DELTA,
          longitudeDelta: OVERVIEW_DELTA,
        }}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {coords ? (
          <Marker coordinate={coords} anchor={{ x: 0.5, y: 0.5 }}>
            <MapPin size={12} />
          </Marker>
        ) : null}
        {drivers.map((driver) => (
          <Marker
            key={driver.id}
            coordinate={driver.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => focus(driver)}
          >
            <MapPin size={driver.id === selectedId ? 28 : 18} />
          </Marker>
        ))}
      </MapView>

      <View style={styles.sheet}>
        <FlatList
          data={drivers}
          keyExtractor={(driver) => driver.id}
          renderItem={({ item }) => <RideCard ride={item} onPress={() => focus(item)} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Rides near you</Text>
              <Text style={styles.subtitle}>Matched to your route and class</Text>
            </View>
          }
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    height: '45%',
  },
  sheet: {
    flex: 1,
    marginTop: -radii.lg,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.caption,
  },
});