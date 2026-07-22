import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlowCard } from '@/components/GlowCard';
import { BlendIcon, FunnelIcon, PlayIcon } from '@/components/WordStatusIcons';
import { useColors } from '@/hooks/useColors';
import { useDialog } from '@/context/DialogContext';
import { ActiveFilter } from '@/components/WordFilterSheet';

export function PracticeSuggestionsPanel({ activeFilters }: { activeFilters: ActiveFilter[] }) {
  const colors = useColors();
  const { showDialog } = useDialog();

  const runPractice = (label: string) => {
    showDialog({ title: label, message: 'Bu özellik demo sürümünde yakında eklenecek.' });
  };

  return (
    <GlowCard active style={styles.panel}>
      <View style={styles.topLine} />
      <Text style={[styles.title, { color: colors.accent }]}>Pratik Yap</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Filtrelere göre kişiselleştirilmiş pratik önerileri.
      </Text>

      {activeFilters.length > 0 ? (
        <View style={styles.pillsRow}>
          {activeFilters.map((f) => (
            <View key={f.key} style={[styles.pill, { backgroundColor: 'rgba(139,92,246,0.14)', borderColor: 'rgba(139,92,246,0.3)' }]}>
              <Text style={[styles.pillText, { color: colors.accent }]}>{f.pillLabel}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {activeFilters.length === 0 ? (
        <View style={[styles.empty, { borderColor: 'rgba(139,92,246,0.25)', backgroundColor: 'rgba(139,92,246,0.04)' }]}>
          <View style={[styles.emptyIcon, { borderColor: 'rgba(139,92,246,0.3)' }]}>
            <FunnelIcon size={18} color={colors.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz bir filtre seçmedin</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Yukarıdan bir durum, kelime türü veya kaynak seç — sana özel pratik seçenekleri burada belirsin.
          </Text>
        </View>
      ) : (
        <View style={styles.ctaList}>
          {activeFilters.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => runPractice(f.btnLabel)}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient colors={['#a78bfa', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                <PlayIcon size={13} />
                <Text style={styles.ctaText} numberOfLines={1}>{f.btnLabel}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      )}

      {activeFilters.length >= 2 ? (
        <Pressable
          onPress={() => runPractice('Harmanlayarak Pratik Yap')}
          style={({ pressed }) => [{ marginTop: 12, opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient colors={['#f472b6', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <BlendIcon size={13} />
            <Text style={styles.ctaText}>Harmanlayarak Pratik Yap</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'relative',
    overflow: 'hidden',
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(196,181,253,0.5)',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    marginTop: 4,
    marginBottom: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10.5,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 18,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.14)',
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14.5,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 260,
  },
  ctaList: {
    gap: 9,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12.5,
    color: '#FFFFFF',
    flexShrink: 1,
  },
});
