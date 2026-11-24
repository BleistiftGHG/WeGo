import { useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GlassIconButton } from '@/components/Glass';
import { radii, spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/context/SettingsContext';

const MENU_WIDTH = 280;
const EDGE_WIDTH = 20;
const DISTANCE_THRESHOLD = MENU_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 0.5;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Item = {
  icon: IconName;
  label: string;
  onPress: () => void | Promise<void>;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function BurgerMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { signOut } = useSettings();
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const open = () => {
    setVisible(true);
    Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const close = (after?: () => void) => {
    Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setVisible(false);
      after?.();
    });
  };

  const snapOpen = () => {
    Animated.spring(progress, { toValue: 1, useNativeDriver: true }).start();
  };

  const closeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      progress.setValue(clamp(1 + e.translationX / MENU_WIDTH));
    })
    .onEnd((e) => {
      if (e.translationX < -DISTANCE_THRESHOLD || e.velocityX / 1000 < -VELOCITY_THRESHOLD) {
        close();
      } else {
        snapOpen();
      }
    })
    .onFinalize((_, success) => {
      if (!success) snapOpen();
    });

  const edgePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dx > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: () => {
        progress.setValue(0);
        setVisible(true);
      },
      onPanResponderMove: (_, g) => {
        progress.setValue(clamp(g.dx / MENU_WIDTH));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > DISTANCE_THRESHOLD || g.vx > VELOCITY_THRESHOLD) {
          Animated.timing(progress, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        } else {
          close();
        }
      },
      onPanResponderTerminate: () => close(),
    }),
  ).current;

  const items: Item[] = [
    { icon: 'map-outline', label: t('tabs.map'), onPress: () => router.navigate('/home') },
    { icon: 'car-outline', label: t('home.findRide'), onPress: () => router.push('/matching') },
    { icon: 'person-outline', label: t('tabs.profile'), onPress: () => router.push('/profile') },
    {
      icon: 'log-out-outline',
      label: t('profile.signOut'),
      onPress: async () => {
        await signOut();
        router.replace('/');
      },
    },
  ];

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-MENU_WIDTH, 0],
  });

  return (
    <>
      <View style={styles.edge} {...edgePan.panHandlers} />

      <GlassIconButton
        label={t('menu.open')}
        onPress={open}
        style={{ position: 'absolute', left: spacing.md, top: insets.top + spacing.xs }}
      >
        {(color) => <Ionicons name="menu" size={24} color={color} />}
      </GlassIconButton>

      <Modal visible={visible} transparent animationType="none" onRequestClose={() => close()}>
        <GestureHandlerRootView style={styles.root}>
          <GestureDetector gesture={closeGesture}>
            <View style={styles.root}>
              <Animated.View style={[styles.backdrop, { opacity: progress }]}>
                <Pressable
                  style={StyleSheet.absoluteFill}
                  accessibilityLabel={t('menu.close')}
                  onPress={() => close()}
                />
              </Animated.View>

              <Animated.View
                style={[
                  styles.panel,
                  {
                    width: MENU_WIDTH,
                    paddingTop: insets.top + spacing.md,
                    paddingBottom: insets.bottom + spacing.md,
                    backgroundColor: colors.background,
                    borderRightColor: colors.divider,
                    transform: [{ translateX }],
                  },
                ]}
              >
                <Text style={[typography.heading, styles.brand]}>WeGo</Text>

                {items.map((item) => (
                  <Pressable
                    key={item.label}
                    accessibilityRole="button"
                    onPress={() => close(() => item.onPress())}
                    style={({ pressed }) => [
                      styles.item,
                      pressed && { backgroundColor: colors.input },
                    ]}
                  >
                    <Ionicons name={item.icon} size={22} color={colors.text} />
                    <Text style={typography.body}>{item.label}</Text>
                  </Pressable>
                ))}
              </Animated.View>
            </View>
          </GestureDetector>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
  },
  root: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    flex: 1,
    paddingHorizontal: spacing.md,
    borderRightWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  brand: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.md,
  },
});