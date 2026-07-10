import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { APP_NAME } from '@/constants/app';

/**
 * Infinity-style brand mark (two overlapping glowing rings) + app name.
 */
export function Logo({ showName = true, size = 26 }: { showName?: boolean; size?: number }) {
  const colors = useColors();
  const ring = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primaryGlow,
  };
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <View style={[styles.ring, ring]} />
        <View style={[styles.ring, ring, { marginLeft: -size / 3 }]} />
      </View>
      {showName ? (
        <Text style={[styles.name, { color: colors.foreground }]}>{APP_NAME}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ring: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    letterSpacing: 0.5,
  },
});
