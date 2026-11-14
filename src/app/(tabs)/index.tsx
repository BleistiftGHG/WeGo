import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/context/SettingsContext';

const VALID_CODES = ['WEGO-10A', 'WEGO-10B', 'WEGO-11C'];

export default function Onboarding() {
  const { colors, typography } = useTheme();
  const { settings, update } = useSettings();
  const [code, setCode] = useState('');
  const [hasError, setHasError] = useState(false);

  if (settings.classCode) {
    return <Redirect href="/home" />;
  }

  const handleContinue = () => {
    const normalized = code.trim().toUpperCase();
    if (VALID_CODES.includes(normalized)) {
      update('classCode', normalized);
    } else {
      setHasError(true);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={[typography.heading, styles.brand]}>WeGo</Text>

          <View style={styles.form}>
            <Text style={[typography.title, styles.title]}>Enter your class code</Text>
            <Input
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setHasError(false);
              }}
              placeholder="Class code"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            <Button
              label="Continue"
              onPress={handleContinue}
              disabled={code.trim().length === 0}
            />
            <Text style={[typography.caption, styles.helper]}>
              {hasError
                ? "That code isn't valid. Check it with your teacher."
                : 'Your teacher gives you a unique code for your class.'}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  brand: {
    marginTop: spacing.md,
  },
  form: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.xs,
  },
  helper: {
    textAlign: 'center',
  },
});