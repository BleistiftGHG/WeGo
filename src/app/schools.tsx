import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OptionRow } from '@/components/OptionRow';
import { spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/context/SettingsContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { distanceMeters, formatDistance } from '@/lib/nearby';
import { emitSchoolPicked } from '@/lib/schoolPicker';
import { supabase } from '@/lib/supabase';

type DbSchool = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  logo_url: string | null;
  logo_url_dark: string | null;
};

export default function Schools() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { settings } = useSettings();
  const { coords } = useUserLocation();
  const [schools, setSchools] = useState<DbSchool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('schools')
      .select('id, name, city, lat, lng, logo_url, logo_url_dark')
      .order('name')
      .then(({ data }) => {
        setSchools((data as DbSchool[]) ?? []);
        setLoading(false);
      });
  }, []);

  const pick = (school: DbSchool) => {
    emitSchoolPicked({
      id: `db-${school.id}`,
      name: school.name,
      lat: school.lat,
      lng: school.lng,
      detail: school.city,
      logoUrl: school.logo_url ?? undefined,
      logoUrlDark: school.logo_url_dark ?? undefined,
      distance: coords ? distanceMeters(coords, school) : 0,
    });
    router.back();
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={typography.title}>{t('rides.schoolsTitle')}</Text>

      {loading ? <ActivityIndicator color={colors.textSecondary} /> : null}

      {schools.map((school) => (
        <OptionRow
          key={school.id}
          icon="school-outline"
          title={school.name}
          logoUrl={school.logo_url}
          logoUrlDark={school.logo_url_dark}
          subtitle={
            [
              school.city,
              coords ? formatDistance(distanceMeters(coords, school), settings.metric) : '',
            ]
              .filter(Boolean)
              .join(' · ') || undefined
          }
          selected={false}
          onPress={() => pick(school)}
        />
      ))}

      {!loading && schools.length === 0 ? (
        <Text style={typography.caption}>{t('rides.schoolsEmpty')}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingTop: 100, paddingBottom: spacing.xl, gap: spacing.sm },
});