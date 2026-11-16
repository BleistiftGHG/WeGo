import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    useWindowDimensions,
    type ImageSourcePropType
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import Svg, {
    Circle,
    Defs,
    G,
    LinearGradient,
    Path,
    Polygon,
    RadialGradient,
    Rect,
    Stop,
} from "react-native-svg";

// Sobald das echte Logo da ist: Zeile ersetzen durch
// const LOGO_SOURCE: ImageSourcePropType | null = require('../../assets/images/wego-logo-white.png');
const LOGO_SOURCE: ImageSourcePropType | null = null;

const BEAM = 220;
const CAR = 300;
const TRAIL = 340;
const VB_W = BEAM + CAR + TRAIL;
const VB_H = 80;

const WHITE = "#FFFFFF";
const BLACK = "#000000";

function CarScene() {
  const x0 = BEAM;
  const body =
    "M10 60 L10 48 Q10 42 20 40 L70 33 L112 14 Q118 10 128 10 H190 Q205 10 215 20 L262 38 Q290 42 292 50 L292 60 Z";

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Defs>
        <LinearGradient id="beam" x1="1" y1="0" x2="0" y2="0">
          <Stop offset="0" stopColor={WHITE} stopOpacity={0.5} />
          <Stop offset="1" stopColor={WHITE} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="trail" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={WHITE} stopOpacity={0.95} />
          <Stop offset="1" stopColor={WHITE} stopOpacity={0} />
        </LinearGradient>
        <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={WHITE} stopOpacity={0.9} />
          <Stop offset="1" stopColor={WHITE} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Polygon points={`${x0 + 14},43 0,18 0,72`} fill="url(#beam)" />

      <Rect
        x={x0 + CAR - 2}
        y={42.2}
        width={TRAIL}
        height={1.6}
        fill="url(#trail)"
      />
      <Rect
        x={x0 + CAR - 2}
        y={46.2}
        width={TRAIL * 0.7}
        height={1.2}
        fill="url(#trail)"
        opacity={0.7}
      />
      <Rect
        x={x0 + CAR - 2}
        y={38.4}
        width={TRAIL * 0.5}
        height={1}
        fill="url(#trail)"
        opacity={0.5}
      />

      <G transform={`translate(${x0 + 30} 0)`} opacity={0.06}>
        <Path d={body} fill={WHITE} />
      </G>
      <G transform={`translate(${x0 + 16} 0)`} opacity={0.12}>
        <Path d={body} fill={WHITE} />
      </G>

      <G transform={`translate(${x0} 0)`}>
        <Path
          d={body}
          fill={BLACK}
          stroke={WHITE}
          strokeWidth={1.4}
          strokeOpacity={0.9}
        />
        <Path
          d="M78 33 L113 17 Q118 14 126 14 H150 V33 Z M156 33 V14 H188 Q198 14 206 22 L228 33 Z"
          fill={WHITE}
          fillOpacity={0.06}
          stroke={WHITE}
          strokeWidth={0.8}
          strokeOpacity={0.5}
        />
        <Path
          d="M14 46 H290"
          stroke={WHITE}
          strokeWidth={0.7}
          strokeOpacity={0.35}
        />

        <Circle cx={75} cy={58} r={16} fill={BLACK} />
        <Circle cx={225} cy={58} r={16} fill={BLACK} />
        {[75, 225].map((cx) => (
          <G key={cx}>
            <Circle
              cx={cx}
              cy={58}
              r={12.5}
              fill={BLACK}
              stroke={WHITE}
              strokeWidth={1.4}
            />
            <Circle
              cx={cx}
              cy={58}
              r={6}
              fill="none"
              stroke={WHITE}
              strokeWidth={0.8}
              strokeOpacity={0.6}
            />
            <Circle cx={cx} cy={58} r={1.8} fill={WHITE} fillOpacity={0.8} />
          </G>
        ))}

        <Circle cx={16} cy={43} r={16} fill="url(#glow)" />
        <Rect x={11} y={41.5} width={16} height={3} rx={1.5} fill={WHITE} />
        <Rect
          x={278}
          y={43}
          width={14}
          height={2}
          rx={1}
          fill={WHITE}
          fillOpacity={0.85}
        />
      </G>
    </Svg>
  );
}

export function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();

  const carPx = Math.min(width * 0.62, 340);
  const scale = carPx / CAR;
  const sceneW = VB_W * scale;
  const sceneH = VB_H * scale;

  const carX = useSharedValue(width);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.96);
  const overlay = useSharedValue(1);

  useEffect(() => {
    carX.value = withDelay(
      100,
      withTiming(-sceneW, {
        duration: 1100,
        easing: Easing.inOut(Easing.quad),
      }),
    );
    logoOpacity.value = withDelay(1050, withTiming(1, { duration: 550 }));
    logoScale.value = withDelay(
      1050,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    overlay.value = withDelay(1800, withTiming(0, { duration: 300 }));

    const timer = setTimeout(onDone, 2150);
    return () => clearTimeout(timer);
  }, []);

  const rootStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const carStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: carX.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const logoWidth = Math.min(width * 0.55, 260);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View
        onLayout={() => SplashScreen.hideAsync()}
        style={[styles.root, rootStyle]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.scene,
            { width: sceneW, height: sceneH, top: height / 2 - sceneH / 2 },
            carStyle,
          ]}
        >
          <CarScene />
        </Animated.View>

        <Animated.View style={[styles.logo, logoStyle]}>
          {LOGO_SOURCE ? (
            <Image
              source={LOGO_SOURCE}
              style={{ width: logoWidth, height: 90 }}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.placeholder}>WeGo</Text>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BLACK,
    alignItems: "center",
    justifyContent: "center",
  },
  scene: { position: "absolute", left: 0 },
  logo: { alignItems: "center", justifyContent: "center" },
  placeholder: {
    color: WHITE,
    fontSize: 64,
    lineHeight: 72,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
