import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { BurgerMenu } from '@/components/BurgerMenu';
import { GlassButton } from '@/components/Glass';
import { MapControls } from '@/components/MapControls';
import { MapPin } from '@/components/MapPin';
import { darkMapStyle } from '@/constants/mapStyle';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';
import { useUserLocation, type Coords } from '@/hooks/useUserLocation';

const FALLBACK_ORIGIN: Coords = { latitude: 51.1657, longitude: 10.4515 };
const FALLBACK_DELTA = 8;
const TILT = 60;

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const { coords, status, enable, refresh } = useUserLocation();

  const [is3D, setIs3D] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [heading, setHeading] = useState(0);
  const tilted = useRef(false);

  const flyTo = useCallback((center: Coords) => {
    const near = tilted.current;
    mapRef.current?.animateCamera(
      {
        center,
        ...(Platform.OS === 'ios'
          ? { altitude: near ? 1200 : 6000 }
          : { zoom: near ? 17 : 14 }),
      },
      { duration: 600 },
    );
  }, []);

  useEffect(() => {
    if (coords) flyTo(coords);
  }, [coords, flyTo]);

  const syncCamera = useCallback(async () => {
    const camera = await mapRef.current?.getCamera();
    if (!camera) return;
    const next = (camera.pitch ?? 0) > 10;
    tilted.current = next;
    setIs3D(next);
    setHeading(camera.heading ?? 0);
  }, []);

  const locate = () => {
    if (status === 'denied') {
      enable();
      return;
    }
    if (coords) flyTo(coords);
    refresh();
  };

  const toggle3D = async () => {
    const next = !tilted.current;
    tilted.current = next;
    setIs3D(next);

    const camera = await mapRef.current?.getCamera();
    if (!camera) return;

    const closer =
      Platform.OS === 'ios'
        ? (camera.altitude ?? 0) > 2000
          ? { altitude: 1200 }
          : {}
        : (camera.zoom ?? 0) < 16
          ? { zoom: 17 }
          : {};

    mapRef.current?.animateCamera(
      { pitch: next ? TILT : 0, ...(next ? closer : {}) },
      { duration: 600 },
    );
  };

  const faceNorth = () => {
    mapRef.current?.animateCamera({ heading: 0 }, { duration: 400 });
  };

  const mapType = satellite ? 'hybrid' : Platform.OS === 'ios' ? 'mutedStandard' : 'standard';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        mapType={mapType}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        customMapStyle={isDark && !satellite ? darkMapStyle : undefined}
        initialRegion={{
          ...FALLBACK_ORIGIN,
          latitudeDelta: FALLBACK_DELTA,
          longitudeDelta: FALLBACK_DELTA,
        }}
        pitchEnabled
        rotateEnabled
        showsBuildings
        onRegionChangeComplete={syncCamera}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {coords ? (
          <Marker coordinate={coords} anchor={{ x: 0.5, y: 0.5 }}>
            <MapPin size={12} />
          </Marker>
        ) : null}
      </MapView>

      <BurgerMenu />

      <MapControls
        is3D={is3D}
        satellite={satellite}
        heading={heading}
        onLocate={locate}
        onToggle3D={toggle3D}
        onNorth={faceNorth}
        onToggleLayers={() => setSatellite((prev) => !prev)}
      />

      <View style={styles.actions}>
        <GlassButton label={t('home.findRide')} onPress={() => router.push('/matching')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actions: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
});