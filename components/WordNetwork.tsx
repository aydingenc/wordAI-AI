import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

const H = 70;

const SATELLITES = [
  { label: 'like', x: 0.2, y: 0.17 },
  { label: 'heart', x: 0.8, y: 0.17 },
  { label: 'care', x: 0.8, y: 0.82 },
  { label: 'affection', x: 0.34, y: 0.87 },
];

/**
 * Small "living word network" graph: a central word with glowing links to a
 * handful of related words. Sized to fit inside a half-width home card.
 */
export function WordNetwork() {
  const colors = useColors();
  const [w, setW] = useState(0);
  const cx = w * 0.5;
  const cy = H * 0.4;

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {w > 0 ? (
        <>
          <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
            {SATELLITES.map((s) => (
              <Line
                key={`glow-${s.label}`}
                x1={cx}
                y1={cy}
                x2={s.x * w}
                y2={s.y * H}
                stroke={colors.primary}
                strokeWidth={4}
                strokeOpacity={0.22}
                strokeLinecap="round"
              />
            ))}
            {SATELLITES.map((s) => (
              <Line
                key={`l-${s.label}`}
                x1={cx}
                y1={cy}
                x2={s.x * w}
                y2={s.y * H}
                stroke={colors.accent}
                strokeWidth={1.4}
                strokeOpacity={0.9}
                strokeLinecap="round"
              />
            ))}
            {SATELLITES.map((s) => (
              <Circle
                key={`d-${s.label}`}
                cx={s.x * w}
                cy={s.y * H}
                r={2.5}
                fill={colors.accent}
              />
            ))}
          </Svg>

          <View
            style={[
              styles.center,
              {
                left: cx - 25,
                top: cy - 14,
                backgroundColor: colors.primary,
                shadowColor: colors.primaryGlow,
              },
            ]}
          >
            <Text style={styles.centerText}>love</Text>
          </View>

          {SATELLITES.map((s) => (
            <View
              key={s.label}
              style={[
                styles.sat,
                {
                  left: s.x * w - 28,
                  top: s.y * H - 10.5,
                  backgroundColor: colors.secondary,
                  borderColor: colors.primary,
                  shadowColor: colors.primaryGlow,
                },
              ]}
            >
              <Text
                style={[styles.satText, { color: colors.secondaryForeground }]}
                numberOfLines={1}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: H,
    width: '100%',
    position: 'relative',
  },
  center: {
    position: 'absolute',
    width: 50,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  centerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  sat: {
    position: 'absolute',
    width: 56,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 6,
    elevation: 4,
  },
  satText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
});
