import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Toggle } from '@/components/Toggle';
import { useTheme } from '@/context/SettingsContext';
import { spacing } from '@/constants/theme';

type SettingRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: {
    value: boolean;
    onChange: (value: boolean) => void;
  };
};

export function SettingRow({ label, value, onPress, toggle }: SettingRowProps) {
  const { colors, typography } = useTheme();
  const handlePress = toggle ? () => toggle.onChange(!toggle.value) : onPress;

  return (
    <Pressable
      accessibilityRole={toggle ? 'switch' : 'button'}
      disabled={!handlePress}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.divider },
        pressed && styles.pressed,
      ]}
    >
      <Text style={typography.body}>{label}</Text>
      <View style={styles.right}>
        {value ? (
          <Text style={[typography.caption, styles.value]}>{value}</Text>
        ) : null}
        {toggle ? (
          <Toggle
            value={toggle.value}
            onValueChange={toggle.onChange}
            accessibilityLabel={label}
          />
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.6,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontSize: 16,
  },
});