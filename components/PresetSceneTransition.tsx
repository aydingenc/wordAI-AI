import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export type WordLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

type LeveledWord = { word: string; level: WordLevel };

type Props = {
  sceneTitle: string;
  sceneSummaryTR: string;
  targetWords: LeveledWord[];
  sceneIcon: string;
  onProceed: () => void;
};

const TOKENS = {
  bg: '#0A0714',
  violet100: '#C4B5FD',
  textMuted: '#A19DB0',
};

const primaryGradient = ['#A78BFA', '#7C3AED'] as const;

const LEVEL_PILL_COLORS: Record<WordLevel, { background: string; borderColor: string; color: string }> = {
  A1: { background: 'rgba(34,197,94,0.14)', borderColor: 'rgba(74,222,128,0.4)', color: '#4ade80' },
  A2: { background: 'rgba(34,197,94,0.14)', borderColor: 'rgba(74,222,128,0.4)', color: '#4ade80' },
  B1: { background: 'rgba(240,180,41,0.14)', borderColor: 'rgba(250,204,21,0.4)', color: '#facc15' },
  B2: { background: 'rgba(240,180,41,0.14)', borderColor: 'rgba(250,204,21,0.4)', color: '#facc15' },
  C1: { background: 'rgba(56,146,255,0.14)', borderColor: 'rgba(96,165,250,0.4)', color: '#60a5fa' },
  C2: { background: 'rgba(56,146,255,0.14)', borderColor: 'rgba(96,165,250,0.4)', color: '#60a5fa' },
};

const READY_DELAY = 2300;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export function PresetSceneTransition({ sceneTitle, sceneSummaryTR, targetWords, sceneIcon, onProceed }: Props) {
  const [ready, setReady] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const summaryOpacity = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.7)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.5)).current;
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const arrowNudge = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const fallAnims = useRef(targetWords.map(() => new Animated.Value(0))).current;
  const fallConfigs = useRef(
    targetWords.map(() => ({
      duration: 8000 + Math.random() * 4000,
      delay: Math.random() * 5000,
      left: Math.min(78, 4 + Math.random() * 74),
    })),
  ).current;

  useEffect(() => {
    Animated.timing(titleOpacity, { toValue: 1, duration: 500, delay: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.timing(titleTranslateY, { toValue: 0, duration: 500, delay: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.timing(summaryOpacity, { toValue: 1, duration: 450, delay: 750, useNativeDriver: true }).start();
    Animated.timing(iconOpacity, { toValue: 1, duration: 200, delay: 1300, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(1300),
      Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
    ]).start();
    Animated.timing(checkOpacity, { toValue: 1, duration: 300, delay: 1850, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(1850),
      Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }),
    ]).start();
    Animated.timing(statusOpacity, { toValue: 1, duration: 400, delay: 1300, useNativeDriver: true }).start();

    fallAnims.forEach((anim, i) => {
      const cfg = fallConfigs[i];
      Animated.sequence([
        Animated.delay(cfg.delay),
        Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: cfg.duration, easing: Easing.linear, useNativeDriver: true }),
        ),
      ]).start();
    });

    // isReady is driven by this fixed ~2.3s local timer for now; in the real
    // integration this will be replaced by the actual scene-ready signal.
    const timer = setTimeout(() => setReady(true), READY_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowNudge, { toValue: 3, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(arrowNudge, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [ready, arrowNudge]);

  const handlePress = () => {
    if (!ready) return;
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => onProceed());
  };

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <View style={styles.page}>
        <View pointerEvents="none" style={styles.wordBg}>
          {targetWords.map((item, i) => {
            const anim = fallAnims[i];
            const cfg = fallConfigs[i];
            const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-40, SCREEN_HEIGHT + 40] });
            const opacity = anim.interpolate({ inputRange: [0, 0.08, 0.88, 1], outputRange: [0, 0.55, 0.55, 0] });
            const colors = LEVEL_PILL_COLORS[item.level];
            return (
              <Animated.View
                key={item.word + i}
                style={[
                  styles.fallingPill,
                  {
                    left: `${cfg.left}%`,
                    opacity,
                    transform: [{ translateY }],
                    backgroundColor: colors.background,
                    borderColor: colors.borderColor,
                  },
                ]}
              >
                <Text style={[styles.fallingPillText, { color: colors.color }]}>{item.word}</Text>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.content}>
          <View style={styles.titleWrap}>
            <Animated.Text style={[styles.sceneTitle, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}>
              {sceneTitle}
            </Animated.Text>
            <Animated.Text style={[styles.summaryText, { opacity: summaryOpacity }]}>{sceneSummaryTR}</Animated.Text>
          </View>

          <View style={styles.iconWrap}>
            <Animated.View style={[styles.iconCircleWrap, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
              <LinearGradient colors={primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
                <MaterialCommunityIcons name={sceneIcon as never} size={34} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
            <Animated.View style={[styles.checkBadge, { opacity: checkOpacity, transform: [{ scale: checkScale }] }]}>
              <Feather name="check" size={13} color="#FFFFFF" />
            </Animated.View>
          </View>

          <Pressable onPress={handlePress} disabled={!ready}>
            <Animated.View style={[styles.statusLine, { opacity: statusOpacity }]}>
              <Text style={[styles.statusText, ready && styles.statusTextReady]}>
                {ready ? 'Sahnen hazır!' : 'Sahnen hazırlanıyor'}
              </Text>
              {ready ? (
                <Animated.View style={{ transform: [{ translateX: arrowNudge }] }}>
                  <Feather name="chevron-right" size={13} color={TOKENS.violet100} />
                </Animated.View>
              ) : null}
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TOKENS.bg,
  },
  page: { flex: 1, width: '100%', maxWidth: 400, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  wordBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  fallingPill: {
    position: 'absolute',
    top: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  fallingPillText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },

  content: { alignItems: 'center', width: '100%' },
  titleWrap: { alignItems: 'center' },
  sceneTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 22, textAlign: 'center' },
  summaryText: {
    marginTop: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 13.5,
    lineHeight: 21,
    color: TOKENS.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },

  iconWrap: { width: 96, height: 96, marginTop: 34, position: 'relative' },
  iconCircleWrap: { position: 'absolute', top: 8, left: 8 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 26,
    elevation: 12,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    borderWidth: 3,
    borderColor: TOKENS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusLine: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: TOKENS.textMuted },
  statusTextReady: { color: TOKENS.violet100, fontFamily: 'Inter_700Bold' },
});
