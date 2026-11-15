import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { radii, spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';

type Props = {
  label: string;
  value: Date;
  mode: 'date' | 'time';
  onChange: (next: Date) => void;
  minimumDate?: Date;
};

export function DateTimeField({ label, value, mode, onChange, minimumDate }: Props) {
  const { i18n } = useTranslation();
  const { colors, typography, isDark } = useTheme();

  const text =
    mode === 'date'
      ? value.toLocaleDateString(i18n.language, {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : value.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });

  const handle = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'set' && selected) onChange(selected);
  };

  const openAndroid = () =>
    DateTimePickerAndroid.open({
      value,
      mode,
      is24Hour: true,
      minimumDate,
      onChange: handle,
    });

  return (
    <View style={[styles.row, { backgroundColor: colors.input }]}>
      <Text style={typography.caption}>{label}</Text>

      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value}
          mode={mode}
          display="compact"
          minimumDate={minimumDate}
          minuteInterval={5}
          locale={i18n.language}
          themeVariant={isDark ? 'dark' : 'light'}
          onChange={handle}
        />
      ) : (
        <Pressable onPress={openAndroid} style={styles.androidValue}>
          <Text style={typography.body}>{text}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  androidValue: {
    paddingVertical: spacing.xs,
  },
});