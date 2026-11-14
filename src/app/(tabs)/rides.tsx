import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';

export default function Rides() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.content}>
        <Text style={[typography.title, styles.title]}>{t('tabs.rides')}</Text>
        <Text style={typography.caption}>{t('placeholder.soon')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.xs },
  title: { marginTop: spacing.md },
});