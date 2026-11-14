import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Keyboard, PanResponder, Platform, StyleSheet, View } from 'react-native';
import { radii, spacing } from '@/constants/theme';
import { useTheme } from '@/context/SettingsContext';

type BottomSheetProps = {
  translateY: Animated.Value;
  lift?: Animated.Value;
  bottomOffset?: number;
  onHeightChange?: (height: number) => void;
  peek?: number;
  children: ReactNode;
};

export function BottomSheet({
  translateY,
  lift: liftProp,
  bottomOffset = 0,
  onHeightChange,
  peek = 144,
  children,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const [height, setHeight] = useState(0);
  const resting = useRef(0);
  const maxOffset = useRef(0);
  maxOffset.current = Math.max(height - peek, 0);

  const internalLift = useRef(new Animated.Value(0)).current;
  const lift = liftProp ?? internalLift;
  const liftUp = useMemo(() => Animated.multiply(lift, -1), [lift]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const show = Keyboard.addListener('keyboardWillShow', (event) => {
      Animated.timing(lift, {
        toValue: Math.max(event.endCoordinates.height - bottomOffset, 0),
        duration: event.duration || 250,
        useNativeDriver: true,
      }).start();
    });
    const hide = Keyboard.addListener('keyboardWillHide', (event) => {
      Animated.timing(lift, {
        toValue: 0,
        duration: event.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [lift, bottomOffset]);

  const pan = useMemo(() => {
    const snapTo = (to: number) => {
      resting.current = to;
      Animated.spring(translateY, {
        toValue: to,
        bounciness: 0,
        useNativeDriver: true,
      }).start();
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const next = resting.current + gesture.dy;
        translateY.setValue(Math.min(Math.max(next, 0), maxOffset.current));
      },
      onPanResponderRelease: (_, gesture) => {
        const projected = resting.current + gesture.dy + gesture.vy * 120;
        snapTo(projected > maxOffset.current / 2 ? maxOffset.current : 0);
      },
    });
  }, [translateY]);

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.background,
          borderColor: colors.divider,
          transform: [{ translateY }, { translateY: liftUp }],
        },
      ]}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.height;
        setHeight(next);
        onHeightChange?.(next);
      }}
    >
      <View style={styles.grabArea} {...pan.panHandlers}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
      </View>
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 1,
  },
  grabArea: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
  },
  content: {
    gap: spacing.md,
  },
});