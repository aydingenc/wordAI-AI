import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TargetWord = { word: string; meaning: string };

type Props = {
  targetWords: TargetWord[];
  storyPreview: string;
  isReady: boolean;
  onProceed: () => void;
};

const TOKENS = {
  bg: '#08070D',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet500: '#8B5CF6',
  violet600: '#7C3AED',
  violet700: '#5B21B6',
  textHi: '#F5F3FF',
  textMid: '#B9B3D1',
  textLow: '#6F6A8A',
  amber: '#F0B429',
};

const cardGradient = ['rgba(139,92,246,0.09)', 'rgba(139,92,246,0.02)', 'rgba(255,255,255,0.025)'] as const;
const cardGradientLocations = [0, 0.4, 1] as const;
const primaryGradient = [TOKENS.violet400, TOKENS.violet600] as const;
const iconGradient = [TOKENS.violet400, TOKENS.violet600] as const;
const tabActiveGradient = [TOKENS.violet500, TOKENS.violet700] as const;
const progressGradient = [TOKENS.violet400, TOKENS.violet500] as const;
const ringGradient = [TOKENS.violet300, TOKENS.violet600] as const;
const ctaGradient = ['#8B5CF6', '#6D28D9'] as const;

const TOTAL_SECONDS = 60;
const PHASE1_END = 7;
const PHASE2_END = 50;

const RING_SIZE = 132;
const RING_RADIUS = 60;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function hexToRgbTriple(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const int = parseInt(full, 16);
  return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`;
}

/** Cross-platform glow/shadow: `boxShadow` on web, shadow props + elevation on native. */
function crossGlow(
  color: string,
  opacity: number,
  radius: number,
  offset: { width: number; height: number } = { width: 0, height: 0 },
) {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px rgba(${hexToRgbTriple(color)},${opacity})`,
    } as const;
  }
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: Math.max(2, Math.round(radius / 3)),
  };
}

