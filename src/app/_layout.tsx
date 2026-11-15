import "@/i18n";
import { SettingsProvider, useTheme } from "@/context/SettingsContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

function Navigator() {
  const { colors, isDark } = useTheme();

  const subScreen = {
    headerShown: true,
    headerTitle: "",
    headerBackButtonDisplayMode: "minimal" as const,
    headerTransparent: true,
    headerTintColor: colors.text,
    animation: "slide_from_right" as const,
  };

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="profile"
          options={{
            ...subScreen,
            headerTransparent: false,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen name="matching" options={subScreen} />
        <Stack.Screen name="offer" options={subScreen} />
        <Stack.Screen name="schools" options={subScreen} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <Navigator />
    </SettingsProvider>
  );
}