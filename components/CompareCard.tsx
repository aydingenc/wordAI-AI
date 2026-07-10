import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { StepFlow } from './StepFlow';

/**
 * Shared vertical grid for the two onboarding comparison cards. Both the
 * "Kelimelerden" and "Görsellerden" cards are built from the SAME skeleton so
 * they read as two variations of one template:
 *
 *   iconBlock → titleBlock → previewBlock → flowBlock → descriptionBlock
 *
 * Every block has a fixed, scaled height (see getCompareMetrics), so equivalent
 * rows in the two cards line up on the same horizontal bands and both cards end
 * at the exact same height — regardless of how many flow steps each one has.
 *
 * Visually the card is a gradient-bordered glass panel with a top light-catch
 * edge and inner vertical depth, rather than a flat outlined box.
 */
const BORDER = 1.3;

export function getCompareMetrics(s: number) {
  const PAD = 10 * s;
  const ICON_H = 32 * s;
  const TITLE_H = 20 * s;
  // Tall preview band so the right card's photo reads as a real, recognizable
  // image (same asset as the "upload a photo" screen) rather than a thin strip.
  // The left card's chips simply centre in the extra room. Both cards share it,
  // so they stay the same height and aligned; the card is NOT made wider.
  const PREVIEW_H = 74 * s;
  // Sized to hold the taller card (4 pills + 3 chevrons) at StepFlow's tight
  // fixed gap, with a little slack. Keep in step with StepFlow's pill/chevron
  // sizes — if those change, this must change too.
  const FLOW_H = 170 * s;
  const DESC_H = 56 * s;
  const B = BORDER * s;
  const CARD_H = PAD * 2 + B * 2 + ICON_H + TITLE_H + PREVIEW_H + FLOW_H + DESC_H;
  // Vertical centre of the flow band, measured from the card's outer top edge
  // (border included). The AI badge is aligned to this so its horizontal
  // connectors exit at the centre of both cards' flow areas.
  const FLOW_CENTER = B + PAD + ICON_H + TITLE_H + PREVIEW_H + FLOW_H / 2;
  return { PAD, ICON_H, TITLE_H, PREVIEW_H, FLOW_H, DESC_H, CARD_H, FLOW_CENTER, BORDER: B };
}

export function CompareCard({
  s,
  glow,
  icon,
  title,
  preview,
  steps,
  description,
  style,
}: {
  s: number;
  glow: boolean;
  icon: React.ReactNode;
  title: string;
  preview: React.ReactNode;
  steps: { label: string }[];
  description: string;
  style?: ViewStyle | ViewStyle[];
}) {
  const colors = useColors();
  const m = getCompareMetrics(s);
  return (
    <LinearGradient
      colors={
        glow
          ? ['rgba(52, 36, 84, 0.96)', 'rgba(28, 19, 46, 0.97)', 'rgba(16, 11, 28, 0.98)']
          : ['rgba(34, 26, 54, 0.9)', 'rgba(20, 14, 33, 0.95)']
      }
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[
        {
          height: m.CARD_H,
          alignSelf: 'stretch',
          padding: m.PAD,
          borderRadius: colors.radius,
          borderWidth: m.BORDER,
          borderColor: glow ? colors.primaryGlow : colors.borderStrong,
          overflow: 'hidden',
          shadowColor: colors.primaryGlow,
        },
        glow && styles.glow,
        style,
      ]}
    >
      {/* Top light-catch edge — a crisp highlight where light hits the glass. */}
      <View pointerEvents="none" style={styles.sheen} />

      {/* A — icon */}
      <View style={{ height: m.ICON_H, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      {/* B — title */}
      <View style={{ height: m.TITLE_H, justifyContent: 'center' }}>
        <Text
          style={[styles.title, { fontSize: 15 * s, color: colors.foreground }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {title}
        </Text>
      </View>
      {/* C — preview (chips or photo) */}
      <View style={{ height: m.PREVIEW_H, alignItems: 'center', justifyContent: 'center' }}>
        {preview}
      </View>
      {/* D — flow steps, tight fixed gap, top-anchored in the band */}
      <View style={{ height: m.FLOW_H }}>
        <StepFlow scale={s} steps={steps} />
      </View>
      {/* E — description */}
      <View style={{ height: m.DESC_H, justifyContent: 'center' }}>
        <Text
          style={[styles.desc, { fontSize: 10.5 * s, lineHeight: 13.5 * s, color: '#E7E1F5' }]}
          numberOfLines={4}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {description}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  glow: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 12,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(245, 243, 255, 0.18)',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
