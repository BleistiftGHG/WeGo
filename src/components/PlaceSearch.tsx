import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/Input';
import { OptionRow } from '@/components/OptionRow';
import { spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/context/SettingsContext';
import { formatDistance, searchPlaces, type Place } from '@/lib/nearby';

type Props = {
  kind: 'town' | 'school';
  placeholder: string;
  near: { latitude: number; longitude: number } | null;
  onPick: (place: Place) => void;
};

export function PlaceSearch({ kind, placeholder, near, onPick }: Props) {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setLoading(false);
      setDone(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const found = await searchPlaces(q, kind, near);
      if (cancelled) return;
      setResults(found);
      setLoading(false);
      setDone(true);
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, kind, near?.latitude, near?.longitude]);

  const pick = (place: Place) => {
    onPick(place);
    setQuery('');
    setResults([]);
    setDone(false);
  };

  return (
    <View style={styles.wrap}>
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        autoCorrect={false}
        returnKeyType="search"
      />
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator color={colors.textSecondary} />
          <Text style={typography.caption}>{t('rides.searching')}</Text>
        </View>
      ) : null}
      {results.map((place) => (
        <OptionRow
          key={place.id}
          icon={kind === 'school' ? 'school-outline' : 'location-outline'}
          title={place.name}
          subtitle={
            [place.detail, near ? formatDistance(place.distance, settings.metric) : '']
              .filter(Boolean)
              .join(' · ') || undefined
          }
          selected={false}
          onPress={() => pick(place)}
        />
      ))}
      {!loading && done && results.length === 0 ? (
        <Text style={typography.caption}>{t('rides.noHits')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});