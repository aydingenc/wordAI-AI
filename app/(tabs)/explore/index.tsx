import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { BotIcon, FlashcardStackIcon, FlaskIcon, GamesIcon, LearningDonutChart } from '@/components/ExploreIcons';
import { BookIcon, ClearIcon, DnaIcon, LockIcon, PersonIcon, SparkleIcon } from '@/components/WordStatusIcons';
import { useColors } from '@/hooks/useColors';
import { useDialog } from '@/context/DialogContext';
import { useProgress } from '@/context/ProgressContext';

export default function ExploreScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const { recentWords } = useProgress();

  const showSoon = (label: string) => {
    showDialog({ title: label, message: 'Bu özellik demo sürümünde yakında eklenecek.' });
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>Keşfet</Text>
            <SparkleIcon size={14} color={colors.accent} />
          </View>
          <View style={styles.botAvatarWrap}>
            <LinearGradient
              colors={['#c4b5fd', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.botAvatar, { borderColor: 'rgba(196,181,253,0.5)' }]}
            >
              <BotIcon size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={[styles.botDot, { borderColor: colors.background }]} />
          </View>
        </View>

        <GlowCard style={styles.teaser}>
          <Text style={[styles.teaserText, { color: colors.mutedForeground }]}>
            Çok yakında başka hikaye oluşturucularının hikayelerini görebilecek, beğendiğin hikayeleri{' '}
            <Text style={[styles.teaserBold, { color: colors.accent }]}>
              beğenerek görünürlüğünü üst seviyelere taşıyabilecek
            </Text>{' '}
            ve <Text style={[styles.teaserBold, { color: colors.accent }]}>yorum bırakıp onlarla etkileşime geçebileceksin.</Text>
          </Text>
        </GlowCard>

        <View style={styles.featureRow}>
          <FeatureCard
            gradientFrom="rgba(139,92,246,0.16)"
            borderColor="rgba(139,92,246,0.35)"
            arrowBg="rgba(139,92,246,0.2)"
            arrowColor="#c4b5fd"
            icon={<FlashcardStackIcon size={56} />}
            title="Kelime Kartı ile Hızlı Tekrar"
            sub="Kelime kartları ile öğrendiklerini pekiştir."
            onPress={() => router.push('/explore/word-cards-hub')}
          />
          <FeatureCard
            gradientFrom="rgba(45,212,191,0.16)"
            borderColor="rgba(45,212,191,0.35)"
            arrowBg="rgba(45,212,191,0.2)"
            arrowColor="#2dd4bf"
            icon={<FlaskIcon size={56} />}
            title="Cümle Laboratuvarı"
            sub="Hedef kelimenle farklı cümle kalıpları gör."
            onPress={() => router.push({ pathname: '/explore/word-dna', params: { word: recentWords[0]?.en ?? 'beautiful' } })}
          />
          <LockedFeatureCard
            icon={<GamesIcon size={56} />}
            title="Oyunlar"
            sub="Yakında bir çok oyunla sizlerleyiz!"
            onPress={() => showSoon('Oyunlar')}
          />
        </View>

        <Pressable onPress={() => showSoon('bigFather Premium')} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
          <LinearGradient
            colors={['rgba(250,204,21,0.1)', 'rgba(139,92,246,0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.premiumPanel, { borderColor: 'rgba(250,204,21,0.3)' }]}
          >
            <View style={styles.premiumRow}>
              <View style={styles.premiumLeft}>
                <View style={styles.premiumCrown}>
                  <MaterialCommunityIcons name="crown" size={16} color="#facc15" />
                </View>
                <View style={styles.premiumTextCol}>
                  <Text style={styles.premiumTitle}>bigFather Premium</Text>
                  <Text style={[styles.premiumSub, { color: colors.mutedForeground }]}>
                    Daha hızlı öğren, daha fazlasını keşfet.
                  </Text>
                </View>
              </View>
              <View style={styles.premiumBtn}>
                <MaterialCommunityIcons name="crown" size={11} color="#231400" />
                <Text style={styles.premiumBtnText}>Premium&apos;a Geç</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        <GlowCard style={styles.scienceCard}>
          <View style={styles.scienceIndex}>
            <Text style={styles.scienceIndexText}>1 / 3</Text>
          </View>
          <Text style={[styles.scienceTitle, { color: colors.foreground }]}>Öğrenmenin{'\n'}Bilimsel Yolu</Text>
          <Text style={[styles.scienceDesc, { color: colors.mutedForeground }]}>
            En iyi öğrenme <Text style={styles.scienceBold}>%80 bildiklerinle</Text> bağlantı kurmak,{' '}
            <Text style={styles.scienceBold}>%20 yeni</Text> bilgilerle yoluna devam etmektir.
          </Text>
          <View style={styles.scienceVisual} pointerEvents="none">
            <LearningDonutChart size={150} />
          </View>
          <View style={styles.scienceDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </GlowCard>

        <View style={styles.sectionTitleRow}>
          <SparkleIcon size={14} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Diğer Bölümler</Text>
        </View>

        <View style={styles.otherGrid}>
          <OtherCard
            icon={<BookIcon size={16} color={colors.accent} />}
            title="Hikayelerim"
            sub="Kendi hikayelerini gör"
            onPress={() => router.push('/stories')}
          />
          <OtherCard
            icon={<DnaIcon size={16} color={colors.accent} />}
            title="Canlı Kelime Ağı"
            sub="Kelime bağlantılarını keşfet"
            onPress={() => router.push('/word-network')}
          />
          <OtherCard
            icon={<ClearIcon size={16} color={colors.accent} />}
            title="Günlük Tekrar"
            sub="Tekrarın seni güçlendirir"
            onPress={() => showSoon('Günlük Tekrar')}
          />
          <OtherCard
            icon={<PersonIcon size={16} color={colors.accent} />}
            title="Profilim"
            sub="İlerlemeni ve istatistiklerini gör"
            onPress={() => showSoon('Profilim')}
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

function FeatureCard({
  gradientFrom,
  borderColor,
  arrowBg,
  arrowColor,
  icon,
  title,
  sub,
  onPress,
}: {
  gradientFrom: string;
  borderColor: string;
  arrowBg: string;
  arrowColor: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.featureCardWrap, { opacity: pressed ? 0.9 : 1 }]}>
      <LinearGradient
        colors={[gradientFrom, 'rgba(19,17,32,0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.featureCard, { borderColor }]}
      >
        <View style={styles.featureIconWrap}>{icon}</View>
        <Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.featureSub, { color: colors.mutedForeground }]}>{sub}</Text>
        <View style={[styles.featureArrow, { backgroundColor: arrowBg }]}>
          <Feather name="chevron-right" size={12} color={arrowColor} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function LockedFeatureCard({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.featureCardWrap, { opacity: pressed ? 0.92 : 1 }]}>
      <LinearGradient
        colors={['rgba(251,191,36,0.14)', 'rgba(19,17,32,0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.featureCard, { borderColor: 'rgba(251,191,36,0.3)' }]}
      >
        <View style={styles.featureContent}>
          <View style={styles.featureIconWrap}>{icon}</View>
          <Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.featureSub, { color: colors.mutedForeground }]}>{sub}</Text>
        </View>

        <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFill, styles.frostLayer]} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.frostDarken, styles.frostLayer]} />

        <View style={[styles.soonBadge, styles.aboveFrost]}>
          <Text style={styles.soonBadgeText}>Yakında</Text>
        </View>
        <View style={[styles.featureLock, styles.aboveFrost]}>
          <LockIcon size={11} color="#fbbf24" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function OtherCard({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.otherCardWrap, { opacity: pressed ? 0.88 : 1 }]}>
      <GlowCard style={styles.otherCard}>
        <View style={[styles.otherIcon, { backgroundColor: 'rgba(139,92,246,0.2)' }]}>{icon}</View>
        <View style={styles.otherTextCol}>
          <Text style={[styles.otherTitle, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.otherSub, { color: colors.mutedForeground }]} numberOfLines={2}>
            {sub}
          </Text>
        </View>
        <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
      </GlowCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    gap: 0,
  },
  header: {
    position: 'relative',
    alignItems: 'center',
    paddingHorizontal: 50,
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 23,
  },
  botAvatarWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  botDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#facc15',
    borderWidth: 2,
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },

  teaser: {
    maxWidth: 320,
    alignSelf: 'center',
    marginBottom: 18,
  },
  teaserText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 17,
  },
  teaserBold: {
    fontFamily: 'Inter_700Bold',
  },

  featureRow: {
    flexDirection: 'row',
    gap: 11,
    marginBottom: 18,
  },
  featureCardWrap: {
    flex: 1,
    minWidth: 0,
  },
  featureCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  featureContent: {
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11.5,
    lineHeight: 14.5,
    textAlign: 'center',
    marginBottom: 5,
  },
  featureSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    lineHeight: 12.5,
    textAlign: 'center',
  },
  featureArrow: {
    marginTop: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frostLayer: {
    zIndex: 1,
  },
  frostDarken: {
    backgroundColor: 'rgba(10,8,20,0.22)',
  },
  soonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  soonBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 7.5,
    color: '#1a1206',
  },
  featureLock: {
    marginTop: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboveFrost: {
    zIndex: 2,
  },

  premiumPanel: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  premiumCrown: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(250,204,21,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTextCol: {
    flex: 1,
  },
  premiumTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  premiumSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 1,
  },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#facc15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
  },
  premiumBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10.5,
    color: '#231400',
  },

  scienceCard: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderColor: 'rgba(139,92,246,0.38)',
  },
  scienceIndex: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 12,
  },
  scienceIndexText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9.5,
    color: '#b39dfb',
  },
  scienceTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 19,
    lineHeight: 23,
    marginBottom: 8,
  },
  scienceDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    lineHeight: 17.5,
    maxWidth: 180,
    marginBottom: 14,
  },
  scienceBold: {
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  scienceVisual: {
    position: 'absolute',
    top: 12,
    right: 8,
    width: 150,
    height: 150,
    opacity: 0.9,
  },
  scienceDots: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#b39dfb',
    width: 16,
    borderRadius: 4,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 14.5,
  },
  otherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },
  otherCardWrap: {
    width: '47%',
  },
  otherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
  },
  otherIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  otherTextCol: {
    flex: 1,
    minWidth: 0,
  },
  otherTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    marginBottom: 2,
  },
  otherSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    lineHeight: 12,
  },
});
