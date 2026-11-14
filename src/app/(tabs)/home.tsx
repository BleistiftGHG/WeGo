import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { BurgerMenu } from '@/components/BurgerMenu';
import { Button } from '@/components/Button';
import { MapPin } from '@/components/MapPin';
import { darkMapStyle } from '@/constants/mapStyle';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';
import { useUserLocation, type Coords } from '@/hooks/useUserLocation';

const FALLBACK_ORIGIN: Coords = { latitude: 51.1657, longitude: 10.4515 };
const FALLBACK_DELTA = 8;
const USER_DELTA = 0.02;

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const { coords } = useUserLocation();

  useEffect(() => {
    if (!coords) return;
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: USER_DELTA, longitudeDelta: USER_DELTA },
      600,
    );
  }, [coords]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        customMapStyle={isDark ? darkMapStyle : undefined}
        initialRegion={{
          ...FALLBACK_ORIGIN,
          latitudeDelta: FALLBACK_DELTA,
          longitudeDelta: FALLBACK_DELTA,
        }}
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

      <View style={styles.actions}>
        <Button label={t('home.findRide')} onPress={() => router.push('/matching')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actions: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
});