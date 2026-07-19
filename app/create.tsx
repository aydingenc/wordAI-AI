import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { KelimelerFlow } from '@/components/KelimelerFlow';
import { GorsellerFlow } from '@/components/GorsellerFlow';
import { CategoryChipRow } from '@/components/CategoryChipRow';
import { useColors } from '@/hooks/useColors';
import { getFeaturedGalleryItem } from '@/data/mock';

// Dark translucent interior so the AI ring reads as a floating neon disc.
const AI_FILL = 'rgba(11, 7, 19, 0.72)';
const AI_OUTER_RING = 'rgba(192, 132, 252, 0.55)';
// Premium glass surface — dark translucent fill + hairline violet border.
const GLASS_FILL = 'rgba(28, 20, 50, 0.62)';
const GLASS_BORDER = 'rgba(139, 92, 246, 0.30)';
// Target-word colors — shared with the flow cards.
const GREEN = '#34D399';
const ORANGE = '#FB923C';
// Single source of truth for the KelimelerFlow/GorsellerFlow card height —
// both cards MUST read this same constant so they can never drift apart
// and render at different sizes again.
const FLOW_CARD_HEIGHT = 168;

function withAlpha(hex: string, alpha: string) {
  return hex + alpha;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// Same gallery item the "Hazır Görseller" screen leads with — keeps this
// preview and the gallery card's "Özet" fed from one shared data source.
const FEATURED = getFeaturedGalleryItem();

type St = ReturnType<typeof makeStyles>['st'];

/** Highlighted inline target word inside the example story. */
function HL({ st, color, children }: { st: St; color: string; children: string }) {
  return (
    <Text style={[st.hl, { color, backgroundColor: withAlpha(color, '24') }]}>{children}</Text>
  );
}

/** Slim single-line CTA — small inline icon + label. */
function CardButton({
  st,
  colors,
  icon,
  label,
  onPress,
  testID,
}: {
  st: St;
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  testID?: string;
}) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };
  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        st.ctaCompact,
        {
          backgroundColor: GLASS_FILL,
          borderColor: GLASS_BORDER,
          shadowColor: colors.primaryGlow,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <Feather name={icon} size={16} color={colors.accent} />
      <Text style={[st.ctaLabel, { color: colors.foreground }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const s = useMemo(() => clamp(width / 402, 0.82, 1), [width]);
  const { st, aiDots, HALO } = useMemo(() => makeStyles(s), [s]);

  return (
    <GradientBackground>
      <ScreenHeader />
      <ScrollView
        contentContainerStyle={[st.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={st.hero}>
          <View style={[st.eyebrow, { backgroundColor: GLASS_FILL, borderColor: GLASS_BORDER }]}>
            <Feather name="zap" size={12} color={colors.accent} />
            <Text style={[st.eyebrowText, { color: colors.accent }]}>AI ÖĞRENME MOTORU</Text>
          </View>
          <Text style={[st.title, { color: colors.foreground }]}>Nasıl Öğrenmek İstersin?</Text>
          <Text style={[st.subtitle, { color: colors.mutedForeground }]}>
            Kelimelerle ya da fotoğraflarla kendi İngilizce dersini oluştur. AI ikisini de
            sana özel bir öğrenme akışına dönüştürür.
          </Text>
        </View>

        {/* Diagram — icon + title cards bridged by the glowing AI engine. */}
        <View style={st.cardsRow}>
          <View style={st.cardFlexWide}>
            <View
              style={[
                st.flowCard,
                { backgroundColor: GLASS_FILL, borderColor: GLASS_BORDER, shadowColor: colors.primaryGlow },
              ]}
            >
              <Text style={[st.flowTitle, { color: colors.foreground }]} numberOfLines={1}>
                Kelimelerden
              </Text>
              <KelimelerFlow height={FLOW_CARD_HEIGHT} textColor={colors.foreground} />
            </View>
          </View>

          <View style={st.connectorRow}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0)', colors.primaryGlow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[st.connector, { shadowColor: colors.primaryGlow }]}
            />
            <View style={st.aiStack}>
              <View style={st.aiHalo} pointerEvents="none">
                <Svg width={HALO} height={HALO}>
                  <Defs>
                    <RadialGradient id="aiHaloCreate" cx="50%" cy="50%" r="50%">
                      <Stop offset="0%" stopColor={colors.primaryGlow} stopOpacity="0.55" />
                      <Stop offset="42%" stopColor={colors.glowMagenta} stopOpacity="0.22" />
                      <Stop offset="100%" stopColor={colors.primaryGlow} stopOpacity="0" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={HALO / 2} cy={HALO / 2} r={HALO / 2} fill="url(#aiHaloCreate)" />
                </Svg>
              </View>
              <View
                style={[st.aiOuterRing, { borderColor: AI_OUTER_RING, shadowColor: colors.primaryGlow }]}
              />
              {aiDots.map((d, i) => (
                <View
                  key={i}
                  style={[
                    st.aiDot,
                    { top: d.top, left: d.left, backgroundColor: colors.accent, shadowColor: colors.primaryGlow },
                  ]}
                />
              ))}
              <LinearGradient
                colors={[colors.accent, colors.primary, colors.glowMagenta]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[st.aiCircle, { shadowColor: colors.primaryGlow }]}
              >
                <View style={[st.aiCore, { backgroundColor: AI_FILL }]}>
                  <MaterialCommunityIcons name="brain" size={20 * s} color={colors.accent} />
                  <Text style={[st.aiText, { color: colors.foreground }]}>AI</Text>
                  <Text style={[st.aiSub, { color: colors.accent }]}>LEARNING{'\n'}ENGINE</Text>
                </View>
              </LinearGradient>
            </View>
            <LinearGradient
              colors={[colors.primaryGlow, 'rgba(168, 85, 247, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[st.connector, { shadowColor: colors.primaryGlow }]}
            />
          </View>

          <View style={st.cardFlexWide}>
            <View
              style={[
                st.flowCard,
                { backgroundColor: GLASS_FILL, borderColor: GLASS_BORDER, shadowColor: colors.primaryGlow },
              ]}
            >
              <Text style={[st.flowTitle, { color: colors.foreground }]} numberOfLines={1}>
                Görsellerden
              </Text>
              <GorsellerFlow height={FLOW_CARD_HEIGHT} textColor={colors.foreground} />
            </View>
          </View>
        </View>

        {/* One action per card, aligned beneath its column. */}
        <View style={st.buttonsRow}>
          <View style={st.cardFlexWide}>
            <CardButton
              st={st}
              colors={colors}
              icon="edit-3"
              label="Öğren"
              onPress={() => router.push('/words-entry')}
              testID="create-words"
            />
          </View>
          <View style={st.buttonsSpacer} />
          <View style={st.cardFlexWide}>
            <CardButton
              st={st}
              colors={colors}
              icon="camera"
              label="Öğren"
              onPress={() => router.push('/images-info')}
              testID="create-images"
            />
          </View>
        </View>

        <View style={st.dividerRow}>
          <View style={[st.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[st.dividerText, { color: colors.mutedForeground }]}>veya</Text>
          <View style={[st.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View
          style={[
            st.themesCard,
            {
              backgroundColor: GLASS_FILL,
              borderColor: GLASS_BORDER,
              shadowColor: colors.primaryGlow,
            },
          ]}
        >
          <View style={st.themesHeader}>
            <LinearGradient
              colors={[colors.primary, colors.glowMagenta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[st.ctaBadge, st.ctaBadgeWide, { shadowColor: colors.primaryGlow }]}
            >
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={24}
                color={colors.primaryForeground}
              />
            </LinearGradient>
            <View style={st.ctaTextWide}>
              <Text style={[st.ctaLabel, st.ctaLabelWide, { color: colors.foreground }]} numberOfLines={1}>
                Hazır Temalardan Öğren
              </Text>
              <Text style={[st.ctaSub, { color: colors.accent }]}>Gerçek hayat hikayeleri</Text>
            </View>
            <Pressable
              testID="create-gallery-all"
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/images-gallery');
              }}
              style={[st.ctaChevron, { borderColor: GLASS_BORDER }]}
              accessibilityRole="button"
              accessibilityLabel="Hazır temalardan öğren"
            >
              <Feather name="arrow-right" size={18} color={colors.accent} />
            </Pressable>
          </View>

          <View style={[st.storyBlock, { borderColor: colors.border }]}>
            <Text style={[st.storyEn, { color: colors.foreground }]}>
              {FEATURED.preview.before}
              <HL st={st} color={GREEN}>{FEATURED.preview.wordA}</HL>
              {FEATURED.preview.middle}
              <HL st={st} color={ORANGE}>{FEATURED.preview.wordB}</HL>
              {FEATURED.preview.after}
            </Text>
            <Text style={[st.storyTr, { color: colors.mutedForeground }]}>
              {FEATURED.preview.tr}
            </Text>
          </View>

          <CategoryChipRow
            activeId={null}
            showAll={false}
            variant="photo"
            onSelect={(id) => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push(id ? { pathname: '/images-gallery', params: { category: id } } : '/images-gallery');
            }}
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

function makeStyles(s: number) {
  const AI_CIRCLE = 72 * s;
  const AI_RING = 84 * s;
  const AI_DOT = Math.max(4, 5 * s);
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
      paddingHorizontal: 18,
      paddingTop: 4,
      gap: 18,
    },
    hero: {
      alignItems: 'center',
      gap: 12,
    },
    eyebrow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
    },
    eyebrowText: {
      fontFamily: 'Inter_700Bold',
      fontSize: 11,
      letterSpacing: 1.4,
    },
    title: {
      fontFamily: 'Inter_700Bold',
      fontSize: 27,
      lineHeight: 32,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    subtitle: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14.5,
      lineHeight: 21,
      textAlign: 'center',
      paddingHorizontal: 6,
    },
    // Diagram row
    cardsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardFlex: {
      flex: 1,
    },
    cardFlexWide: {
      flex: 1.3,
    },
    flowCard: {
      borderRadius: 22,
      borderWidth: 1,
      minHeight: 236,
      paddingVertical: 18,
      paddingHorizontal: 10,
      alignItems: 'stretch',
      gap: 12,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 18,
      elevation: 6,
    },
    flowTitle: {
      fontFamily: 'Inter_700Bold',
      fontSize: 15,
      letterSpacing: 0,
      textAlign: 'center',
    },
    connectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 10,
    },
    connector: {
      width: 10 * s,
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
      fontSize: 17 * s,
      lineHeight: 19 * s,
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
    // CTAs
    buttonsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    buttonsSpacer: {
      width: 104 * s,
    },
    ctaCompact: {
      flex: 1,
      flexDirection: 'row',
      borderRadius: 14,
      borderWidth: 1,
      paddingVertical: 11,
      paddingHorizontal: 12,
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 4,
    },
    themesCard: {
      borderRadius: 20,
      borderWidth: 1,
      paddingTop: 15,
      paddingBottom: 14,
      paddingHorizontal: 16,
      gap: 13,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
      elevation: 6,
    },
    themesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    storyBlock: {
      borderTopWidth: 1,
      paddingTop: 12,
      gap: 5,
    },
    storyEn: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13.5,
      lineHeight: 20,
    },
    storyTr: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12.5,
      lineHeight: 18,
      fontStyle: 'italic',
    },
    hl: {
      fontFamily: 'Inter_700Bold',
      borderRadius: 3,
    },
    ctaBadge: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
    ctaBadgeWide: {
      width: 52,
      height: 52,
      borderRadius: 17,
    },
    ctaTextWide: {
      flex: 1,
      gap: 2,
    },
    ctaLabel: {
      fontFamily: 'Inter_700Bold',
      fontSize: 13.5,
      lineHeight: 18,
      textAlign: 'center',
      letterSpacing: 0.1,
    },
    ctaLabelWide: {
      fontSize: 16.5,
      textAlign: 'left',
    },
    ctaSub: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12.5,
      lineHeight: 17,
    },
    ctaChevron: {
      width: 34,
      height: 34,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    dividerLine: {
      flex: 1,
      height: 1,
    },
    dividerText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12.5,
      letterSpacing: 0.5,
    },
  });

  return { st, aiDots, HALO };
}
