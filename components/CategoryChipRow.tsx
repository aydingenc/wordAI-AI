import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GALLERY_CATEGORIES, type GalleryCategory } from '@/data/mock';

const VIOLET_300 = '#A78BFA';
const VIOLET_600 = '#7C3AED';

// Accent dots for the "photo" variant — cycles the same palette used
// elsewhere for themed thumbnails (flow cards, old theme marquee).
const ACCENTS = ['#34D399', '#60A5FA', '#FB923C', '#C084FC', '#F472B6'];

function withAlpha(hex: string, alpha: string) {
  return hex + alpha;
}

/**
 * Horizontal scrollable category pill row backed by GALLERY_CATEGORIES —
 * shared by the home screen's "Hazır Temalardan Öğren" shortcuts and the
 * gallery screen's filter bar so both stay on the same data/order and
 * navigation behavior. The two contexts want different pill visuals, so
 * pick with `variant`:
 * - 'flat'  — icon + label pill (gallery filter bar)
 * - 'photo' — photo/gradient thumbnail + color dot + label (home shortcuts)
 */
export function CategoryChipRow({
  activeId,
  onSelect,
  showAll = true,
  categories = GALLERY_CATEGORIES,
  variant = 'flat',
}: {
  activeId: string | null;
  onSelect: (id: string | null) => void;
  showAll?: boolean;
  categories?: GalleryCategory[];
  variant?: 'flat' | 'photo';
}) {
  const ChipComponent = variant === 'photo' ? PhotoChip : FlatChip;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={variant === 'photo' ? photoStyles.row : flatStyles.row}
    >
      {showAll ? (
        <ChipComponent label="Tümü" icon="apps" color={ACCENTS[0]} active={activeId === null} onPress={() => onSelect(null)} />
      ) : null}
      {categories.map((cat, i) => (
        <ChipComponent
          key={cat.id}
          label={cat.name}
          icon={cat.icon}
          color={ACCENTS[i % ACCENTS.length]}
          active={activeId === cat.id}
          onPress={() => onSelect(cat.id)}
        />
      ))}
    </ScrollView>
  );
}

interface ChipProps {
  label: string;
  icon: string;
  color: string;
  active: boolean;
  onPress: () => void;
}

function FlatChip({ label, icon, active, onPress }: ChipProps) {
  return (
    <Pressable onPress={onPress}>
      {active ? (
        <LinearGradient
          colors={[VIOLET_300, VIOLET_600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={flatStyles.chip}
        >
          <MaterialCommunityIcons name={icon as never} size={14} color="#FFFFFF" />
          <Text style={flatStyles.chipTextActive}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={[flatStyles.chip, flatStyles.chipInactive]}>
          <MaterialCommunityIcons name={icon as never} size={14} color={VIOLET_300} />
          <Text style={flatStyles.chipText}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Photo-thumbnail + color dot + label — matches the original theme mockup style. */
function PhotoChip({ label, icon, color, active, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[photoStyles.chip, { borderColor: withAlpha(color, active ? 'AA' : '55') }]}
    >
      {/* TODO: replace this gradient+icon thumbnail with a real category photo once available */}
      <LinearGradient
        colors={[VIOLET_300, VIOLET_600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={photoStyles.thumb}
      >
        <MaterialCommunityIcons name={icon as never} size={13} color="#FFFFFF" />
      </LinearGradient>
      <View style={[photoStyles.dot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={photoStyles.name} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const flatStyles = StyleSheet.create({
  row: { gap: 8, paddingRight: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, borderRadius: 18, paddingHorizontal: 14 },
  chipInactive: { borderWidth: 1, borderColor: 'rgba(167,139,250,0.28)', backgroundColor: 'rgba(8,4,18,0.72)' },
  chipText: { color: '#DDD6FE', fontFamily: 'Inter_500Medium', fontSize: 12 },
  chipTextActive: { color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 12 },
});

const photoStyles = StyleSheet.create({
  row: { gap: 9, paddingRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  thumb: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12.5,
    color: 'rgba(233, 224, 255, 0.92)',
    letterSpacing: 0.2,
  },
});
