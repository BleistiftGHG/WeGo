import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { radii, spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';

type Props = {
  is3D: boolean;
  satellite: boolean;
  heading: number;
  onLocate: () => void;
  onToggle3D: () => void;
  onNorth: () => void;
  onToggleLayers: () => void;
};

function RoundButton({
  label,
  active,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  children: (color: string) => ReactNode;
}) {
  const { colors } = useTheme();
  const fg = active ? colors.onSurface : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: active ? colors.surface : colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      {children(fg)}
    </Pressable>
  );
}

export function MapControls({
  is3D,
  satellite,
  heading,
  onLocate,
  onToggle3D,
  onNorth,
  onToggleLayers,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const rotated = Math.abs(heading) > 1 && Math.abs(heading - 360) > 1;

  return (
    <View style={[styles.column, { top: insets.top + spacing.xs }]}>
      <RoundButton label={t('map.locate')} onPress={onLocate}>
        {(color) => <Ionicons name="locate" size={22} color={color} />}
      </RoundButton>

      <RoundButton
        label={is3D ? t('map.view2d') : t('map.view3d')}
        active={is3D}
        onPress={onToggle3D}
      >
        {(color) => <Text style={[styles.label, { color }]}>3D</Text>}
      </RoundButton>

      <RoundButton
        label={satellite ? t('map.standard') : t('map.satellite')}
        active={satellite}
        onPress={onToggleLayers}
      >
        {(color) => <Ionicons name="layers-outline" size={22} color={color} />}
      </RoundButton>

      {rotated ? (
        <RoundButton label={t('map.north')} onPress={onNorth}>
          {(color) => (
            <View style={{ transform: [{ rotate: `${-heading}deg` }] }}>
              <Ionicons name="compass-outline" size={24} color={color} />
            </View>
          )}
        </RoundButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    right: spacing.md,
    gap: spacing.xs,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '800' },
});