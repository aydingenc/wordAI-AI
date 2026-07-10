import React, { useState } from 'react';
import {
  Alert,
  Image,
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
import { GlowCard } from '@/components/GlowCard';
import { IMAGES } from '@/data/mock';

const UI = {
  background: '#0A0714',
  card: '#15111F',
  border: 'rgba(167,139,250,0.2)',
  borderStrong: 'rgba(167,139,250,0.44)',
  primaryStart: '#A78BFA',
  primaryEnd: '#7C3AED',
  ctaStart: '#C084FC',
  ctaMid: '#9333EA',
  ctaEnd: '#6D28D9',
  muted: '#9CA3AF',
  accent: '#C4B5FD',
  white: '#FFFFFF',
};

const BENEFITS: {
  title: string;
  text: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  {
    title: 'Görsele Uygun Kelime Analizi',
    text: 'AI, görseldeki ana nesneleri ve bağlamı seçer.',
    icon: 'search',
  },
  {
    title: 'Sana Özel Hikaye + Quiz',
    text: 'Seçilen kelimelerle seviyene uygun içerik oluşturulur.',
    icon: 'book-open',
  },
  {
    title: 'Kelime Kartlarıyla Pekiştir',
    text: 'Öğrendiğin kelimeleri tekrar ederek kalıcı hale getir.',
    icon: 'file-text',
  },
];

const FLOW: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { label: 'Görsel', icon: 'image' },
  { label: 'AI Analizi', icon: 'brain' },
  { label: 'Seçilen Kelimeler', icon: 'format-list-bulleted' },
  { label: 'Hikaye + Quiz', icon: 'book-open-variant' },
];

