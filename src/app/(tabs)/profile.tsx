import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { SettingRow } from '@/components/SettingRow';
import { radii, spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/context/SettingsContext';
import type { ThemeMode } from '@/lib/storage';

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'system' },
];

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

function ThemePicker() {
  const { colors } = useTheme();
  const { settings, update } = useSettings();

  return (
    <View style={[styles.pickerRow, { borderBottomColor: colors.divider }]}>
      <View style={[styles.segmented, { backgroundColor: colors.input }]}>
        {THEME_OPTIONS.map((option) => {
          const selected = settings.theme === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => update('theme', option.value)}
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
  const { colors, typography } = useTheme();
  const { settings, update, signOut } = useSettings();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[typography.title, styles.title]}>Profile</Text>

        <Section title="Account">
          <SettingRow label="Name" value="Alex Meyer" />
          <SettingRow label="Class code" value={settings.classCode ?? '—'} />
        </Section>

        <Section title="Appearance">
          <ThemePicker />
        </Section>

        <Section title="Notifications">
          <SettingRow
            label="Ride suggestions"
            toggle={{
              value: settings.notifications,
              onChange: (next) => update('notifications', next),
            }}
          />
        </Section>

        <Section title="Preferences">
          <SettingRow
            label="Metric units"
            toggle={{ value: settings.metric, onChange: (next) => update('metric', next) }}
          />
          <SettingRow
            label="Haptics"
            toggle={{ value: settings.haptics, onChange: (next) => update('haptics', next) }}
          />
        </Section>

        <Section title="About">
          <SettingRow label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
          <SettingRow label="Sign out" onPress={handleSignOut} />
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