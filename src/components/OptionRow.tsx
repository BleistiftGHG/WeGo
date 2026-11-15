import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  logoUrl?: string | null;
  logoUrlDark?: string | null;
  selected: boolean;
  onPress: () => void;
};

const LOGO_HEIGHT = 40;

const isSvg = (url: string) => url.split('?')[0].toLowerCase().endsWith('.svg');

export function OptionRow({
  title,
  subtitle,
  icon,
  logoUrl,
  logoUrlDark,
  selected,
  onPress,
}: Props) {
  const { colors, typography, isDark } = useTheme();
  const logo = (isDark ? logoUrlDark : logoUrl) || logoUrl || logoUrlDark;

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
      {!logo && icon ? <Ionicons name={icon} size={20} color={colors.text} /> : null}

      <View style={styles.text}>
        {logo ? (
          <View style={styles.logoBox}>
            {isSvg(logo) ? (
              <SvgUri
                uri={logo}
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <Image source={{ uri: logo }} style={styles.logoImage} resizeMode="contain" />
            )}
          </View>
        ) : null}
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
  logoBox: {
    width: '100%',
    height: LOGO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  logoImage: { width: '100%', height: '100%' },
});