export default function ImagesInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'upload' | 'themes'>('upload');

  const showNotice = () => {
    Alert.alert('Yakında', 'Bu özellik yakında aktif olacak.');
  };

  const openThemes = () => {
    setActiveTab('themes');
    router.push('/themes');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 28) + 2, paddingBottom: insets.bottom + 22 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroHead}>
          <View style={styles.heroTextBlock}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                {
                  borderColor: UI.borderStrong,
                  backgroundColor: 'rgba(167,139,250,0.08)',
                  opacity: pressed ? 0.76 : 1,
                },
              ]}
            >
              <Feather name="arrow-left" size={23} color={UI.accent} />
            </Pressable>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Görsellerden Öğren</Text>
              <MaterialCommunityIcons name="star-four-points" size={22} color={UI.accent} />
            </View>
            <Text style={styles.subtitle}>Kendi fotoğrafını yükle, AI analiz etsin, sana özel kelimeler ve hikâyeler oluştursun.</Text>
          </View>
          <RobotIllustration />
        </View>

        <View style={styles.tabs}>
          <Pressable onPress={() => setActiveTab('upload')} style={styles.tabButton}>
            {activeTab === 'upload' ? (
              <LinearGradient colors={[UI.primaryStart, UI.primaryEnd]} style={styles.activeTab}>
                <Feather name="image" size={17} color="#FFFFFF" />
                <Text style={styles.stepNo}>1</Text>
                <Text style={styles.activeTabText}>Kendi Görselini Yükle</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTab}>
                <Feather name="image" size={17} color={UI.muted} />
                <Text style={[styles.inactiveTabText, { color: UI.muted }]}>Kendi Görselini Yükle</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={openThemes} style={styles.tabButton}>
            {activeTab === 'themes' ? (
              <LinearGradient colors={[UI.primaryStart, UI.primaryEnd]} style={styles.activeTab}>
                <Text style={styles.stepNo}>2</Text>
                <Text style={styles.activeTabText}>Hazır Temalar</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTab}>
                <View style={[styles.tabCircle, { borderColor: UI.borderStrong }]}><Text style={[styles.tabCircleText, { color: UI.accent }]}>2</Text></View>
                <Text style={[styles.inactiveTabText, { color: UI.muted }]}>Hazır Temalar</Text>
              </View>
            )}
          </Pressable>
        </View>

        <GlowCard padded={false} style={styles.uploadCard}>
          <View pointerEvents="none" style={styles.uploadDash} />
          <Image source={IMAGES.nature} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.34)', 'rgba(0,0,0,0.62)']} locations={[0, 0.52, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.balloon}><MaterialCommunityIcons name="airballoon" size={42} color="rgba(251,146,60,0.48)" /></View>
          <UploadOrb />
          <Text style={styles.uploadTitle}>Görselini Yükle</Text>
          <Text style={styles.uploadDesc} numberOfLines={2}>Fotoğraf çek ya da galerinden seç.{`\n`}Tek bir görseli kişisel İngilizce dersine dönüştür.</Text>
          <View style={styles.actionRow}>
            <UploadAction icon="camera" title="Fotoğraf Çek" subtitle="Anı yakala" onPress={showNotice} />
            <UploadAction icon="image" title="Galeriden Seç" subtitle="Hazır görsel yükle" onPress={showNotice} />
          </View>
        </GlowCard>

        <View style={styles.benefitRow}>{BENEFITS.map((item) => <BenefitCard key={item.title} {...item} />)}</View>
        <GlowCard style={styles.flowCard}>{FLOW.map((item, index) => <React.Fragment key={item.label}><View style={styles.flowStep}><IconOrb mcIcon={item.icon} size={30} /><Text style={styles.flowLabel}>{item.label}</Text></View>{index < FLOW.length - 1 ? <Feather name="arrow-right" size={26} color={UI.accent} style={styles.flowArrow} /> : null}</React.Fragment>)}</GlowCard>

        <GlowCard style={styles.securityCard}>
          <View style={styles.shieldCheck}><Feather name="shield" size={46} color={UI.accent} /><Feather name="check" size={20} color={UI.accent} style={styles.shieldTick} /></View>
          <View style={styles.securityText}><Text style={styles.securityTitle}>Güvenli Görsel Analizi</Text><Text style={[styles.securityDesc, { color: UI.muted }]}>Uygunsuz içerikler analizden geçmez. Güvenli görsel kontrolünü aşamayan yüklemeler işlenmez.</Text></View>
          <View style={[styles.lockBox, { borderColor: UI.borderStrong }]}><Feather name="lock" size={24} color={UI.accent} /></View>
        </GlowCard>

        <GlowCard style={styles.motivationCard}>
          <IconOrb mcIcon="star-four-points" size={29} />
          <Text style={styles.motivationText}>Tek bir görsel, <Text style={styles.highlight}>yeni kelimeler</Text>, güçlü bağlamlar ve <Text style={styles.highlight}>unutulmaz hikayeler</Text> demek.</Text>
          <MaterialCommunityIcons name="book-open-page-variant" size={48} color={UI.accent} />
        </GlowCard>

        <Pressable onPress={() => Alert.alert('Görsel Analizi Hazırlanıyor', 'Bu demo akışında gerçek yükleme yapılmaz. Görselden kelime ve hikâye oluşturma deneyimi yakında aktif olacak.')} style={({ pressed }) => [styles.ctaWrap, { opacity: pressed ? 0.84 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
          <View pointerEvents="none" style={styles.ctaGlow} />
          <LinearGradient colors={[UI.ctaStart, UI.ctaMid, UI.ctaEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <MaterialCommunityIcons name="star-four-points" size={24} color="#FFE680" />
            <Text style={styles.ctaText}>Hikâyeyi Başlat</Text>
            <Feather name="arrow-right" size={27} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function RobotIllustration() {
  return (
    <View style={styles.robotWrap}>
      <View pointerEvents="none" style={styles.robotSoftGlow} />
      <Text style={styles.sparkleA}>✦</Text>
      <Text style={styles.sparkleB}>✧</Text>
      <View style={[styles.photoMock, styles.photoOne]} />
      <View style={[styles.photoMock, styles.photoTwo]} />
      <View style={[styles.photoMock, styles.photoThree]} />
      <LinearGradient colors={['#F5F3FF', UI.primaryStart, UI.primaryEnd]} style={styles.robotHead}>
        <View style={styles.robotFace}>
          <Text style={styles.robotEyes}>⌒  ⌒</Text>
          <Text style={styles.robotMouth}>ᴗ</Text>
        </View>
      </LinearGradient>
      <View style={styles.robotBody}><Feather name="image" size={18} color="#FFFFFF" /></View>
    </View>
  );
}


function UploadOrb() {
  return (
    <View style={styles.uploadOrbWrap}>
      <View pointerEvents="none" style={styles.uploadOrbGlow} />
      <Text style={[styles.uploadSparkle, styles.uploadSparkleTop]}>✦</Text>
      <IconOrb icon="upload-cloud" size={42} large />
      <Text style={[styles.uploadSparkle, styles.uploadSparkleBottom]}>✦</Text>
    </View>
  );
}


function IconOrb({ icon, mcIcon, size, large }: { icon?: keyof typeof Feather.glyphMap; mcIcon?: keyof typeof MaterialCommunityIcons.glyphMap; size: number; large?: boolean }) {
  return <LinearGradient colors={[UI.primaryStart, UI.primaryEnd]} style={[styles.iconOrb, large && styles.iconOrbLarge]}>{icon ? <Feather name={icon} size={size} color="#FFFFFF" /> : <MaterialCommunityIcons name={mcIcon} size={size} color="#FFFFFF" />}</LinearGradient>;
}

function UploadAction({ icon, title, subtitle, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.uploadAction}><IconOrb icon={icon} size={26} /><View><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSubtitle}>{subtitle}</Text></View></Pressable>;
}

function BenefitCard({ title, text, icon }: { title: string; text: string; icon: keyof typeof Feather.glyphMap }) {
  return <GlowCard style={styles.benefitCard}><IconOrb icon={icon} size={25} /><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitText}>{text}</Text></GlowCard>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: UI.background },
  content: { paddingHorizontal: 22, gap: 18 },
  heroHead: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 126 },
  heroTextBlock: { flex: 1, paddingRight: 8, gap: 8 },
  backButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  title: { color: UI.white, fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.4 },
  subtitle: { color: UI.muted, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, maxWidth: 360 },
  robotWrap: { width: 150, height: 122, marginTop: -4, marginRight: -8, alignItems: 'center', justifyContent: 'center' }, robotSoftGlow: { position: 'absolute', width: 126, height: 110, borderRadius: 63, backgroundColor: UI.primaryEnd, opacity: 0.18, shadowColor: UI.primaryEnd, shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } }, sparkleA: { position: 'absolute', top: 7, left: 12, color: UI.accent, fontSize: 18 }, sparkleB: { position: 'absolute', top: 18, right: 14, color: UI.accent, fontSize: 18 }, photoMock: { position: 'absolute', width: 46, height: 34, borderRadius: 6, borderWidth: 1, borderColor: UI.accent, backgroundColor: 'rgba(124,58,237,0.42)' }, photoOne: { left: 3, top: 50, transform: [{ rotate: '-15deg' }] }, photoTwo: { right: 1, top: 55, transform: [{ rotate: '14deg' }] }, photoThree: { left: 50, bottom: 3, transform: [{ rotate: '4deg' }] }, robotHead: { width: 66, height: 58, borderRadius: 24, padding: 7, alignItems: 'center', justifyContent: 'center' }, robotFace: { width: 48, height: 31, borderRadius: 15, backgroundColor: '#0A0714', alignItems: 'center', justifyContent: 'center' }, robotEyes: { color: '#FFFFFF', fontSize: 15, lineHeight: 15 }, robotMouth: { color: '#FFFFFF', fontSize: 17, lineHeight: 17 }, robotBody: { width: 50, height: 38, borderRadius: 17, backgroundColor: 'rgba(139,92,246,0.44)', borderWidth: 1, borderColor: UI.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: -2 },
  tabs: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, borderColor: UI.border, backgroundColor: UI.card, padding: 4, gap: 4 }, tabButton: { flex: 1 }, activeTab: { height: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 8 }, activeTabText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14.5 }, stepNo: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }, inactiveTab: { height: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 8 }, inactiveTabText: { fontFamily: 'Inter_600SemiBold', fontSize: 14.5 }, tabCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, tabCircleText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  uploadCard: { minHeight: 292, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 24, borderWidth: 0, borderColor: 'transparent', backgroundColor: UI.card }, uploadDash: { ...StyleSheet.absoluteFillObject, borderWidth: 1.6, borderColor: UI.borderStrong, borderStyle: 'dashed', borderRadius: 24, zIndex: 5 }, balloon: { position: 'absolute', right: 35, top: 62 }, iconOrb: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: UI.borderStrong }, iconOrbLarge: { width: 78, height: 78, borderRadius: 39, marginBottom: 8 }, uploadOrbWrap: { position: 'relative', width: 92, height: 92, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, uploadOrbGlow: { position: 'absolute', width: 112, height: 112, borderRadius: 56, backgroundColor: UI.primaryStart, opacity: 0.3, shadowColor: UI.primaryStart, shadowOpacity: 0.8, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 9 }, uploadSparkle: { position: 'absolute', color: UI.accent, fontSize: 18, zIndex: 2 }, uploadSparkleTop: { top: 4, left: 5 }, uploadSparkleBottom: { right: 4, bottom: 4 }, uploadTitle: { color: UI.white, fontFamily: 'Inter_700Bold', fontSize: 18 }, uploadDesc: { color: UI.muted, fontFamily: 'Inter_400Regular', fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 5, width: '100%' }, actionRow: { flexDirection: 'row', gap: 14, marginTop: 12, width: '100%' }, uploadAction: { flex: 1, minHeight: 78, borderRadius: 18, borderWidth: 1, borderColor: UI.border, backgroundColor: 'rgba(21,17,31,0.84)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 12 }, actionTitle: { color: UI.white, fontFamily: 'Inter_700Bold', fontSize: 16 }, actionSubtitle: { color: UI.muted, fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 },
  benefitRow: { flexDirection: 'row', gap: 10 }, benefitCard: { flex: 1, minHeight: 142, padding: 12, backgroundColor: UI.card, borderColor: UI.border, borderRadius: 20 }, benefitTitle: { color: UI.white, fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 19, marginTop: 10 }, benefitText: { color: UI.muted, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 6 },
  flowCard: { minHeight: 116, backgroundColor: UI.card, borderColor: UI.border, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }, flowStep: { flex: 1, alignItems: 'center', gap: 9 }, flowLabel: { color: UI.white, fontFamily: 'Inter_600SemiBold', fontSize: 12.5, textAlign: 'center' }, flowArrow: { marginHorizontal: -2 },
  securityCard: { minHeight: 92, backgroundColor: UI.card, borderColor: UI.border, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 14 }, shieldCheck: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' }, shieldTick: { position: 'absolute' }, securityText: { flex: 1 }, securityTitle: { color: UI.white, fontFamily: 'Inter_700Bold', fontSize: 17, marginBottom: 4 }, securityDesc: { fontFamily: 'Inter_400Regular', fontSize: 13.5, lineHeight: 19 }, lockBox: { width: 62, height: 58, borderRadius: 16, borderWidth: 1.2, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  motivationCard: { minHeight: 90, backgroundColor: UI.card, borderColor: UI.border, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 13 }, motivationText: { color: UI.white, flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 23 }, highlight: { color: UI.accent },
  ctaWrap: { position: 'relative', marginTop: 3, marginBottom: 8 }, ctaGlow: { position: 'absolute', left: 18, right: 18, bottom: -8, height: 42, borderRadius: 24, backgroundColor: UI.ctaMid, opacity: 0.35, shadowColor: UI.ctaMid, shadowOpacity: 0.9, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 10 }, cta: { minHeight: 76, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22 }, ctaText: { color: UI.white, fontFamily: 'Inter_700Bold', fontSize: 23 },
});
