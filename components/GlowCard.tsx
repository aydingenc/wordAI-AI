import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

/**
 * Rounded elevated card with a subtle violet border glow.
 */
export function GlowCard({
  children,
  style,
  active,
  padded = true,
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  active?: boolean;
  padded?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: active ? colors.primary : colors.border,
          borderRadius: colors.radius,
          shadowColor: colors.primaryGlow,
          padding: padded ? 18 : 0,
        },
        active && styles.activeGlow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  activeGlow: {
    shadowOpacity: 0.5,
    shadowRadius: 22,
  },
});
