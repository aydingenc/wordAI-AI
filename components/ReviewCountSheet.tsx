import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

/** "Kelime Durumu Nasıl Belirlenir?" explainer — shared by the all-words screen and the Kelime Kartları hub. */
export function ReviewCountSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.explainSheet, { backgroundColor: colors.backgroundElevated, borderColor: 'rgba(139,92,246,0.38)' }]}>
        <View style={[styles.handle, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Kelime Durumu Nasıl Belirlenir?</Text>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.explainP, { color: colors.mutedForeground }]}>
            Her kelimenin bir <Text style={styles.explainBold}>Review Count</Text> değeri vardır — bu sayı, kelimenin kaç{' '}
            <Text style={styles.explainBold}>farklı hikâyede</Text> geçtiğini gösterir.
          </Text>
          <Text style={[styles.explainP, { color: colors.mutedForeground }]}>
            Flashcard, quiz veya pratik oyunlarında kelimeyle karşılaşman bu sayıyı ETKİLEMEZ. Aynı hikâyede bir kelime
            10 kere geçse bile Review Count yine <Text style={styles.explainBold}>1</Text> artar — önemli olan tekrar
            sayısı değil, kelimenin kaç farklı hikâyede karşına çıktığıdır.
          </Text>

          <ExplainItem color="#c4b5fd" title="1-3 farklı hikâye → Yeni:" text="Kelimeyle yeni tanışıyorsun, henüz pekişmedi." />
          <ExplainItem color="#facc15" title="4-8 farklı hikâye → Öğreniliyor:" text="Farklı bağlamlarda görüldükçe hafızana yerleşiyor." />
          <ExplainItem color="#4ade80" title="9+ farklı hikâye → Mastered:" text="Yeterince farklı hikâyede görüldü, uzun süreli hafızana yerleşti." />

          <Text style={[styles.explainFootnote, { color: colors.mutedForeground, borderTopColor: 'rgba(255,255,255,0.08)' }]}>
            Durum tamamen otomatik güncellenir, elle değiştiremezsin — yeni hikâyeler oluşturup kelimeyle farklı
            bağlamlarda karşılaşarak ilerletebilirsin.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ExplainItem({ color, title, text }: { color: string; title: string; text: string }) {
  const colors = useColors();
  return (
    <View style={styles.explainItem}>
      <View style={[styles.explainDot, { backgroundColor: color }]} />
      <Text style={[styles.explainItemText, { color: colors.mutedForeground }]}>
        <Text style={[styles.explainItemTitle, { color }]}>{title}</Text> {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,3,10,0.6)',
  },
  explainSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '58%',
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    marginRight: 10,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explainP: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 14,
  },
  explainBold: {
    fontFamily: 'Inter_700Bold',
  },
  explainItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  explainDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginTop: 5,
  },
  explainItemText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  explainItemTitle: {
    fontFamily: 'Inter_700Bold',
  },
  explainFootnote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
});
