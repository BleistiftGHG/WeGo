import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { radii } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';

export const hasGlass =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

type SurfaceProps = {
  style?: StyleProp<ViewStyle>;
  active?: boolean;
  solid?: boolean;
  children: ReactNode;
};

function Surface({ style, active, solid, children }: SurfaceProps) {
  const { colors, isDark } = useTheme();

  if (hasGlass) {
    return (
      <GlassView
        style={style}
        glassEffectStyle="regular"
        isInteractive
        colorScheme={isDark ? 'dark' : 'light'}
        tintColor={active ? `${colors.surface}B3` : undefined}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        style,
        {
          backgroundColor: active || solid ? colors.surface : colors.background,
          borderColor: colors.border,
          borderWidth: solid ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      {children}
    </View>
  );
}

type IconButtonProps = {
  label: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  children: (color: string) => ReactNode;
};

export function GlassIconButton({
  label,
  onPress,
  active,
  size = 44,
  style,
  children,
}: IconButtonProps) {
  const { colors } = useTheme();
  const fg = active ? colors.onSurface : colors.text;

  return (
    <Surface active={active} style={[{ width: size, height: size, borderRadius: size / 2 }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={[styles.fill, { borderRadius: size / 2 }]}
      >
        {children(fg)}
      </Pressable>
    </Surface>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function GlassButton({ label, onPress, disabled }: ButtonProps) {
  const { colors, typography } = useTheme();
  const textColor = hasGlass ? colors.text : colors.onSurface;

  return (
    <Surface solid style={styles.pill}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        disabled={disabled}
        style={[styles.fill, { borderRadius: radii.pill, opacity: disabled ? 0.4 : 1 }]}
      >
        <Text style={[typography.body, { color: textColor, fontWeight: '600' }]}>{label}</Text>
      </Pressable>
    </Surface>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { height: 52, borderRadius: radii.pill },
});