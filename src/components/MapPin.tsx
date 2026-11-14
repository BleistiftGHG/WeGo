import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';

type MapPinProps = {
  size?: number;
};

export function MapPin({ size = 16 }: MapPinProps) {
  return (
    <View
      style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.background,
  },
});