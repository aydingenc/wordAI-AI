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

const cardGradient = ['rgba(38,28,58,0.55)', 'rgba(22,16,31,0.9)'] as const;

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
          <View style={[styles.headerStar, styles.headerStarOne]} />
          <View style={[styles.headerStar, styles.headerStarTwo]} />
          <View style={[styles.headerStar, styles.headerStarThree]} />
          <View style={[styles.headerStar, styles.headerStarFour]} />
          <View style={[styles.headerStar, styles.headerStarFive]} />
          <View style={[styles.headerStar, styles.headerStarSix]} />
          <View style={[styles.headerStar, styles.headerStarSeven]} />
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
              <Text style={[styles.iconSparkle, styles.iconSparkleThree]}>✦</Text>
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
              <UploadAction icon="image" title="Galeriden Seç" subtitle="Hazır görsel yükle" onPress={showDemoAlert} wide />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.featuresRow}>
          {features.map((feature) => (
            <LinearGradient key={feature.title} colors={cardGradient} style={styles.featureCard}>
              <FeatureIcon type={feature.icon} />
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </LinearGradient>
          ))}
        </View>

        <LinearGradient colors={cardGradient} style={styles.flowCard}>
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
        </LinearGradient>

        <LinearGradient colors={cardGradient} style={styles.safetyBand}>
          <MaterialCommunityIcons name="shield-check-outline" size={40} color={TOKENS.violet300} />
          <View style={styles.safetyTextWrap}>
            <Text style={styles.bandTitle}>Güvenli Görsel Analizi</Text>
            <Text style={styles.bandDescription}>Uygunsuz içerikler analizden geçmez. Güvenli görsel kontrolünü aşamayan yüklemeler işlenmez.</Text>
          </View>
          <LinearGradient colors={[TOKENS.violet300, TOKENS.violet600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.lockBadge}>
            <Feather name="lock" size={22} color="#FFFFFF" />
          </LinearGradient>
        </LinearGradient>

        <LinearGradient colors={cardGradient} style={styles.quoteBand}>
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
        </LinearGradient>

        <Pressable style={styles.ctaWrap} onPress={() => router.push('/story-loading')}>
          <LinearGradient colors={['rgba(139,92,246,0.45)', 'rgba(109,40,217,0.45)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGlow} />
          <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaButton}>
            <View style={styles.ctaTopLine} />
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

function UploadAction({ icon, title, subtitle, onPress, wide = false }: { icon: 'camera' | 'image'; title: string; subtitle: string; onPress: () => void; wide?: boolean }) {
  return (
    <Pressable style={[styles.actionButton, wide ? styles.actionButtonWide : styles.actionButtonStandard]} onPress={onPress}>
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
  headerStar: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(196,181,253,0.72)' },
  headerStarOne: { left: 22, top: 18, opacity: 0.6 },
  headerStarTwo: { left: 156, top: 7, width: 3, height: 3, borderRadius: 1.5, opacity: 0.8 },
  headerStarThree: { right: 116, top: 22, width: 6, height: 6, borderRadius: 3, opacity: 0.55 },
  headerStarFour: { right: 34, top: 18, width: 2, height: 2, borderRadius: 1, opacity: 0.9 },
  headerStarFive: { right: 142, bottom: 38, width: 5, height: 5, borderRadius: 2.5, opacity: 0.5 },
  headerStarSix: { left: 88, bottom: 20, width: 3, height: 3, borderRadius: 1.5, opacity: 0.75 },
  headerStarSeven: { right: 12, bottom: 58, width: 4, height: 4, borderRadius: 2, opacity: 0.65 },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  headerCopy: { marginTop: 16, width: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' },
  title: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 29, flexShrink: 0 },
  titleSparkle: { marginLeft: 7, color: TOKENS.violet300, fontSize: 16, lineHeight: 20 },
  subtitle: { marginTop: 8, color: TOKENS.textMuted, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19.5, width: '100%' },
  mascotWrap: { position: 'absolute', right: -2, top: 0, width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  mascotCircle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(196,181,253,0.25)', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 8 },
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
  iconSparkleOne: { left: 8, top: 3, fontSize: 14 },
  iconSparkleTwo: { right: 10, top: 8, fontSize: 10 },
  iconSparkleThree: { left: 18, bottom: 6, fontSize: 8 },
  uploadCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(196,181,253,0.25)', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 28, elevation: 10 },
  uploadTitle: { marginTop: 16, color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 28 },
  uploadDescription: { marginTop: 8, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  uploadActions: { marginTop: 18, flexDirection: 'row', gap: 10 },
  actionButton: { height: 60, borderRadius: 14, backgroundColor: 'rgba(22,16,31,0.75)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, gap: 8, minWidth: 0 },
  actionButtonStandard: { flex: 0.48 },
  actionButtonWide: { flex: 0.52 },
  actionIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1, minWidth: 0 },
  actionTitle: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16 },
  actionSubtitle: { marginTop: 2, color: TOKENS.textMuted, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 13 },
  featuresRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  featureCard: { flex: 1, minHeight: 112, borderRadius: 22, padding: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)', shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 0 },
  featureCopy: { flex: 1, minWidth: 0 },
  featureIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(196,181,253,0.25)', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 8 },
  bookFeatureIconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  featureMiniSparkle: { position: 'absolute', top: -3, right: -2, color: '#FFFFFF', fontSize: 7, lineHeight: 9 },
  flashcardIconWrap: { width: 22, height: 19 },
  flashcardBack: { position: 'absolute', left: 2, top: 1, width: 16, height: 12, borderWidth: 1.8, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 3 },
  flashcardFront: { position: 'absolute', right: 1, bottom: 1, width: 16, height: 12, borderWidth: 1.8, borderColor: '#FFFFFF', borderRadius: 3 },
  featureTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 12, lineHeight: 15 },
  featureDescription: { marginTop: 4, color: TOKENS.textMuted, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15.4 },
  flowCard: { borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)', shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 0 },
  flowStep: { flex: 1, alignItems: 'center' },
  flowCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(196,181,253,0.25)', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 8 },
  flowLabel: { marginTop: 8, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 15, textAlign: 'center' },
  flowArrow: { width: 20, marginTop: 16, textAlign: 'center', color: TOKENS.violet100, fontSize: 18, lineHeight: 20, textShadowColor: 'rgba(167,139,250,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4 },
  safetyBand: { borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)', shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 0 },
  safetyTextWrap: { flex: 1, minWidth: 0 },
  bandTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15, lineHeight: 19 },
  bandDescription: { marginTop: 4, color: TOKENS.textMuted, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19.5 },
  lockBadge: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  quoteBand: { borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)', shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 0 },
  quoteIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(196,181,253,0.25)', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 8 },
  quoteSparkle: { color: '#FFFFFF', fontSize: 22 },
  quoteText: { flex: 1, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 18 },
  quoteAccent: { color: TOKENS.violet100 },
  bookWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bookSparkle: { position: 'absolute', color: TOKENS.violet100 },
  bookSparkleOne: { top: 1, right: 0, fontSize: 7 },
  bookSparkleTwo: { bottom: 2, left: 2, fontSize: 5 },
  ctaWrap: { height: 68, justifyContent: 'flex-start' },
  ctaGlow: { position: 'absolute', left: '5%', right: '5%', top: 8, height: 60, borderRadius: 30, opacity: 0.45 },
  ctaButton: { height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(196,181,253,0.4)', overflow: 'hidden' },
  ctaTopLine: { position: 'absolute', left: 18, right: 18, top: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  ctaSparkle: { color: '#FCD34D', fontSize: 18, lineHeight: 22 },
  ctaText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 18, lineHeight: 22 },
});
