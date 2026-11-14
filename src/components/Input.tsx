import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { radii, spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';

export function Input({ style, ...rest }: TextInputProps) {
  const { colors, isDark } = useTheme();

  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      selectionColor={colors.surface}
      cursorColor={colors.surface}
      keyboardAppearance={isDark ? 'dark' : 'light'}
      style={[styles.input, { backgroundColor: colors.input, color: colors.text }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
});