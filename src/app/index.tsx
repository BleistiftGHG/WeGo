import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { spacing } from "@/constants/theme";
import { useSettings, useTheme } from "@/context/SettingsContext";
import { fetchOwnName, saveOwnName } from "@/lib/names";
import { supabase } from "@/lib/supabase";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = "checking" | "code" | "name" | "done";
type ErrorKind = "invalid" | "network" | null;

export default function Onboarding() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { settings, update } = useSettings();

  const [step, setStep] = useState<Step>("checking");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<ErrorKind>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!settings.classCode) {
      setError(null);
      setStep("code");
      return;
    }

    setStep("checking");
    setError(null);
    fetchOwnName()
      .then((own) => {
        if (cancelled) return;
        setStep(own.trim() ? "done" : "name");
      })
      .catch(() => {
        if (cancelled) return;
        setError("network");
        setStep("name");
      });

    return () => {
      cancelled = true;
    };
  }, [settings.classCode]);

  const handleCode = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
      }

      const { data, error: rpcError } = await supabase.rpc("join_class", {
        p_code: code.trim(),
      });
      if (rpcError) throw rpcError;

      if (data) {
        update("classCode", data as string);
      } else {
        setError("invalid");
      }
    } catch {
      setError("network");
    } finally {
      setLoading(false);
    }
  };

  const handleName = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    const result = await saveOwnName(name);
    setLoading(false);

    if (result === "ok") {
      setStep("done");
    } else {
      setError(result === "invalid" ? "invalid" : "network");
    }
  };

  if (step === "done") {
    return <Redirect href="/home" />;
  }

  if (step === "checking") {
    return (
      <View style={[styles.safe, { backgroundColor: colors.background }]} />
    );
  }

  const isName = step === "name";

  const helper = isName
    ? error === "invalid"
      ? t("profile.nameInvalid")
      : error === "network"
        ? t("profile.nameError")
        : t("onboarding.nameHelper")
    : error === "invalid"
      ? t("onboarding.invalid")
      : error === "network"
        ? t("onboarding.networkError")
        : t("onboarding.helper");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Text style={[typography.heading, styles.brand]}>WeGo</Text>

          <View style={styles.form}>
            <Text style={[typography.title, styles.title]}>
              {isName ? t("onboarding.nameTitle") : t("onboarding.title")}
            </Text>

            {isName ? (
              <Input
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError(null);
                }}
                placeholder={t("profile.namePlaceholder")}
                maxLength={30}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleName}
              />
            ) : (
              <Input
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setError(null);
                }}
                placeholder={t("onboarding.placeholder")}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleCode}
              />
            )}

            <Button
              label={t("onboarding.continue")}
              onPress={isName ? handleName : handleCode}
              disabled={
                (isName ? name.trim().length < 2 : code.trim().length === 0) ||
                loading
              }
            />
            <Text style={[typography.caption, styles.helper]}>{helper}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  brand: { marginTop: spacing.md },
  form: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: { marginBottom: spacing.xs },
  helper: { textAlign: "center" },
});
