import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Logo } from '@/components/Logo';
import { ProgressRail } from '@/components/ProgressRail';
import { CompareCard, getCompareMetrics } from '@/components/CompareCard';
import { AnimatedReveal, AnimatedPop } from '@/components/AnimatedReveal';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { IMAGES } from '@/data/mock';

// Stage order (source of truth):
// 1 header, 2 left card, 3 right card, 4 AI circle, 5 info card 1,
// 6 info card 2, 7 progress rail, 8 "Devam Et" button.
const STAGE_DELAYS = [300, 600, 900, 1200, 1600, 1950, 2300, 2700];

// Neon glass border used for chips — the fill is a LinearGradient; this is the
// glowing violet outline against the dark card.
const CHIP_BORDER = 'rgba(196, 158, 255, 0.65)';

// Dark translucent interior so the AI ring reads as a floating neon disc.
const AI_FILL = 'rgba(11, 7, 19, 0.72)';
const AI_OUTER_RING = 'rgba(192, 132, 252, 0.55)';

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [stage, setStage] = useState(0);
  const { onboarded } = useProgress();

  // Returning user: skip the onboarding animation entirely instead of
  // showing it again on every cold start (WL-019). SplashGate in
  // app/_layout.tsx already waits for hydration, so `onboarded` here is
  // never a stale pre-load default.
  useEffect(() => {
    if (onboarded) {
      router.replace('/home');
    }
  }, [onboarded, router]);

  useEffect(() => {
    if (onboarded) return;
    const timers = STAGE_DELAYS.map((delay, i) =>
      setTimeout(() => setStage((s) => Math.max(s, i + 1)), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [onboarded]);

  if (onboarded) return null;

  // Rail lights up progressively as later stages fire (stages 4→7).
  const railActive = Math.min(3, Math.max(-1, stage - 4));

  // Responsive compaction. The whole screen must fit without scrolling, so we
  // derive a single scale factor from the available height AND width and shrink
  // every font/size/gap proportionally. Width is folded in so narrow phones
  // also shrink text enough that step labels never truncate.
  const availH = height - insets.top - insets.bottom;
  const s = useMemo(
    () => clamp(Math.min(availH / 860, width / 402), 0.7, 1),
    [availH, width],
  );

  const { st, aiDots, HALO } = useMemo(() => makeStyles(s), [s]);

  return (
    <GradientBackground>
      <View
        style={[
          st.content,
          { paddingTop: insets.top + 6 * s, paddingBottom: insets.bottom + 8 * s },
        ]}
      >
        {/* Stage 1 — brand + headline */}
        <AnimatedReveal visible={stage >= 1}>
          <View style={st.brandRow}>
            <Logo size={19 * s} />
          </View>
          <Text style={[st.headline, { color: colors.foreground }]}>
            Nasıl{'\n'}Öğrenmek{' '}
            <Text
              style={[
                st.headlineAccent,
                { color: colors.accent, textShadowColor: colors.primaryGlow },
              ]}
            >
              İstersin?
            </Text>
          </Text>
          <Text style={[st.subtitle, { color: colors.foreground }]}>
            Kelimelerle ya da fotoğraflarla kendi İngilizce dersini oluştur.
          </Text>
        </AnimatedReveal>

        {/* Two learning cards; the AI engine is absolutely positioned between
            them (stage 4) so it never takes flow space or narrows the cards. */}
        <View style={st.cardsBlock}>
          <View style={st.cardsRow}>
            {/* Stage 2 — left card (Kelimelerden) */}
            <AnimatedReveal visible={stage >= 2} style={st.cardFlex}>
              <CompareCard
                s={s}
                glow={stage >= 2}
                icon={
                  <MaterialCommunityIcons
                    name="bullseye-arrow"
                    size={34 * s}
                    color={colors.accent}
                    style={[st.cardIconBare, { textShadowColor: colors.primaryGlow }]}
                  />
                }
                title="Kelimelerden"
                preview={
                  <View style={st.miniChips}>
                    {['love', 'travel', 'airport'].map((c) => (
                      <LinearGradient
                        key={c}
                        colors={['rgba(168, 85, 247, 0.28)', 'rgba(139, 92, 246, 0.10)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[st.miniChip, { borderColor: CHIP_BORDER }]}
                      >
                        <Text
                          style={[st.miniChipText, { color: colors.foreground }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {c}
                        </Text>
                      </LinearGradient>
                    ))}
                  </View>
                }
                steps={[
                  { label: 'Hikaye' },
                  { label: 'Quiz' },
                  { label: 'Kelime Kartları' },
                ]}
                description="Kendi kelimelerini gir, AI seviyene göre hikaye oluştursun."
              />
            </AnimatedReveal>

            {/* Stage 3 — right card (Görsellerden) */}
            <AnimatedReveal visible={stage >= 3} style={st.cardFlex}>
              <CompareCard
                s={s}
                glow={stage >= 3}
                icon={
                  <Feather
                    name="camera"
                    size={30 * s}
                    color={colors.accent}
                    style={[st.cardIconBare, { textShadowColor: colors.primaryGlow }]}
                  />
                }
                title="Görsellerden"
                preview={<Image source={IMAGES.nature} style={st.cardImage} />}
                steps={[
                  { label: 'Fotoğraf' },
                  { label: 'AI Analizi' },
                  { label: 'Seçilen Kelimeler' },
                  { label: 'Hikaye + Quiz' },
                ]}
                description="Bir fotoğraf yükle, AI onu kişisel İngilizce dersine dönüştürsün."
              />
            </AnimatedReveal>
          </View>

          {/* Stage 4 — center AI engine badge. Absolute overlay pinned near the
              first-pill row so it bridges the two cards without narrowing them. */}
          <AnimatedPop visible={stage >= 4} style={st.aiCircleWrap}>
            <View style={st.connectorRow}>
              <View
                style={[st.connectorNode, { backgroundColor: colors.accent, shadowColor: colors.primaryGlow }]}
              />
              <LinearGradient
                colors={['rgba(168, 85, 247, 0)', colors.primaryGlow]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[st.connector, { shadowColor: colors.primaryGlow }]}
              />
              <View style={st.aiStack}>
                {/* Soft radial halo — makes the engine read as a glowing core. */}
                <View style={st.aiHalo} pointerEvents="none">
                  <Svg width={HALO} height={HALO}>
                    <Defs>
                      <RadialGradient id="aiHalo" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor={colors.primaryGlow} stopOpacity="0.55" />
                        <Stop offset="42%" stopColor={colors.glowMagenta} stopOpacity="0.22" />
                        <Stop offset="100%" stopColor={colors.primaryGlow} stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Circle cx={HALO / 2} cy={HALO / 2} r={HALO / 2} fill="url(#aiHalo)" />
                  </Svg>
                </View>
                {/* Faint outer orbit ring */}
                <View
                  style={[st.aiOuterRing, { borderColor: AI_OUTER_RING, shadowColor: colors.primaryGlow }]}
                />
                {/* Perimeter dot markers */}
                {aiDots.map((d, i) => (
                  <View
                    key={i}
                    style={[
                      st.aiDot,
                      { top: d.top, left: d.left, backgroundColor: colors.accent, shadowColor: colors.primaryGlow },
                    ]}
                  />
                ))}
                {/* Gradient ring core with dark glass interior */}
                <LinearGradient
                  colors={[colors.accent, colors.primary, colors.glowMagenta]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[st.aiCircle, { shadowColor: colors.primaryGlow }]}
                >
                  <View style={[st.aiCore, { backgroundColor: AI_FILL }]}>
                    <MaterialCommunityIcons name="brain" size={18 * s} color={colors.accent} />
                    <Text style={[st.aiText, { color: colors.foreground }]}>AI</Text>
                    <Text style={[st.aiSub, { color: colors.accent }]}>
                      LEARNING{'\n'}ENGINE
                    </Text>
                  </View>
                </LinearGradient>
              </View>
              <LinearGradient
                colors={[colors.primaryGlow, 'rgba(168, 85, 247, 0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[st.connector, { shadowColor: colors.primaryGlow }]}
              />
              <View
                style={[st.connectorNode, { backgroundColor: colors.accent, shadowColor: colors.primaryGlow }]}
              />
            </View>
          </AnimatedPop>
        </View>

        {/* Stage 5 — info card 1. This card carries the flexible space (marginTop
            auto), so the info-cards + progress-rail cluster is pushed DOWN to sit
            just above the "Devam Et" button instead of leaving a gap below it. */}
        <AnimatedReveal visible={stage >= 5} style={st.infoGroupTop}>
          <View
            style={[
              st.infoCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
                borderRadius: colors.radius,
                shadowColor: colors.primaryGlow,
              },
              st.cardGlow,
            ]}
          >
            <View style={[st.infoIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="sparkles" size={14 * s} color={colors.accent} />
            </View>
            <Text style={[st.infoTitle, { color: colors.foreground }]}>
              İster{' '}
              <Text style={{ color: colors.accent }}>kelimelerle</Text>. İster{' '}
              <Text style={{ color: colors.accent }}>fotoğraflarla</Text>.
            </Text>
          </View>
        </AnimatedReveal>

        {/* Stage 6 — info card 2 */}
        <AnimatedReveal visible={stage >= 6}>
          <View
            style={[
              st.infoCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
                borderRadius: colors.radius,
                shadowColor: colors.primaryGlow,
              },
              st.cardGlow,
            ]}
          >
            <View style={[st.infoIcon, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name="brain" size={15 * s} color={colors.accent} />
            </View>
            <Text style={[st.infoTitle, { color: colors.foreground }]}>
              Öğrenme sana{' '}
              <Text style={{ color: colors.accent }}>uyum sağlar</Text>.
            </Text>
          </View>
        </AnimatedReveal>

        {/* Stage 7 — progress rail */}
        <AnimatedReveal visible={stage >= 7} style={st.railWrap}>
          <ProgressRail activeIndex={railActive} />
        </AnimatedReveal>

        {/* Stage 8 — Devam Et (revealed only after all stages), pinned to the
            bottom of the screen via marginTop:auto so it always stays on-screen. */}
        <AnimatedReveal visible={stage >= 8} style={st.footer}>
          <View style={st.dots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  st.dot,
                  {
                    backgroundColor: i === 3 ? colors.primary : colors.borderStrong,
                    width: i === 3 ? 20 * s : 6 * s,
                  },
                ]}
              />
            ))}
          </View>
          <PrimaryButton
            label="Devam Et"
            icon="arrow-right"
            onPress={() => router.push('/auth')}
            testID="onboarding-continue"
          />
        </AnimatedReveal>
      </View>
    </GradientBackground>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// Builds every size/spacing scaled by `s` so the layout collapses to fit a
// single screen on small devices. AI badge geometry (ring/dots) is derived
// here too so the perimeter dots track the scaled ring.
function makeStyles(s: number) {
  const m = getCompareMetrics(s);
  const AI_CIRCLE = 80 * s;
  const AI_RING = 94 * s;
  const AI_DOT = Math.max(4, 5 * s);
  // Soft radial glow behind the core, ~2x the ring so light bleeds onto cards.
  const HALO = AI_RING * 2.15;
  const AI_RING_THICKNESS = 2.6 * s;
  const aiDots = Array.from({ length: 8 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 8;
    const r = AI_CIRCLE / 2 + 4 * s;
    const center = AI_RING / 2;
    return {
      top: center + Math.sin(angle) * r - AI_DOT / 2,
      left: center + Math.cos(angle) * r - AI_DOT / 2,
    };
  });

  const st = StyleSheet.create({
    content: {
      flex: 1,
      paddingHorizontal: 18,
      gap: 8 * s,
    },
    brandRow: {
      alignItems: 'center',
      marginBottom: 2 * s,
    },
    headline: {
      fontFamily: 'Inter_700Bold',
      fontSize: 29 * s,
      lineHeight: 34 * s,
      textAlign: 'center',
      letterSpacing: -0.6,
    },
    headlineAccent: {
      fontFamily: 'Inter_700Bold',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 16,
    },
    subtitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 16 * s,
      lineHeight: 21 * s,
      textAlign: 'center',
      marginTop: 10 * s,
      paddingHorizontal: 8,
    },
    cardsBlock: {
      // Auto top margin: pairs with the info-group's auto margin so the spare
      // vertical space splits above and below the cards, nudging them down into
      // a more vertically-centred position instead of hugging the header.
      marginTop: 'auto',
      position: 'relative',
      // Both cards share one computed height so the row is a fixed, known band
      // and the absolute AI badge can be aligned to the flow centre.
      height: m.CARD_H,
    },
    cardsRow: {
      flexDirection: 'row',
      // Wide channel for the AI badge, which sits IN the gap (not overlapping
      // the cards). Both cards are the same computed height (see CompareCard).
      gap: 96 * s,
      alignItems: 'stretch',
    },
    cardFlex: {
      flex: 1,
    },
    cardGlow: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 22,
      elevation: 10,
    },
    cardIconBare: {
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 18,
    },
    miniChips: {
      flexDirection: 'row',
      // Single row. Chips are sized small enough to fit one line at the target
      // widths (react-native-web ignores adjustsFontSizeToFit, so we can't rely
      // on font-shrink here — the base size itself must fit). flexShrink is a
      // last-resort safety only.
      flexWrap: 'nowrap',
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2.5 * s,
    },
    miniChip: {
      flexShrink: 1,
      borderRadius: 999,
      borderWidth: 1.2,
      paddingHorizontal: 4 * s,
      paddingVertical: 3.5 * s,
    },
    miniChipText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 8.5 * s,
      letterSpacing: 0.1,
    },
    cardImage: {
      width: '100%',
      height: 72 * s,
      borderRadius: 10,
    },
    // Absolute overlay filling the cards row; the badge is pinned near the
    // first-pill row so its widest part overlaps only the short upper pills,
    // leaving the longer lower pills fully readable.
    aiCircleWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: m.CARD_H,
      alignItems: 'center',
      // Pin the badge so its centre lands on the flow band centre of both
      // cards; the horizontal connectors then exit at the flow centre.
      justifyContent: 'flex-start',
      paddingTop: m.FLOW_CENTER - AI_RING / 2,
      zIndex: 10,
    },
    connectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    connector: {
      width: 17 * s,
      height: 2.5,
      borderRadius: 2,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.95,
      shadowRadius: 7,
      elevation: 4,
    },
    aiHalo: {
      position: 'absolute',
      width: HALO,
      height: HALO,
      top: (AI_RING - HALO) / 2,
      left: (AI_RING - HALO) / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    connectorNode: {
      width: 8 * s,
      height: 8 * s,
      borderRadius: 4 * s,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 5,
    },
    aiStack: {
      width: AI_RING,
      height: AI_RING,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiOuterRing: {
      position: 'absolute',
      width: AI_RING,
      height: AI_RING,
      borderRadius: AI_RING / 2,
      borderWidth: 1.5,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 14,
      elevation: 6,
    },
    aiDot: {
      position: 'absolute',
      width: AI_DOT,
      height: AI_DOT,
      borderRadius: AI_DOT / 2,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 6,
    },
    aiCircle: {
      width: AI_CIRCLE,
      height: AI_CIRCLE,
      borderRadius: AI_CIRCLE / 2,
      padding: AI_RING_THICKNESS,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 26,
      elevation: 14,
    },
    aiCore: {
      width: AI_CIRCLE - AI_RING_THICKNESS * 2,
      height: AI_CIRCLE - AI_RING_THICKNESS * 2,
      borderRadius: (AI_CIRCLE - AI_RING_THICKNESS * 2) / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiText: {
      fontFamily: 'Inter_700Bold',
      fontSize: 16 * s,
      lineHeight: 18 * s,
      letterSpacing: 0.5,
      marginTop: 1,
    },
    aiSub: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 7 * s,
      textAlign: 'center',
      lineHeight: 8.5 * s,
      letterSpacing: 0.8,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11 * s,
      borderWidth: 1.5,
      paddingVertical: 11 * s,
      paddingHorizontal: 14 * s,
    },
    infoIcon: {
      width: 30 * s,
      height: 30 * s,
      borderRadius: 15 * s,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoTitle: {
      flex: 1,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13 * s,
      lineHeight: 17 * s,
    },
    railWrap: {
      marginTop: 6 * s,
      alignItems: 'center',
    },
    footer: {
      paddingTop: 12 * s,
    },
    infoGroupTop: {
      // Absorbs the screen's spare vertical space so the info cards + rail sit
      // close to the button rather than floating with a gap beneath the rail.
      marginTop: 'auto',
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 5 * s,
      marginBottom: 8 * s,
    },
    dot: {
      height: 6 * s,
      borderRadius: 3,
    },
  });

  return { st, aiDots, HALO };
}
