import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  ClearIcon,
  SOURCE_META,
  STATUS_META,
  TYPE_META,
  TypeDot,
  WordSourceKey,
  WordTypeKey,
} from '@/components/WordStatusIcons';
import { useColors } from '@/hooks/useColors';
import { WordStatus } from '@/data/mock';

export interface ActiveFilter {
  key: string;
  pillLabel: string;
  btnLabel: string;
}

const STATUS_ORDER: WordStatus[] = ['new', 'learning', 'mastered'];
const TYPE_ORDER: WordTypeKey[] = ['verb', 'noun', 'adjective', 'adverb', 'pronoun'];
const SOURCE_ORDER: WordSourceKey[] = ['own', 'theme', 'image'];

function buildActive(
  status: WordStatus | null,
  types: Set<WordTypeKey>,
  sources: Set<WordSourceKey>,
): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  if (status) {
    const m = STATUS_META[status];
    active.push({ key: `status-${status}`, pillLabel: m.label, btnLabel: `${m.label} Kelimelerle Pratik Yap` });
  }
  types.forEach((t) => {
    const m = TYPE_META[t];
    active.push({ key: `type-${t}`, pillLabel: m.pillLabel, btnLabel: m.btnLabel });
  });
  sources.forEach((s) => {
    const m = SOURCE_META[s];
    active.push({ key: `source-${s}`, pillLabel: m.pillLabel, btnLabel: m.btnLabel });
  });
  return active;
}

export function WordFilterSheet({
  visible,
  onClose,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  onChange: (active: ActiveFilter[]) => void;
}) {
  const colors = useColors();
  const [status, setStatus] = useState<WordStatus | null>(null);
  const [types, setTypes] = useState<Set<WordTypeKey>>(new Set());
  const [sources, setSources] = useState<Set<WordSourceKey>>(new Set());

  const emit = (nextStatus: WordStatus | null, nextTypes: Set<WordTypeKey>, nextSources: Set<WordSourceKey>) => {
    onChange(buildActive(nextStatus, nextTypes, nextSources));
  };

  const toggleStatus = (key: WordStatus) => {
    const next = status === key ? null : key;
    setStatus(next);
    emit(next, types, sources);
  };

  const toggleType = (key: WordTypeKey) => {
    const next = new Set(types);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setTypes(next);
    emit(status, next, sources);
  };

  const toggleSource = (key: WordSourceKey) => {
    const next = new Set(sources);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSources(next);
    emit(status, types, next);
  };

  const clearAll = () => {
    setStatus(null);
    setTypes(new Set());
    setSources(new Set());
    emit(null, new Set(), new Set());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.backgroundElevated, borderColor: 'rgba(139,92,246,0.38)' }]}>
        <View style={[styles.handle, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Filtrele</Text>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>DURUMA GÖRE</Text>
            <View style={[styles.segmented, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: colors.border }]}>
              {STATUS_ORDER.map((key) => {
                const meta = STATUS_META[key];
                const active = status === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleStatus(key)}
                    style={[
                      styles.segment,
                      active && styles.segmentActive,
                    ]}
                  >
                    <meta.Icon size={12} color={active ? meta.color : colors.mutedForeground} />
                    <Text style={[styles.segmentText, { color: active ? meta.color : colors.mutedForeground }]} numberOfLines={1}>
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>KELİME TÜRÜ</Text>
            <View style={styles.chipRow}>
              {TYPE_ORDER.map((key) => {
                const meta = TYPE_META[key];
                const selected = types.has(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleType(key)}
                    style={[
                      styles.chip,
                      { borderColor: colors.border, backgroundColor: colors.cardAlt },
                      selected && { borderColor: 'rgba(139,92,246,0.55)', backgroundColor: 'rgba(139,92,246,0.16)' },
                    ]}
                  >
                    <TypeDot color={meta.color} />
                    <Text style={[styles.chipText, { color: selected ? colors.foreground : colors.mutedForeground }]}>
                      {meta.enLabel}
                    </Text>
                    {selected ? <Text style={[styles.chipCheck, { color: colors.accent }]}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>KAYNAĞA GÖRE</Text>
            <View style={styles.chipRow}>
              {SOURCE_ORDER.map((key) => {
                const meta = SOURCE_META[key];
                const selected = sources.has(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleSource(key)}
                    style={[
                      styles.chip,
                      { borderColor: colors.border, backgroundColor: colors.cardAlt },
                      selected && { borderColor: 'rgba(139,92,246,0.55)', backgroundColor: 'rgba(139,92,246,0.16)' },
                    ]}
                  >
                    <meta.Icon size={12} color={meta.color} />
                    <Text style={[styles.chipText, { color: selected ? colors.foreground : colors.mutedForeground }]}>
                      {meta.pillLabel}
                    </Text>
                    {selected ? <Text style={[styles.chipCheck, { color: colors.accent }]}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable onPress={clearAll} style={[styles.clearRow, { borderColor: 'rgba(255,255,255,0.08)' }]}>
            <ClearIcon size={13} color={colors.mutedForeground} />
            <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Filtreyi Temizle</Text>
          </Pressable>

          <Pressable onPress={onClose} style={[styles.applyBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.applyText}>Uygula</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,3,10,0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '82%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    marginBottom: 16,
  },
  groupLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.4,
    marginBottom: 9,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 9,
  },
  segmentActive: {
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  segmentText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
  },
  chipCheck: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    marginLeft: 2,
  },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginBottom: 14,
  },
  clearText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  applyBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  applyText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
});
