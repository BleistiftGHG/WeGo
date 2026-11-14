import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SettingRow } from '@/components/SettingRow';
import { radii, spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/context/SettingsContext';
import { LANGUAGES, type LanguagePref } from '@/i18n';
import type { ThemeMode } from '@/lib/storage';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[typography.caption, styles.sectionTitle]}>{title}</Text>
      <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }}>
        {children}
      </View>
    </View>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (next: T) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.pickerRow, { borderBottomColor: colors.divider }]}>
      <View style={[styles.segmented, { backgroundColor: colors.input }]}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.segment, selected && { backgroundColor: colors.surface }]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: selected ? colors.onSurface : colors.textSecondary },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { settings, update, signOut } = useSettings();

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: t('profile.themeDark'), value: 'dark' },
    { label: t('profile.themeLight'), value: 'light' },
    { label: t('profile.themeSystem'), value: 'system' },
  ];

  const languageOptions: { label: string; value: LanguagePref }[] = [
    { label: t('profile.languageSystem'), value: 'system' },
    ...LANGUAGES.map((l) => ({ label: l.label, value: l.value as LanguagePref })),
  ];

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[typography.title, styles.title]}>{t('profile.title')}</Text>

        <Section title={t('profile.account')}>
          <SettingRow label={t('profile.name')} value="Alex Meyer" />
          <SettingRow label={t('profile.classCode')} value={settings.classCode ?? '—'} />
        </Section>

        <Section title={t('profile.appearance')}>
          <Segmented
            options={themeOptions}
            value={settings.theme}
            onChange={(next) => update('theme', next)}
          />
        </Section>

        <Section title={t('profile.language')}>
          <Segmented
            options={languageOptions}
            value={settings.language}
            onChange={(next) => update('language', next)}
          />
        </Section>

        <Section title={t('profile.notifications')}>
          <SettingRow
            label={t('profile.rideSuggestions')}
            toggle={{
              value: settings.notifications,
              onChange: (next) => update('notifications', next),
            }}
          />
        </Section>

        <Section title={t('profile.preferences')}>
          <SettingRow
            label={t('profile.metric')}
            toggle={{ value: settings.metric, onChange: (next) => update('metric', next) }}
          />
          <SettingRow
            label={t('profile.haptics')}
            toggle={{ value: settings.haptics, onChange: (next) => update('haptics', next) }}
          />
        </Section>

        <Section title={t('profile.about')}>
          <SettingRow
            label={t('profile.version')}
            value={Constants.expoConfig?.version ?? '1.0.0'}
          />
          <SettingRow label={t('profile.signOut')} onPress={handleSignOut} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  title: {
    marginTop: spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pickerRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radii.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: radii.md - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});