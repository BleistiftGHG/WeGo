import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/context/SettingsContext';
import { supabase } from '@/lib/supabase';

type ErrorKind = 'invalid' | 'network' | null;

export default function Onboarding() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { settings, update } = useSettings();
  const [code, setCode] = useState('');
  const [error, setError] = useState<ErrorKind>(null);
  const [loading, setLoading] = useState(false);

  if (settings.classCode) {
    return <Redirect href="/home" />;
  }

  const handleContinue = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
      }

      const { data, error: rpcError } = await supabase.rpc('join_class', {
        p_code: code.trim(),
      });
      if (rpcError) throw rpcError;

      if (data) {
        update('classCode', data as string);
      } else {
        setError('invalid');
      }
    } catch {
      setError('network');
    } finally {
      setLoading(false);
    }
  };

  const helper =
    error === 'invalid'
      ? t('onboarding.invalid')
      : error === 'network'
        ? t('onboarding.networkError')
        : t('onboarding.helper');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={[typography.heading, styles.brand]}>WeGo</Text>

          <View style={styles.form}>
            <Text style={[typography.title, styles.title]}>{t('onboarding.title')}</Text>
            <Input
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError(null);
              }}
              placeholder={t('onboarding.placeholder')}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            <Button
              label={t('onboarding.continue')}
              onPress={handleContinue}
              disabled={code.trim().length === 0 || loading}
            />
            <Text style={[typography.caption, styles.helper]}>{helper}</Text>
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