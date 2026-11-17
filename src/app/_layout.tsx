import { AnimatedSplash } from "@/components/AnimatedSplash";
import { SettingsProvider, useTheme } from "@/context/SettingsContext";
import "@/i18n";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { View } from "react-native";

SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { colors, isDark } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  const subScreen = {
    headerShown: true,
    headerTitle: "",
    headerBackButtonDisplayMode: "minimal" as const,
    headerTransparent: true,
    headerTintColor: colors.text,
    animation: "slide_from_right" as const,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        <Stack.Screen
          name="chat/[id]"
          options={{
            ...subScreen,
            headerTransparent: false,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
          }}
        />
      </Stack>

      {showSplash ? (
        <AnimatedSplash onDone={() => setShowSplash(false)} />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <Navigator />
    </SettingsProvider>
  );
}
