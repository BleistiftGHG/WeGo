import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { radii } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';

type Variant = 'primary' | 'secondary';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
};

export function Button({ label, variant = 'primary', disabled, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? { backgroundColor: colors.surface }
          : { borderWidth: 1, borderColor: colors.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}
    >
      <Text
        style={[styles.label, { color: isPrimary ? colors.onSurface : colors.surface }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
});