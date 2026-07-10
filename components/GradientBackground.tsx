import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

/**
 * Atmospheric dark background with soft violet glows in the corners.
 * Pure View-based (no extra deps) so it works everywhere including web.
 */
export function GradientBackground({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  const colors = useColors();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]}>
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          styles.glowTop,
          { backgroundColor: colors.glowViolet },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          styles.glowBottom,
          { backgroundColor: colors.glowMagenta },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    opacity: 0.22,
  },
  glowTop: {
    top: -140,
    right: -120,
  },
  glowBottom: {
    bottom: -160,
    left: -120,
    opacity: 0.16,
  },
});
