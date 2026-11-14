import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';

export type Ride = {
  id: string;
  driver: string;
  departure: string;
  route: string;
};

type RideCardProps = {
  ride: Ride;
  onPress?: () => void;
};

export function RideCard({ ride, onPress }: RideCardProps) {
  const { colors, typography } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.divider, backgroundColor: colors.background },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.info}>
        <Text style={[typography.body, styles.driver]}>{ride.driver}</Text>
        <Text style={[typography.caption, styles.route]} numberOfLines={1}>
          {ride.route}
        </Text>
      </View>
      <Text style={typography.heading}>{ride.departure}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.6,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  driver: {
    fontWeight: '600',
  },
  route: {
    marginTop: 2,
  },
});