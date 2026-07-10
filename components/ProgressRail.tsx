import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

const NODES: {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'new', label: 'New', icon: 'sprout' },
  { key: 'learning', label: 'Learning', icon: 'book-open-variant' },
  { key: 'mastered', label: 'Mastered', icon: 'star' },
  { key: 'legendary', label: 'Legendary', icon: 'crown' },
];

/**
 * Horizontal progress rail (New → Learning → Mastered → Legendary).
 * `activeIndex` controls how many nodes are lit — used to sync with the
 * onboarding animation stages.
 */
export function ProgressRail({ activeIndex = 3 }: { activeIndex?: number }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {NODES.map((node, i) => {
        const active = i <= activeIndex;
        return (
          <React.Fragment key={node.key}>
            <View style={styles.node}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: active ? colors.secondary : 'transparent',
                    borderColor: active ? colors.primary : colors.border,
                    shadowColor: colors.primaryGlow,
                  },
                  active && styles.glow,
                ]}
              >
                <MaterialCommunityIcons
                  name={node.icon}
                  size={15}
                  color={active ? colors.accent : colors.mutedForeground}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  { color: active ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {node.label}
              </Text>
            </View>
            {i < NODES.length - 1 ? (
              <View style={styles.connector}>
                <View
                  style={[
                    styles.line,
                    { backgroundColor: active ? colors.primary : colors.border },
                  ]}
                />
                <View
                  style={[
                    styles.midDot,
                    {
                      backgroundColor: active ? colors.primary : colors.border,
                      shadowColor: colors.primaryGlow,
                    },
                    active && styles.glow,
                  ]}
                />
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor:
                        i + 1 <= activeIndex ? colors.primary : colors.border,
                    },
                  ]}
                />
              </View>
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  node: {
    alignItems: 'center',
    gap: 4,
    width: 52,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    textAlign: 'center',
  },
  connector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  line: {
    flex: 1,
    height: 2,
  },
  midDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});