export function StoryGenerationCooldown({ targetWords, storyPreview, isReady, onProceed }: Props) {
  const insets = useSafeAreaInsets();

  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordFlipped, setWordFlipped] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastWordSlot = useRef(-1);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current;
  const prevPhase = useRef(phase);
  const readyOpacity = useRef(new Animated.Value(0)).current;
  const readyTranslateY = useRef(new Animated.Value(12)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimedOut(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const elapsed = TOTAL_SECONDS - remaining;
    Animated.timing(progressAnim, {
      toValue: Math.min(elapsed / TOTAL_SECONDS, 1),
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    const wordCount = Math.max(1, targetWords.length);

    if (elapsed < PHASE1_END) {
      setPhase(1);
    } else if (elapsed < PHASE2_END) {
      setPhase(2);
      const phase2Elapsed = elapsed - PHASE1_END;
      const phase2Duration = PHASE2_END - PHASE1_END;
      const perWord = phase2Duration / wordCount;
      const slot = Math.min(wordCount - 1, Math.floor(phase2Elapsed / perWord));
      if (slot !== lastWordSlot.current) {
        lastWordSlot.current = slot;
        setWordIndex(slot);
        setWordFlipped(false);
      }
    } else {
      setPhase(3);
      const phase3Elapsed = elapsed - PHASE2_END;
      const phase3Duration = TOTAL_SECONDS - PHASE2_END;
      const chars = Math.min(
        storyPreview.length,
        Math.floor((phase3Elapsed / phase3Duration) * storyPreview.length),
      );
      setTypedChars(chars);
    }
  }, [remaining, targetWords.length, storyPreview, progressAnim]);

  useEffect(() => {
    if (prevPhase.current === phase) return;
    prevPhase.current = phase;
    cardOpacity.setValue(0);
    cardTranslateY.setValue(10);
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(cardTranslateY, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [phase, cardOpacity, cardTranslateY]);

  useEffect(() => {
    if (!isReady) return;
    Animated.parallel([
      Animated.timing(readyOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(readyTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [isReady, readyOpacity, readyTranslateY]);

  useEffect(() => {
    if (!timedOut || isReady) return;
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [timedOut, isReady, spinAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ).start();
  }, [cursorAnim]);

  const handleProceed = () => {
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 450,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => onProceed());
  };

  const currentWord = targetWords[wordIndex] ?? targetWords[0] ?? { word: '', meaning: '' };
  const spinStyle = {
    transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
  };
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const ringDashoffset = progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, RING_CIRCUMFERENCE] });
  const showExtendedWait = timedOut && !isReady;
  const showBottomInfo = !isReady && !timedOut;

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <View pointerEvents="none" style={styles.bgGlowTop} />
      <View pointerEvents="none" style={styles.bgGlowBottom} />
      <View style={[styles.page, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <LinearGradient colors={iconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoCircle}>
            <MaterialCommunityIcons name="star-four-points" size={22} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.h1}>Hikâyen Hazırlanıyor</Text>
            <Text style={styles.headerSub}>Kelimelerini hikâyeye dönüştürüyoruz.</Text>
          </View>
        </View>

        <View style={styles.timerArea}>
          <View style={styles.ringWrap}>
            <View style={styles.ring}>
              <View pointerEvents="none" style={styles.ringHalo} />
              <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
                <Defs>
                  <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={ringGradient[0]} />
                    <Stop offset="100%" stopColor={ringGradient[1]} />
                  </SvgLinearGradient>
                </Defs>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="rgba(139,92,246,0.14)"
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <AnimatedCircle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="url(#ringGrad)"
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringDashoffset}
                />
              </Svg>
              <View pointerEvents="none" style={styles.ringCenter}>
                <Text style={styles.timerNum}>{timedOut ? '···' : Math.max(remaining, 0)}</Text>
                {!timedOut ? <Text style={styles.timerUnit}>sn</Text> : null}
              </View>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFillWrap, { width: progressWidth }]}>
              <LinearGradient colors={progressGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.progressFill} />
            </Animated.View>
          </View>

          <View style={styles.phaseRow}>
            <PhasePill label="Bilgi" active={phase === 1} />
            <PhasePill label="Tekrar" active={phase === 2} />
            <PhasePill label="Hazırlanıyor" active={phase === 3} />
          </View>
        </View>

        <View style={styles.contentWrap}>
          <Animated.View style={{ flex: 1, opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }}>
            {phase === 1 ? (
              <LinearGradient colors={cardGradient} locations={cardGradientLocations} style={styles.glassCard}>
                <View style={styles.phaseCenterWrap}>
                  <LinearGradient colors={iconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.factIcon}>
                    <MaterialCommunityIcons name="star-four-points" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.cardTitle}>Günün İlginç Bilgisi</Text>
                  <Text style={[styles.bodyText, styles.phaseOneBodyText]}>
                    Bir dili kalıcı öğrenmenin en güçlü yollarından biri, kelimeleri tek başına değil; hikâye, duygu ve
                    bağlam içinde görmektir.
                  </Text>
                  <View style={styles.tipPill}>
                    <MaterialCommunityIcons name="lightbulb-on-outline" size={13} color={TOKENS.amber} />
                    <Text style={styles.tipPillText}>Beklerken küçük bir öğrenme molası</Text>
                  </View>
                </View>
              </LinearGradient>
            ) : null}

            {phase === 2 ? (
              <LinearGradient colors={cardGradient} locations={cardGradientLocations} style={styles.glassCard}>
                <View style={styles.sectionHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Günün Kelimeleri</Text>
                    <Text style={styles.bodyText}>Beklerken hedef kelimeleri hızlıca tekrar et.</Text>
                  </View>
                  <Feather name="book" size={20} color={TOKENS.violet400} />
                </View>
                <Pressable style={styles.bigWordCard} onPress={() => setWordFlipped((f) => !f)}>
                  <Text style={styles.bigWordText}>{wordFlipped ? currentWord.meaning : currentWord.word}</Text>
                  <Text style={styles.bigWordHint}>
                    {wordFlipped ? 'Kelimeye dönmek için tekrar dokun' : 'Anlamı görmek için dokun'}
                  </Text>
                </Pressable>
                <View style={styles.wordDots}>
                  {targetWords.map((w, i) => (
                    <View key={w.word + i} style={[styles.wordDot, i === wordIndex && styles.wordDotActive]} />
                  ))}
                </View>
              </LinearGradient>
            ) : null}

            {phase === 3 ? (
              <LinearGradient colors={cardGradient} locations={cardGradientLocations} style={styles.glassCard}>
                <View style={styles.sectionHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Hikâyen Yazılıyor</Text>
                    <Text style={styles.bodyText}>Hikâyenin ilk satırları oluşuyor.</Text>
                  </View>
                  <Feather name="feather" size={20} color={TOKENS.violet400} />
                </View>
                <View style={styles.typingBox}>
                  <Text style={styles.typingText}>
                    {storyPreview.slice(0, typedChars)}
                    <Animated.Text style={[styles.cursor, { opacity: cursorAnim }]}>|</Animated.Text>
                  </Text>
                </View>
              </LinearGradient>
            ) : null}
          </Animated.View>
        </View>

        <View style={styles.bottomSlot}>
          {showBottomInfo ? (
            <View style={styles.bottomCard}>
              <View style={styles.bottomCardIcon}>
                <Feather name="book-open" size={17} color={TOKENS.violet400} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bottomCardTitle}>AI Story & Quiz hazırlanıyor</Text>
                <Text style={styles.bottomCardSub}>Hikâye, hedef kelimeler ve quiz aynı akışta açılacak.</Text>
              </View>
            </View>
          ) : null}

          {showExtendedWait ? (
            <View style={styles.extendedWait}>
              <Animated.View style={[styles.spin, spinStyle]} />
              <Text style={styles.extendedWaitText}>Neredeyse bitti, biraz daha sürüyor...</Text>
            </View>
          ) : null}

          {isReady ? (
            <Animated.View style={{ opacity: readyOpacity, transform: [{ translateY: readyTranslateY }] }}>
              <View pointerEvents="none" style={styles.readyGlow} />
              <Pressable style={styles.readyCtaWrap} onPress={handleProceed}>
                <LinearGradient colors={ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.readyCta}>
                  <Feather name="check" size={17} color="#FFFFFF" />
                  <Text style={styles.readyCtaText}>Hikâyen Hazır — Devam Et</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

function PhasePill({ label, active }: { label: string; active: boolean }) {
  const dotAndLabel = (
    <>
      <View style={[styles.phasePillDot, active && styles.phasePillDotActive]} />
      <Text style={[styles.phasePillText, active && styles.phasePillTextActive]}>{label}</Text>
    </>
  );
  if (active) {
    return (
      <LinearGradient
        colors={tabActiveGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.phasePill, styles.phasePillActive]}
      >
        {dotAndLabel}
      </LinearGradient>
    );
  }
  return <View style={styles.phasePill}>{dotAndLabel}</View>;
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: TOKENS.bg,
    overflow: 'hidden',
  },
  bgGlowTop: {
    position: 'absolute',
    top: -160,
    left: '50%',
    marginLeft: -260,
    width: 520,
    height: 360,
    borderRadius: 260,
    backgroundColor: 'rgba(124,58,237,0.22)',
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 380,
    height: 300,
    borderRadius: 190,
    backgroundColor: 'rgba(139,92,246,0.10)',
  },

  page: { flex: 1, width: '100%', maxWidth: 400, paddingHorizontal: 20, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...crossGlow(TOKENS.violet600, 0.5, 14, { width: 0, height: 6 }),
  },
  headerText: { flex: 1, justifyContent: 'center', gap: 3 },
  h1: { color: TOKENS.textHi, fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 22 },
  headerSub: {
    color: TOKENS.textLow,
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
    lineHeight: 16,
  },

  timerArea: { alignItems: 'center' },
  ringWrap: { alignItems: 'center', marginTop: 26, marginBottom: 20 },
  ring: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringHalo: {
    position: 'absolute',
    top: -18,
    left: -18,
    right: -18,
    bottom: -18,
    borderRadius: (RING_SIZE + 36) / 2,
    backgroundColor: TOKENS.violet500,
    opacity: 0.22,
    ...crossGlow(TOKENS.violet500, 0.35, 20),
  },
  ringSvg: { transform: [{ rotate: '-90deg' }] },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNum: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 34, lineHeight: 34 },
  timerUnit: { color: TOKENS.textMid, fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 3 },

  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFillWrap: { height: '100%' },
  progressFill: { flex: 1, borderRadius: 3, ...crossGlow(TOKENS.violet300, 0.6, 6) },

  phaseRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 8, marginBottom: 18 },
  phasePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  phasePillActive: {
    borderColor: 'transparent',
    ...crossGlow(TOKENS.violet600, 0.45, 14, { width: 0, height: 8 }),
  },
  phasePillDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: TOKENS.textLow },
  phasePillDotActive: { backgroundColor: '#FFFFFF' },
  phasePillText: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5, color: TOKENS.textLow },
  phasePillTextActive: { color: '#FFFFFF' },

  contentWrap: { flex: 1, marginBottom: 16 },
  glassCard: {
    flex: 1,
    minHeight: 330,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.28)',
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...crossGlow(TOKENS.violet600, 0.3, 24, { width: 0, height: 14 }),
  },
  phaseCenterWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { color: TOKENS.textHi, fontFamily: 'Inter_700Bold', fontSize: 17, textAlign: 'center' },
  bodyText: { marginTop: 8, fontFamily: 'Inter_400Regular', fontSize: 13.5, lineHeight: 21.6, color: TOKENS.textMid },
  phaseOneBodyText: { alignSelf: 'center', maxWidth: 280, textAlign: 'left' },

  factIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...crossGlow(TOKENS.violet600, 0.6, 18, { width: 0, height: 10 }),
  },
  tipPill: {
    marginTop: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(240,180,41,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240,180,41,0.35)',
    ...crossGlow(TOKENS.amber, 0.4, 12),
  },
  tipPillText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: TOKENS.amber },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, width: '100%' },
  bigWordCard: {
    flex: 1,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bigWordText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 33 },
  bigWordHint: { marginTop: 8, fontFamily: 'Inter_400Regular', fontSize: 11, color: TOKENS.textMid },
  wordDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  wordDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: TOKENS.textLow },
  wordDotActive: { backgroundColor: TOKENS.violet400, transform: [{ scale: 1.3 }] },

  typingBox: {
    flex: 1,
    marginTop: 16,
    minHeight: 140,
    borderRadius: 14,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    width: '100%',
  },
  typingText: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 21 },
  cursor: { color: TOKENS.violet400 },

  bottomSlot: { minHeight: 60, justifyContent: 'flex-end' },

  bottomCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(139,92,246,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCardTitle: { color: TOKENS.textHi, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  bottomCardSub: { marginTop: 2, fontFamily: 'Inter_400Regular', fontSize: 11.5, color: TOKENS.textLow, lineHeight: 15 },

  extendedWait: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(240,180,41,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240,180,41,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(240,180,41,0.3)',
    borderTopColor: TOKENS.amber,
  },
  extendedWaitText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: TOKENS.amber },

  readyGlow: {
    position: 'absolute',
    left: '5%',
    right: '5%',
    top: 6,
    bottom: 0,
    backgroundColor: '#8B5CF6',
    opacity: 0.35,
    borderRadius: 26,
  },
  readyCtaWrap: { position: 'relative' },
  readyCta: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.4)',
  },
  readyCtaText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14 },
});
