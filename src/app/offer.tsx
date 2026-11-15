import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { DateTimeField } from '@/components/DateTimeField';
import { Input } from '@/components/Input';
import { OptionRow } from '@/components/OptionRow';
import { PlaceSearch } from '@/components/PlaceSearch';
import { radii, spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/context/SettingsContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import {
  distanceMeters,
  fetchNearbySchools,
  fetchNearbyTowns,
  formatDistance,
  geocodeMeetingPoint,
  geocodeTown,
  type Place,
} from '@/lib/nearby';
import { supabase } from '@/lib/supabase';

type DbSchool = { id: string; name: string; city: string; lat: number; lng: number };

const CURRENT = 'current';

function defaultDeparture() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const { colors, typography } = useTheme();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <View style={styles.field}>
      <Text style={typography.caption}>{label}</Text>
      <View style={[styles.stepperRow, { backgroundColor: colors.input }]}>
        <Pressable onPress={() => onChange(clamp(value - 1))} style={styles.stepBtn}>
          <Text style={typography.heading}>−</Text>
        </Pressable>
        <Text style={typography.heading}>{value}</Text>
        <Pressable onPress={() => onChange(clamp(value + 1))} style={styles.stepBtn}>
          <Text style={typography.heading}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Offer() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { settings } = useSettings();
  const { coords } = useUserLocation();

  const [currentTown, setCurrentTown] = useState('');
  const [towns, setTowns] = useState<Place[]>([]);
  const [extraTowns, setExtraTowns] = useState<Place[]>([]);
  const [nearbySchools, setNearbySchools] = useState<Place[]>([]);
  const [extraSchools, setExtraSchools] = useState<Place[]>([]);
  const [dbSchools, setDbSchools] = useState<DbSchool[]>([]);
  const [ownSchoolId, setOwnSchoolId] = useState<string | null>(null);
  const [searching, setSearching] = useState(true);

  const [fromKey, setFromKey] = useState<string>(CURRENT);
  const [manualTown, setManualTown] = useState('');
  const [schoolKey, setSchoolKey] = useState<string | null>(null);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [departure, setDeparture] = useState(defaultDeparture);
  const [seats, setSeats] = useState(3);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: list }, { data: own }] = await Promise.all([
        supabase.from('schools').select('id, name, city, lat, lng'),
        supabase.rpc('my_school_id'),
      ]);
      setDbSchools((list as DbSchool[]) ?? []);
      setOwnSchoolId((own as string | null) ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setSearching(true);

    Location.reverseGeocodeAsync(coords)
      .then(([place]) => {
        const name = place?.city ?? place?.subregion ?? place?.district;
        if (!cancelled && name) setCurrentTown(name);
      })
      .catch(() => {});

    Promise.all([fetchNearbyTowns(coords), fetchNearbySchools(coords)]).then(
      ([townList, schoolList]) => {
        if (cancelled) return;
        setTowns(townList);
        setNearbySchools(schoolList);
        setSearching(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [coords]);

  const baseSchools = useMemo<Place[]>(() => {
    const merged = [...nearbySchools];
    const own = dbSchools.find((s) => s.id === ownSchoolId);
    if (own && !merged.some((p) => p.name.toLowerCase() === own.name.toLowerCase())) {
      merged.unshift({
        id: `db-${own.id}`,
        name: own.name,
        lat: own.lat,
        lng: own.lng,
        distance: coords ? distanceMeters(coords, own) : 0,
      });
    }
    if (merged.length === 0) {
      return dbSchools.map((s) => ({
        id: `db-${s.id}`,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        distance: coords ? distanceMeters(coords, s) : 0,
      }));
    }
    return merged;
  }, [nearbySchools, dbSchools, ownSchoolId, coords]);

  const schools = useMemo(
    () => [
      ...extraSchools,
      ...baseSchools.filter((p) => !extraSchools.some((e) => e.id === p.id)),
    ],
    [extraSchools, baseSchools],
  );

  const allTowns = useMemo(
    () => [...extraTowns, ...towns.filter((p) => !extraTowns.some((e) => e.id === p.id))],
    [extraTowns, towns],
  );

  const isOwn = (place: Place) => {
    const own = dbSchools.find((s) => s.id === ownSchoolId);
    return !!own && own.name.toLowerCase() === place.name.toLowerCase();
  };

  useEffect(() => {
    if (schoolKey || schools.length === 0) return;
    const own = schools.find(isOwn);
    setSchoolKey((own ?? schools[0]).id);
  }, [schools, schoolKey, ownSchoolId]);

  const pickTown = (place: Place) => {
    setExtraTowns((prev) => (prev.some((p) => p.id === place.id) ? prev : [place, ...prev]));
    setFromKey(place.id);
  };

  const pickSchool = (place: Place) => {
    setExtraSchools((prev) => (prev.some((p) => p.id === place.id) ? prev : [place, ...prev]));
    setSchoolKey(place.id);
  };

  const school = schools.find((s) => s.id === schoolKey) ?? null;
  const pickedTown = allTowns.find((p) => p.id === fromKey) ?? null;
  const usingManual = !currentTown && allTowns.length === 0 && !searching;

  const townName = usingManual
    ? manualTown.trim()
    : fromKey === CURRENT
      ? currentTown
      : (pickedTown?.name ?? '');

  const inFuture = departure.getTime() > Date.now();
  const canSave =
    !!townName && !!meetingPoint.trim() && !!note.trim() && !!school && inFuture && !saving;

  const setDate = (picked: Date) =>
    setDeparture((prev) => {
      const next = new Date(prev);
      next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      return next;
    });

  const setTime = (picked: Date) =>
    setDeparture((prev) => {
      const next = new Date(prev);
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      return next;
    });

  const save = async () => {
    if (!school) return;
    setSaving(true);
    setFailed(false);

    const { data: auth } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('class_id')
      .eq('id', auth.user?.id ?? '')
      .single();

    const matched = dbSchools.find((s) => s.name.toLowerCase() === school.name.toLowerCase());

    const center = pickedTown
      ? { lat: pickedTown.lat, lng: pickedTown.lng }
      : await geocodeTown(townName, coords);
    const pinLat = center?.lat ?? coords?.latitude ?? 0;
    const pinLng = center?.lng ?? coords?.longitude ?? 0;

    const spot = await geocodeMeetingPoint(
      `${meetingPoint.trim()}, ${townName}`,
      center ? { latitude: center.lat, longitude: center.lng } : coords,
    );

    const { error } = await supabase.from('rides').insert({
      driver_id: auth.user?.id,
      class_id: profile?.class_id,
      school_id: matched?.id ?? null,
      origin_town: townName,
      meeting_point: meetingPoint.trim(),
      origin_name: `${townName}, ${meetingPoint.trim()}`,
      origin_lat: pinLat,
      origin_lng: pinLng,
      meeting_lat: spot?.lat ?? null,
      meeting_lng: spot?.lng ?? null,
      destination_name: school.name,
      destination_lat: school.lat,
      destination_lng: school.lng,
      departure_time: departure.toISOString(),
      seats,
      note: note.trim() || null,
    });

    setSaving(false);
    if (error) {
      setFailed(true);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={typography.title}>{t('rides.offer')}</Text>

        <View style={styles.field}>
          <Text style={typography.caption}>{t('rides.fromTown')}</Text>

          {usingManual ? (
            <Input
              value={manualTown}
              onChangeText={setManualTown}
              placeholder={t('rides.fromTown')}
            />
          ) : (
            <>
              <OptionRow
                icon="navigate"
                title={t('rides.currentLocation')}
                subtitle={currentTown || undefined}
                selected={fromKey === CURRENT}
                onPress={() => setFromKey(CURRENT)}
              />
              {allTowns.length > 0 ? (
                <Text style={[typography.caption, styles.subhead]}>{t('rides.nearbyTowns')}</Text>
              ) : null}
              {allTowns.map((place) => (
                <OptionRow
                  key={place.id}
                  icon="location-outline"
                  title={place.name}
                  subtitle={
                    [
                      place.detail,
                      coords ? formatDistance(place.distance, settings.metric) : '',
                    ]
                      .filter(Boolean)
                      .join(' · ') || undefined
                  }
                  selected={fromKey === place.id}
                  onPress={() => setFromKey(place.id)}
                />
              ))}
            </>
          )}

          {searching && coords ? (
            <View style={styles.searching}>
              <ActivityIndicator color={colors.textSecondary} />
              <Text style={typography.caption}>{t('rides.searching')}</Text>
            </View>
          ) : null}

          <PlaceSearch
            kind="town"
            placeholder={t('rides.searchTown')}
            near={coords}
            onPick={pickTown}
          />
        </View>

        <View style={styles.field}>
          <Text style={typography.caption}>{t('rides.meetingPoint')}</Text>
          <Input
            value={meetingPoint}
            onChangeText={setMeetingPoint}
            placeholder={t('rides.meetingPoint')}
          />
        </View>

        <View style={styles.field}>
          <Text style={typography.caption}>{t('rides.toSchool')}</Text>
          {schools.map((place) => {
            const own = isOwn(place);
            const distance = coords ? formatDistance(place.distance, settings.metric) : '';
            const subtitle = [own ? t('rides.yourSchool') : '', place.detail ?? '', distance]
              .filter(Boolean)
              .join(' · ');
            return (
              <OptionRow
                key={place.id}
                icon="school-outline"
                title={place.name}
                subtitle={subtitle || undefined}
                selected={place.id === schoolKey}
                onPress={() => setSchoolKey(place.id)}
              />
            );
          })}
          {!searching && schools.length === 0 ? (
            <Text style={typography.caption}>{t('rides.noResults')}</Text>
          ) : null}

          <PlaceSearch
            kind="school"
            placeholder={t('rides.searchSchool')}
            near={coords}
            onPick={pickSchool}
          />
        </View>

        <DateTimeField
          label={t('rides.date')}
          mode="date"
          value={departure}
          onChange={setDate}
          minimumDate={startOfToday()}
        />
        <DateTimeField
          label={t('rides.time')}
          mode="time"
          value={departure}
          onChange={setTime}
        />

        <Stepper label={t('rides.seats')} value={seats} onChange={setSeats} min={1} max={8} />

        <View style={styles.field}>
          <Text style={typography.caption}>{t('rides.note')}</Text>
          <Input
            value={note}
            onChangeText={setNote}
            placeholder={t('rides.notePlaceholder')}
          />
        </View>

        {!inFuture ? <Text style={typography.caption}>{t('rides.pastError')}</Text> : null}
        {failed ? <Text style={typography.caption}>{t('rides.error')}</Text> : null}

        <Button label={t('rides.save')} onPress={save} disabled={!canSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingTop: 100, paddingBottom: spacing.xl, gap: spacing.md },
  field: { gap: spacing.xs },
  subhead: { marginTop: spacing.xs },
  searching: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
  },
  stepBtn: { width: 56, height: 48, alignItems: 'center', justifyContent: 'center' },
});