import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const TOKENS = {
  bg: '#0A0714',
  card: '#16101F',
  violet100: '#C4B5FD',
  violet300: '#A78BFA',
  violet600: '#7C3AED',
  textMuted: '#A19DB0',
};

const features = [
  {
    icon: 'search',
    title: 'Görsele Uygun Kelime Analizi',
    description: 'AI, görseldeki ana nesneleri ve bağlamı seçer.',
  },
  {
    icon: 'book-open',
    title: 'Sana Özel Hikâye + Quiz',
    description: 'Seçilen kelimelerle seviyene uygun içerik oluşturulur.',
  },
  {
    icon: 'flashcards',
    title: 'Kelime Kartlarıyla Pekiştir',
    description: 'Öğrendiğin kelimeleri tekrar ederek kalıcı hale getir.',
  },
] as const;

const flow = [
  { icon: 'image-outline', label: 'Görsel' },
  { icon: 'cpu', label: 'AI Analizi' },
  { icon: 'list', label: 'Seçilen Kelimeler' },
  { icon: 'book-open-page-variant-outline', label: 'Hikaye + Quiz' },
] as const;

export default function ImagesInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const showDemoAlert = () => {
    Alert.alert('Görsel Yükle', 'Bu demo ekranda geçici yükleme aksiyonu gösterilir.');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Görsellerden Öğren</Text>
              <Text style={styles.titleSparkle}>✦</Text>
            </View>
            <Text style={styles.subtitle}>
              Kendi fotoğrafını yükle, AI analiz etsin,{`\n`}sana özel kelimeler ve hikâyeler oluştursun.
            </Text>
          </View>
          <View style={styles.mascotWrap} pointerEvents="none">
            <Text style={[styles.floatSparkle, styles.sparkleOne]}>✦</Text>
            <Text style={[styles.floatSparkle, styles.sparkleTwo]}>✦</Text>
            <Text style={[styles.floatSparkle, styles.sparkleThree]}>✦</Text>
            <LinearGradient colors={[TOKENS.violet300, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mascotCircle}>
              <MaterialCommunityIcons name="robot-happy-outline" size={54} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </View>

        <Pressable style={styles.uploadCard} onPress={showDemoAlert}>
          <LinearGradient colors={['#4C2A6E', '#6B3FA0', '#2E1A47', '#150E22']} locations={[0, 0.3, 0.65, 1]} style={styles.uploadOverlay}>
            <View style={styles.uploadDarkOverlay} />
            <View style={styles.uploadIconArea}>
              <View style={styles.radialGlow} />
              <Text style={[styles.iconSparkle, styles.iconSparkleOne]}>✦</Text>
              <Text style={[styles.iconSparkle, styles.iconSparkleTwo]}>✦</Text>
              <LinearGradient colors={[TOKENS.violet300, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.uploadCircle}>
                <Feather name="upload-cloud" size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.uploadTitle}>Görselini Yükle</Text>
            <Text style={styles.uploadDescription}>
              Fotoğraf çek ya da galerinden seç.{`
`}Tek bir görseli kişisel İngilizce dersine dönüştür.
            </Text>
            <View style={styles.uploadActions}>
              <UploadAction icon="camera" title="Fotoğraf Çek" subtitle="Anı yakala" onPress={showDemoAlert} />
              <UploadAction icon="image" title="Galeriden Seç" subtitle="Hazır görsel yükle" onPress={showDemoAlert} />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.featuresRow}>
          {features.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <FeatureIcon type={feature.icon} />
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.flowCard}>
          {flow.map((step, index) => (
            <React.Fragment key={step.label}>
              <View style={styles.flowStep}>
                <LinearGradient colors={[TOKENS.violet300, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.flowCircle}>
                  {step.icon === 'list' || step.icon === 'cpu' ? <Feather name={step.icon} size={24} color="#FFFFFF" /> : <MaterialCommunityIcons name={step.icon} size={24} color="#FFFFFF" />}
                </LinearGradient>
                <Text style={styles.flowLabel}>{step.label}</Text>
              </View>
              {index < flow.length - 1 ? <Text style={styles.flowArrow}>→</Text> : null}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.safetyBand}>
          <MaterialCommunityIcons name="shield-check-outline" size={40} color={TOKENS.violet300} />
          <View style={styles.safetyTextWrap}>
            <Text style={styles.bandTitle}>Güvenli Görsel Analizi</Text>
            <Text style={styles.bandDescription}>Uygunsuz içerikler analizden geçmez. Güvenli görsel kontrolünü aşamayan yüklemeler işlenmez.</Text>
          </View>
          <View style={styles.lockBadge}>
            <Feather name="lock" size={22} color={TOKENS.violet100} />
          </View>
        </View>

        <View style={styles.quoteBand}>
          <LinearGradient colors={[TOKENS.violet300, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quoteIcon}>
            <Text style={styles.quoteSparkle}>✦</Text>
          </LinearGradient>
          <Text style={styles.quoteText}>
            Tek bir görsel, <Text style={styles.quoteAccent}>yeni kelimeler,</Text>{`\n`}güçlü bağlamlar ve <Text style={styles.quoteAccent}>unutulmaz hikâyeler</Text> demek.
          </Text>
          <View style={styles.bookWrap}>
            <Text style={[styles.bookSparkle, styles.bookSparkleOne]}>✦</Text>
            <Text style={[styles.bookSparkle, styles.bookSparkleTwo]}>✦</Text>
            <Feather name="book-open" size={36} color={TOKENS.violet100} />
          </View>
        </View>

        <Pressable style={styles.ctaWrap} onPress={() => router.push('/story-loading')}>
          <LinearGradient colors={['rgba(139,92,246,0.45)', 'rgba(109,40,217,0.45)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGlow} />
          <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaButton}>
            <Text style={styles.ctaSparkle}>✦</Text>
            <Text style={styles.ctaText}>Hikâyeyi Başlat</Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function FeatureIcon({ type }: { type: 'search' | 'book-open' | 'flashcards' }) {
  return (
    <LinearGradient colors={[TOKENS.violet300, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featureIcon}>
      {type === 'search' ? <Feather name="search" size={22} color="#FFFFFF" /> : null}
      {type === 'book-open' ? (
        <View style={styles.bookFeatureIconWrap}>
          <Feather name="book-open" size={22} color="#FFFFFF" />
          <Text style={styles.featureMiniSparkle}>✦</Text>
        </View>
      ) : null}
      {type === 'flashcards' ? (
        <View style={styles.flashcardIconWrap}>
          <View style={styles.flashcardBack} />
          <View style={styles.flashcardFront} />
        </View>
      ) : null}
    </LinearGradient>
  );
}

function UploadAction({ icon, title, subtitle, onPress }: { icon: 'camera' | 'image'; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionButton} onPress={onPress}>
      <LinearGradient colors={[TOKENS.violet300, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionIcon}>
        <Feather name={icon} size={24} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: TOKENS.bg },
  content: { paddingHorizontal: 22, gap: 16 },
  header: { minHeight: 158, position: 'relative' },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  headerCopy: { marginTop: 16, maxWidth: '70%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' },
  title: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 29, flexShrink: 0 },
  titleSparkle: { marginLeft: 7, color: TOKENS.violet300, fontSize: 16, lineHeight: 20 },
  subtitle: { marginTop: 8, color: TOKENS.textMuted, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  mascotWrap: { position: 'absolute', right: -4, top: 36, width: 118, height: 118, alignItems: 'center', justifyContent: 'center' },
  mascotCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  floatSparkle: { position: 'absolute', color: TOKENS.violet100, zIndex: 2 },
  sparkleOne: { top: 2, left: 18, fontSize: 8 },
  sparkleTwo: { top: 15, right: 6, fontSize: 6 },
  sparkleThree: { bottom: 14, left: 2, fontSize: 4 },
  sparkleFour: { bottom: 6, right: 18, fontSize: 7 },
  uploadCard: { borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(167,139,250,0.5)', overflow: 'hidden' },
  uploadOverlay: { padding: 20, alignItems: 'center' },
  uploadDarkOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(10,7,20,0.22)' },
  uploadIconArea: { width: 112, height: 92, alignItems: 'center', justifyContent: 'center' },
  radialGlow: { position: 'absolute', width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(167,139,250,0.35)', opacity: 0.35 },
  iconSparkle: { position: 'absolute', color: TOKENS.violet100, zIndex: 2 },
  iconSparkleOne: { left: 14, top: 10, fontSize: 8 },
  iconSparkleTwo: { right: 12, bottom: 9, fontSize: 7 },
  uploadCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  uploadTitle: { marginTop: 16, color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 28 },
  uploadDescription: { marginTop: 8, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  uploadActions: { marginTop: 18, flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, height: 68, borderRadius: 14, backgroundColor: 'rgba(22,16,31,0.75)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 6 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1, minWidth: 0 },
  actionTitle: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 19 },
  actionSubtitle: { marginTop: 3, color: TOKENS.textMuted, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  featuresRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  featureCard: { flex: 1, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(167,139,250,0.18)', backgroundColor: TOKENS.card, padding: 14, alignItems: 'flex-start' },
  featureIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bookFeatureIconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  featureMiniSparkle: { position: 'absolute', top: -2, right: -1, color: '#FFFFFF', fontSize: 7, lineHeight: 9 },
  flashcardIconWrap: { width: 25, height: 22 },
  flashcardBack: { position: 'absolute', left: 2, top: 1, width: 18, height: 14, borderWidth: 1.8, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 3 },
  flashcardFront: { position: 'absolute', right: 1, bottom: 1, width: 18, height: 14, borderWidth: 1.8, borderColor: '#FFFFFF', borderRadius: 3 },
  featureTitle: { marginTop: 12, color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 17.5 },
  featureDescription: { marginTop: 6, color: TOKENS.textMuted, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16.8 },
  flowCard: { borderRadius: 22, backgroundColor: TOKENS.card, padding: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  flowStep: { flex: 1, alignItems: 'center' },
  flowCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  flowLabel: { marginTop: 8, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 15, textAlign: 'center' },
  flowArrow: { width: 20, marginTop: 16, textAlign: 'center', color: TOKENS.violet300, fontSize: 18, lineHeight: 20 },
  safetyBand: { borderRadius: 22, backgroundColor: TOKENS.card, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  safetyTextWrap: { flex: 1, minWidth: 0 },
  bandTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 19 },
  bandDescription: { marginTop: 4, color: TOKENS.textMuted, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19.5 },
  lockBadge: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)', alignItems: 'center', justifyContent: 'center' },
  quoteBand: { borderRadius: 22, backgroundColor: TOKENS.card, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  quoteIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  quoteSparkle: { color: '#FFFFFF', fontSize: 22 },
  quoteText: { flex: 1, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 21 },
  quoteAccent: { color: TOKENS.violet100 },
  bookWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bookSparkle: { position: 'absolute', color: TOKENS.violet100 },
  bookSparkleOne: { top: 1, right: 0, fontSize: 7 },
  bookSparkleTwo: { bottom: 2, left: 2, fontSize: 5 },
  ctaWrap: { height: 68, justifyContent: 'flex-start' },
  ctaGlow: { position: 'absolute', left: '5%', right: '5%', top: 8, height: 60, borderRadius: 30, opacity: 0.45 },
  ctaButton: { height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaSparkle: { color: '#FCD34D', fontSize: 18, lineHeight: 22 },
  ctaText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 18, lineHeight: 22 },
});
