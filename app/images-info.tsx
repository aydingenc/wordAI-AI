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
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { useColors } from '@/hooks/useColors';
import { IMAGES } from '@/data/mock';

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
  const colors = useColors();
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
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 34) + 10, paddingBottom: insets.bottom + 28 },
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
                  borderColor: colors.primary,
                  backgroundColor: 'rgba(139,92,246,0.1)',
                  opacity: pressed ? 0.76 : 1,
                },
              ]}
            >
              <Feather name="arrow-left" size={23} color={colors.accent} />
            </Pressable>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.foreground }]}>Görsellerden Öğren</Text>
              <MaterialCommunityIcons name="star-four-points" size={23} color={colors.accent} />
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Kendi fotoğrafını yükle, AI analiz etsin, sana özel kelimeler ve hikâyeler oluştursun.</Text>
          </View>
          <RobotIllustration />
        </View>

        <View style={[styles.tabs, { borderColor: colors.borderStrong, backgroundColor: 'rgba(10,6,20,0.52)' }]}> 
          <Pressable onPress={() => setActiveTab('upload')} style={styles.tabButton}>
            {activeTab === 'upload' ? (
              <LinearGradient colors={[colors.primary, '#A855F7']} style={styles.activeTab}>
                <Feather name="image" size={17} color="#FFFFFF" />
                <Text style={styles.stepNo}>1</Text>
                <Text style={styles.activeTabText}>Kendi Görselini Yükle</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTab}>
                <Feather name="image" size={17} color={colors.mutedForeground} />
                <Text style={[styles.inactiveTabText, { color: colors.mutedForeground }]}>Kendi Görselini Yükle</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={openThemes} style={styles.tabButton}>
            {activeTab === 'themes' ? (
              <LinearGradient colors={[colors.primary, '#A855F7']} style={styles.activeTab}>
                <Text style={styles.stepNo}>2</Text>
                <Text style={styles.activeTabText}>Hazır Temalar</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTab}>
                <View style={[styles.tabCircle, { borderColor: colors.primary }]}><Text style={[styles.tabCircleText, { color: colors.accent }]}>2</Text></View>
                <Text style={[styles.inactiveTabText, { color: colors.mutedForeground }]}>Hazır Temalar</Text>
              </View>
            )}
          </Pressable>
        </View>

        <GlowCard padded={false} style={styles.uploadCard}>
          <Image source={IMAGES.nature} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={['rgba(46,16,101,0.18)', 'rgba(11,7,19,0.58)', 'rgba(11,7,19,0.92)']} style={StyleSheet.absoluteFill} />
          <View style={styles.balloon}><MaterialCommunityIcons name="airballoon" size={42} color="rgba(251,146,60,0.48)" /></View>
          <IconOrb icon="upload-cloud" size={42} large />
          <Text style={styles.uploadTitle}>Görselini Yükle</Text>
          <Text style={styles.uploadDesc}>Fotoğraf çek ya da galerinden seç.{`\n`}Tek bir görseli kişisel İngilizce dersine dönüştür.</Text>
          <View style={styles.actionRow}>
            <UploadAction icon="camera" title="Fotoğraf Çek" subtitle="Anı yakala" onPress={showNotice} />
            <UploadAction icon="image" title="Galeriden Seç" subtitle="Hazır görsel yükle" onPress={showNotice} />
          </View>
        </GlowCard>

        <View style={styles.benefitRow}>{BENEFITS.map((item) => <BenefitCard key={item.title} {...item} />)}</View>
        <GlowCard style={styles.flowCard}>{FLOW.map((item, index) => <React.Fragment key={item.label}><View style={styles.flowStep}><IconOrb mcIcon={item.icon} size={30} /><Text style={styles.flowLabel}>{item.label}</Text></View>{index < FLOW.length - 1 ? <Feather name="arrow-right" size={26} color={colors.accent} style={styles.flowArrow} /> : null}</React.Fragment>)}</GlowCard>

        <GlowCard style={styles.securityCard}>
          <Feather name="shield" size={44} color={colors.accent} />
          <View style={styles.securityText}><Text style={styles.securityTitle}>Güvenli Görsel Analizi</Text><Text style={[styles.securityDesc, { color: colors.mutedForeground }]}>Uygunsuz içerikler analizden geçmez. Güvenli görsel kontrolünü aşamayan yüklemeler işlenmez.</Text></View>
          <View style={[styles.lockBox, { borderColor: colors.primary }]}><Feather name="lock" size={24} color={colors.accent} /></View>
        </GlowCard>

        <GlowCard style={styles.motivationCard}>
          <IconOrb mcIcon="star-four-points" size={29} />
          <Text style={styles.motivationText}>Tek bir görsel, <Text style={styles.highlight}>yeni kelimeler</Text>, güçlü bağlamlar ve <Text style={styles.highlight}>unutulmaz hikayeler</Text> demek.</Text>
          <MaterialCommunityIcons name="book-open-page-variant" size={48} color={colors.accent} />
        </GlowCard>

        <Pressable onPress={() => router.push('/image-analysis-loading')} style={({ pressed }) => [{ opacity: pressed ? 0.84 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
          <LinearGradient colors={[colors.primary, '#A855F7', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <MaterialCommunityIcons name="star-four-points" size={24} color="#FFE680" />
            <Text style={styles.ctaText}>Hikâyeyi Başlat</Text>
            <Feather name="arrow-right" size={27} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </GradientBackground>
  );
}

function RobotIllustration() {
  return <View style={styles.robotWrap}><Text style={styles.sparkleA}>✦</Text><Text style={styles.sparkleB}>✧</Text><LinearGradient colors={['#F5E8FF', '#8B5CF6', '#2E1065']} style={styles.robotHead}><View style={styles.robotFace}><Text style={styles.robotEyes}>⌒  ⌒</Text><Text style={styles.robotMouth}>ᴗ</Text></View></LinearGradient><View style={styles.robotBody}><Feather name="image" size={18} color="#FFFFFF" /></View><View style={[styles.photoMock, styles.photoOne]} /><View style={[styles.photoMock, styles.photoTwo]} /></View>;
}

function IconOrb({ icon, mcIcon, size, large }: { icon?: keyof typeof Feather.glyphMap; mcIcon?: keyof typeof MaterialCommunityIcons.glyphMap; size: number; large?: boolean }) {
  return <LinearGradient colors={['rgba(168,85,247,0.95)', 'rgba(76,29,149,0.95)']} style={[styles.iconOrb, large && styles.iconOrbLarge]}>{icon ? <Feather name={icon} size={size} color="#FFFFFF" /> : <MaterialCommunityIcons name={mcIcon} size={size} color="#FFFFFF" />}</LinearGradient>;
}

function UploadAction({ icon, title, subtitle, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.uploadAction}><IconOrb icon={icon} size={26} /><View><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSubtitle}>{subtitle}</Text></View></Pressable>;
}

function BenefitCard({ title, text, icon }: { title: string; text: string; icon: keyof typeof Feather.glyphMap }) {
  return <GlowCard style={styles.benefitCard}><IconOrb icon={icon} size={25} /><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitText}>{text}</Text></GlowCard>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, gap: 14 },
  heroHead: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 160 },
  heroTextBlock: { flex: 1, paddingRight: 8, gap: 10 },
  backButton: { width: 43, height: 43, borderRadius: 22, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 31, letterSpacing: -0.7 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15.5, lineHeight: 23, maxWidth: 360 },
  robotWrap: { width: 145, height: 140, alignItems: 'center', justifyContent: 'center' },
  sparkleA: { position: 'absolute', top: 8, right: 14, color: '#C084FC', fontSize: 18 }, sparkleB: { position: 'absolute', top: 28, left: 8, color: '#E9D5FF', fontSize: 18 },
  robotHead: { width: 74, height: 66, borderRadius: 28, padding: 8, alignItems: 'center', justifyContent: 'center' },
  robotFace: { width: 54, height: 36, borderRadius: 17, backgroundColor: '#160824', alignItems: 'center', justifyContent: 'center' },
  robotEyes: { color: '#FFFFFF', fontSize: 15, lineHeight: 15 }, robotMouth: { color: '#FFFFFF', fontSize: 17, lineHeight: 17 },
  robotBody: { width: 54, height: 44, borderRadius: 19, backgroundColor: 'rgba(139,92,246,0.58)', alignItems: 'center', justifyContent: 'center', marginTop: -3 },
  photoMock: { position: 'absolute', width: 44, height: 34, borderRadius: 5, borderWidth: 1, borderColor: '#E9D5FF', backgroundColor: 'rgba(124,58,237,0.62)' }, photoOne: { left: 14, top: 58, transform: [{ rotate: '-13deg' }] }, photoTwo: { right: 8, top: 74, transform: [{ rotate: '14deg' }] },
  tabs: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, padding: 3, gap: 3 }, tabButton: { flex: 1 }, activeTab: { minHeight: 58, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 8 }, activeTabText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14.5 }, stepNo: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }, inactiveTab: { minHeight: 58, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 8 }, inactiveTabText: { fontFamily: 'Inter_600SemiBold', fontSize: 14.5 }, tabCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, tabCircleText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  uploadCard: { minHeight: 330, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 20, borderStyle: 'dashed' }, balloon: { position: 'absolute', right: 35, top: 62 }, iconOrb: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(216,180,254,0.55)' }, iconOrbLarge: { width: 92, height: 92, borderRadius: 46, marginBottom: 13 }, uploadTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 25 }, uploadDesc: { color: '#DDD6FE', fontFamily: 'Inter_400Regular', fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 5 }, actionRow: { flexDirection: 'row', gap: 14, marginTop: 22, width: '100%' }, uploadAction: { flex: 1, minHeight: 92, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(168,85,247,0.42)', backgroundColor: 'rgba(9,6,20,0.72)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 12 }, actionTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 16 }, actionSubtitle: { color: '#BDB4D8', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 },
  benefitRow: { flexDirection: 'row', gap: 10 }, benefitCard: { flex: 1, minHeight: 150, padding: 12 }, benefitTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14, lineHeight: 19, marginTop: 10 }, benefitText: { color: '#BDB4D8', fontFamily: 'Inter_400Regular', fontSize: 12.5, lineHeight: 18, marginTop: 6 },
  flowCard: { minHeight: 116, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }, flowStep: { flex: 1, alignItems: 'center', gap: 9 }, flowLabel: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 12.5, textAlign: 'center' }, flowArrow: { marginHorizontal: -2 },
  securityCard: { minHeight: 98, flexDirection: 'row', alignItems: 'center', gap: 14 }, securityText: { flex: 1 }, securityTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 17, marginBottom: 4 }, securityDesc: { fontFamily: 'Inter_400Regular', fontSize: 13.5, lineHeight: 19 }, lockBox: { width: 62, height: 58, borderRadius: 17, borderWidth: 1, backgroundColor: 'rgba(139,92,246,0.18)', alignItems: 'center', justifyContent: 'center' },
  motivationCard: { minHeight: 90, flexDirection: 'row', alignItems: 'center', gap: 13 }, motivationText: { color: '#FFFFFF', flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 23 }, highlight: { color: '#C084FC' },
  cta: { minHeight: 76, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 3, marginBottom: 8 }, ctaText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 23 },
});
