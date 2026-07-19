import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeWord } from '@/data/mock';

export type PracticeMethodId = 'flashcards' | 'match' | 'fillblank' | 'memory' | 'speed';

export interface PracticeMethodsScreenProps {
  learnedWords: string[];
  storyTitle: string;
  onClose: () => void;
  onSelectMethod: (methodId: PracticeMethodId) => void;
}

const TOKENS = {
  bg: '#08070D',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  textHi: '#F5F3FF',
  textMid: '#B9B3D1',
  textLow: '#6F6A8A',
};

function pick(words: string[], i: number, fallback: string) {
  return words[i % words.length] ?? fallback;
}

export function PracticeMethodsScreen({ learnedWords, storyTitle, onClose, onSelectMethod }: PracticeMethodsScreenProps) {
  const insets = useSafeAreaInsets();
  const words = learnedWords.length > 0 ? learnedWords : ['adventure', 'journey', 'luggage', 'passport', 'gate'];
  const wA = pick(words, 0, 'adventure');
  const wB = pick(words, 1, 'journey');
  const wC = pick(words, 2, 'luggage');
  const wD = pick(words, 3, 'passport');
  const trB = makeWord(wB).tr;
  const trD = makeWord(wD).tr;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Feather name="x" size={16} color="#A3A0B8" />
      </Pressable>

      <Text style={styles.title}>Bu {words.length} Kelimenin Uzmanı Ol</Text>
      <Text style={styles.sub}>"{storyTitle}" hikâyesinden öğrendiğin kelimeleri farklı yöntemlerle tekrar edebilirsin:</Text>

      <View style={styles.wordChipRow}>
        {words.map((word) => (
          <View key={word} style={styles.wordChip}>
            <Text style={styles.wordChipText}>{word}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <MethodCard
          recommended
          iconBg="rgba(139,92,246,0.16)"
          icon={<MaterialCommunityIcons name="cards-outline" size={22} color="#A78BFA" />}
          title="Kelime Kartlarıyla Pekiştir"
          onPress={() => onSelectMethod('flashcards')}
        >
          <Text style={styles.desc}>
            <Text style={styles.descHl}>{wA}</Text> kartını çevir, anlamını hatırla — klasik ve hızlı tekrar.
          </Text>
        </MethodCard>

        <MethodCard
          iconBg="rgba(96,165,250,0.16)"
          icon={<Feather name="shuffle" size={20} color="#60A5FA" />}
          title="Kelime Eşleştir"
          onPress={() => onSelectMethod('match')}
        >
          <Text style={styles.desc}>
            <Text style={styles.descHl}>{wB}</Text> ↔ {trB}, <Text style={styles.descHl}>{wC}</Text> ↔ {makeWord(wC).tr} gibi eşleştir.
          </Text>
        </MethodCard>

        <MethodCard
          iconBg="rgba(74,222,128,0.16)"
          icon={<Feather name="align-left" size={20} color="#4ADE80" />}
          title="Cümle Tamamlama"
          onPress={() => onSelectMethod('fillblank')}
        >
          <Text style={styles.desc}>
            Cümledeki boşluğa doğru kelimeyi ("<Text style={styles.descHl}>{wD}</Text>" gibi) yerleştir.
          </Text>
        </MethodCard>

        <MethodCard
          iconBg="rgba(248,113,113,0.16)"
          icon={<MaterialCommunityIcons name="cards" size={20} color="#F87171" />}
          title="Hafıza Oyunu"
          onPress={() => onSelectMethod('memory')}
        >
          <Text style={styles.desc}>
            <Text style={styles.descHl}>{wB}</Text> ve <Text style={styles.descHl}>{wD}</Text> gibi eşleşen kartları bul.
          </Text>
        </MethodCard>

        <MethodCard
          iconBg="rgba(250,204,21,0.16)"
          icon={<Feather name="zap" size={20} color="#FACC15" />}
          title="Hızlı Tekrar"
          onPress={() => onSelectMethod('speed')}
        >
          <Text style={styles.desc}>Tüm {words.length} kelimeyi süreye karşı hızlıca tekrar et.</Text>
        </MethodCard>
      </ScrollView>
    </View>
  );
}

function MethodCard({
  recommended,
  iconBg,
  icon,
  title,
  onPress,
  children,
}: {
  recommended?: boolean;
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable style={[styles.methodCard, recommended && styles.methodCardRecommended]} onPress={onPress}>
      <View style={[styles.methodIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.methodText}>
        <View style={styles.methodTitleRow}>
          <Text style={styles.methodTitle}>{title}</Text>
          {recommended ? (
            <View style={styles.methodBadge}>
              <Text style={styles.methodBadgeText}>ÖNERİLEN</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.desc}>{children}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={TOKENS.textLow} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: TOKENS.bg, paddingHorizontal: 20 },
  closeBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },

  title: { fontFamily: 'Inter_700Bold', fontSize: 22, color: TOKENS.textHi, marginBottom: 6 },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 12.5, color: TOKENS.textMid, lineHeight: 18, marginBottom: 6 },

  wordChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  wordChip: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.14)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.35)' },
  wordChipText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#4ADE80' },

  scroll: { flex: 1 },
  scrollContent: { gap: 12, paddingBottom: 20 },

  methodCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  methodCardRecommended: { borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.06)' },
  methodIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodText: { flex: 1 },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  methodTitle: { fontFamily: 'Inter_700Bold', fontSize: 14.5, color: TOKENS.textHi },
  methodBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: '#FDE047' },
  methodBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 8.5, color: '#5C3D00' },
  desc: { fontFamily: 'Inter_400Regular', fontSize: 11, color: TOKENS.textLow, lineHeight: 16 },
  descHl: { color: TOKENS.violet400, fontFamily: 'Inter_600SemiBold' },
});
