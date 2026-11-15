import "@/i18n";
import { SettingsProvider, useTheme } from "@/context/SettingsContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

function Navigator() {
  const { colors, isDark } = useTheme();

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
            headerShown: true,
            headerTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="offer"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerTransparent: true,
            headerTintColor: colors.text,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="matching"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerTransparent: true,
            headerTintColor: "#FFFFFF",
            animation: "slide_from_right",
          }}
        />
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
