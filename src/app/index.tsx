import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { colors, spacing, typography } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VALID_CODES = ["WEGO-10A", "WEGO-10B", "WEGO-11C", "TEST"];

export default function Onboarding() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleContinue = () => {
    if (VALID_CODES.includes(code.trim().toUpperCase())) {
      router.replace("/(tabs)");
    } else {
      setHasError(true);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.brand}>WeGo</Text>

          <View style={styles.form}>
            <Text style={styles.title}>Enter your class code</Text>
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
            <Text style={styles.helper}>
              {hasError
                ? "That code isn't valid. Check it with your teacher."
                : "Your teacher gives you a unique code for your class."}
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
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  brand: {
    ...typography.heading,
    marginTop: spacing.md,
  },
  form: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  helper: {
    ...typography.caption,
    textAlign: "center",
  },
});
