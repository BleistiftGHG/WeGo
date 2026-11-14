import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/SettingsContext';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const icon =
    (name: IconName) =>
    ({ color, size }: { color: string; size: number }) => (
      <Ionicons name={name} size={size} color={color} />
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('tabs.map'), tabBarIcon: icon('map') }}
      />
      <Tabs.Screen
        name="rides"
        options={{ title: t('tabs.rides'), tabBarIcon: icon('car') }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: t('tabs.messages'), tabBarIcon: icon('chatbubbles') }}
      />
    </Tabs>
  );
}