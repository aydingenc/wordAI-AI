import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

/**
 * A sequence of steps shown as gradient glass pills with a slim chevron
 * between them, e.g. Hikaye → Quiz → Kelime Kartları.
 *
 * The final step is the "payoff" and is rendered as a solid gradient pill so
 * each card reads as building toward a result (visual hierarchy) instead of a
 * flat list of identical boxes.
 *
 * In the onboarding comparison cards it runs vertically with a tight fixed gap
 * and is top-anchored inside a fixed-height band, so the steps sit close
 * together and both cards' first pills line up even with different step counts.
 */
export function StepFlow({
  steps,
  direction = 'vertical',
  scale = 1,
}: {
  steps: { label: string }[];
  direction?: 'horizontal' | 'vertical';
  scale?: number;
}) {
  const colors = useColors();
  const horizontal = direction === 'horizontal';
  return (
    <View
      style={[
        styles.wrap,
        horizontal ? styles.h : styles.v,
        { gap: (horizontal ? 6 : 2) * scale },
      ]}
    >
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <React.Fragment key={step.label}>
            <LinearGradient
              colors={
                last
                  ? [colors.primaryGlow, colors.glowMagenta]
                  : ['rgba(139, 92, 246, 0.20)', 'rgba(139, 92, 246, 0.05)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.pill,
                {
                  // minWidth widens the short pills (Hikaye/Quiz) for a nicer,
                  // more uniform look; horizontal padding stays modest so the
                  // longest label ("Seçilen Kelimeler") still fits on one line at
                  // 360px (react-native-web ignores adjustsFontSizeToFit).
                  minWidth: 92 * scale,
                  paddingVertical: 6 * scale,
                  paddingHorizontal: 8 * scale,
                  borderColor: last ? 'rgba(233, 213, 255, 0.75)' : PILL_BORDER,
                  shadowColor: colors.primaryGlow,
                },
                last && styles.pillLast,
              ]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    fontSize: 10.5 * scale,
                    // Explicit lineHeight keeps the glyphs vertically centred
                    // inside the pill; without it (with adjustsFontSizeToFit) the
                    // text can crowd/overlap the pill edges, especially on native.
                    lineHeight: 14 * scale,
                    color: last ? '#FFFFFF' : colors.foreground,
                    fontFamily: last ? 'Inter_700Bold' : 'Inter_600SemiBold',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                // Floor low enough that the longest labels ("Seçilen Kelimeler",
                // "Kelime Kartları") shrink to fit rather than ever truncating.
                minimumFontScale={0.7}
              >
                {step.label}
              </Text>
            </LinearGradient>
            {i < steps.length - 1 ? (
              <Feather
                name={horizontal ? 'chevron-right' : 'chevron-down'}
                size={16 * scale}
                color={colors.accent}
                style={styles.chevron}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// Translucent violet glass border so the pill outline glows against the dark
// card, matching the reference design's neon-outlined step boxes.
const PILL_BORDER = 'rgba(196, 158, 255, 0.55)';

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  h: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  v: {
    flexDirection: 'column',
    alignSelf: 'stretch',
  },
  pill: {
    maxWidth: '100%',
    borderWidth: 1.1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 2,
  },
  pillLast: {
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  chevron: {
    opacity: 1,
  },
  label: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
