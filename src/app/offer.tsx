import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { radii, spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { supabase } from '@/lib/supabase';

function nextDeparture(dayOffset: number, hour: number, minute: number) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v: number) => String(v),
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  const { colors, typography } = useTheme();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <View style={styles.stepper}>
      <Text style={typography.caption}>{label}</Text>
      <View style={[styles.stepperRow, { backgroundColor: colors.input }]}>
        <Pressable onPress={() => onChange(clamp(value - step))} style={styles.stepBtn}>
          <Text style={typography.heading}>−</Text>
        </Pressable>
        <Text style={typography.heading}>{format(value)}</Text>
        <Pressable onPress={() => onChange(clamp(value + step))} style={styles.stepBtn}>
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
  const { coords } = useUserLocation();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [tomorrow, setTomorrow] = useState(false);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(30);
  const [seats, setSeats] = useState(3);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const pad = (v: number) => String(v).padStart(2, '0');
  const canSave = origin.trim() && destination.trim() && !saving;

  const save = async () => {
    setSaving(true);
    setFailed(false);

    const { data: auth } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('class_id')
      .eq('id', auth.user?.id ?? '')
      .single();

    const { error } = await supabase.from('rides').insert({
      driver_id: auth.user?.id,
      class_id: profile?.class_id,
      origin_name: origin.trim(),
      origin_lat: coords?.latitude ?? 0,
      origin_lng: coords?.longitude ?? 0,
      destination_name: destination.trim(),
      departure_time: nextDeparture(tomorrow ? 1 : 0, hour, minute).toISOString(),
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
        <Text style={[typography.title, styles.title]}>{t('rides.offer')}</Text>

        <Input value={origin} onChangeText={setOrigin} placeholder={t('rides.origin')} />
        <Input
          value={destination}
          onChangeText={setDestination}
          placeholder={t('rides.destination')}
        />

        <View style={styles.dayRow}>
          {[false, true].map((isTomorrow) => {
            const selected = tomorrow === isTomorrow;
            return (
              <Pressable
                key={String(isTomorrow)}
                onPress={() => setTomorrow(isTomorrow)}
                style={[
                  styles.dayBtn,
                  { backgroundColor: selected ? colors.surface : colors.input },
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    { color: selected ? colors.onSurface : colors.textSecondary },
                  ]}
                >
                  {isTomorrow ? 'Morgen / Tomorrow' : 'Heute / Today'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Stepper label={`${t('rides.time')} (h)`} value={hour} onChange={setHour} min={0} max={23} format={pad} />
        <Stepper label={`${t('rides.time')} (min)`} value={minute} onChange={setMinute} min={0} max={55} step={5} format={pad} />
        <Stepper label={t('rides.seats')} value={seats} onChange={setSeats} min={1} max={8} />

        <Input value={note} onChangeText={setNote} placeholder={t('rides.note')} />

        {failed ? <Text style={typography.caption}>{t('rides.error')}</Text> : null}

        <Button label={t('rides.save')} onPress={save} disabled={!canSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingTop: 100, gap: spacing.md },
  title: {},
  dayRow: { flexDirection: 'row', gap: spacing.xs },
  dayBtn: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: { gap: spacing.xs },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
  },
  stepBtn: { width: 56, height: 48, alignItems: 'center', justifyContent: 'center' },
});