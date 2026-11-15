import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
};

export function OptionRow({ title, subtitle, icon, selected, onPress }: Props) {
  const { colors, typography } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: colors.input,
          borderColor: selected ? colors.text : colors.border,
          borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={colors.text} /> : null}
      <View style={styles.text}>
        <Text style={typography.body}>{title}</Text>
        {subtitle ? <Text style={typography.caption}>{subtitle}</Text> : null}
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.text} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  text: { flex: 1, gap: 2 },
});