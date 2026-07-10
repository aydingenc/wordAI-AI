import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';

const STEPS: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
}[] = [
  {
    icon: 'edit-3',
    title: 'Kelimelerini yaz',
    body: 'Öğrenmek istediğin İngilizce kelimeleri ekle.',
  },
  {
    icon: 'book-open',
    title: 'Sana özel hikaye',
    body: 'Kelimelerin akıllı bir hikayenin içine yerleşir.',
  },
  {
    icon: 'help-circle',
    title: 'Quiz ile pekiştir',
    body: 'Kısa sorularla öğrendiklerini test et.',
  },
  {
    icon: 'layers',
    title: 'Kelime kartları',
    body: 'Kartlarla tekrar et, kalıcı hale getir.',
  },
];

export default function WordsInfoScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <ScreenHeader title="Kelimelerden Öğren" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.secondary }]}>
          <Feather name="edit-3" size={40} color={colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Kendi kelimelerinden başla
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Bildiğin ya da öğrenmek istediğin kelimeleri yaz; gerisini akıllı öğrenme
          döngüsü halleder.
        </Text>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <GlowCard key={s.title} style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <View style={[styles.stepIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={s.icon} size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                  {s.title}
                </Text>
                <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>
                  {s.body}
                </Text>
              </View>
            </GlowCard>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label="Başla"
          icon="arrow-right"
          onPress={() => router.push('/words-entry')}
          testID="words-info-start"
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 10,
  },
  hero: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  steps: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#fff',
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  stepBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
