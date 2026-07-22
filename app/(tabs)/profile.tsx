import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { useColors } from '@/hooks/useColors';
import { useDialog } from '@/context/DialogContext';
import { useProgress } from '@/context/ProgressContext';

// Words-per-milestone used for the "next milestone" progress card below —
// a real, derivable number (recentWords.length), not a fabricated level/XP system.
const WORDS_PER_MILESTONE = 25;

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const { recentWords, customStories, streak, profileName, resetAllData } = useProgress();

  const stats = [
    { icon: 'book' as const, value: `${recentWords.length}`, label: 'Kelime' },
    { icon: 'feather' as const, value: `${customStories.length}`, label: 'Hikaye' },
    { icon: 'zap' as const, value: `${streak}`, label: 'Gün seri' },
  ];

  const progressInStep = recentWords.length % WORDS_PER_MILESTONE;
  const milestonePct = Math.round((progressInStep / WORDS_PER_MILESTONE) * 100);
  const wordsToMilestone = WORDS_PER_MILESTONE - progressInStep;

  const handleResetData = () => {
    showDialog({
      variant: 'destructive',
      title: 'Verileri Sıfırla',
      message: 'Bu cihazda kayıtlı tüm ilerleme (öğrenilen kelimeler, hikayeler, seviyeler) silinecek. Bu işlem geri alınamaz.',
      confirmText: 'Sıfırla',
      onConfirm: async () => {
        await resetAllData();
        router.replace('/');
      },
    });
  };

  const menu: {
    key: string;
    label: string;
    icon: keyof typeof Feather.glyphMap;
    route?: string;
  }[] = [
    { key: 'words', label: 'Kelimelerim', icon: 'bookmark', route: '/recent-words' },
    { key: 'stories', label: 'Hikayelerim', icon: 'book-open', route: '/stories' },
    { key: 'themes', label: 'Hazır Temalar', icon: 'grid', route: '/themes' },
    { key: 'notif', label: 'Bildirimler', icon: 'bell' },
    { key: 'settings', label: 'Ayarlar', icon: 'settings' },
    { key: 'help', label: 'Yardım & Destek', icon: 'help-circle' },
  ];

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Feather name="user" size={34} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {profileName || 'Misafir Kullanıcı'}
          </Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]}>
            Yerel profil · bu cihazda saklanır
          </Text>
        </View>

        <GlowCard style={styles.statsCard} active>
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={styles.statItem}>
                <Feather name={s.icon} size={18} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {s.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  {s.label}
                </Text>
              </View>
              {i < stats.length - 1 ? (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              ) : null}
            </React.Fragment>
          ))}
        </GlowCard>

        {/* Progress toward next milestone — real recentWords.length, no fabricated level/XP */}
        <GlowCard style={styles.progressCard}>
          <View style={styles.progressHead}>
            <Text style={[styles.progressTitle, { color: colors.foreground }]}>
              Sonraki kilometre taşına
            </Text>
            <Text style={[styles.progressPct, { color: colors.accent }]}>%{milestonePct}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.secondary }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: colors.primary, width: `${milestonePct}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressHint, { color: colors.mutedForeground }]}>
            {wordsToMilestone} kelime daha öğren, yeni bir kilometre taşına ulaş!
          </Text>
        </GlowCard>

        <View style={styles.menu}>
          {menu.map((m) => (
            <Pressable
              key={m.key}
              onPress={() =>
                m.route
                  ? router.push(m.route as never)
                  : showDialog({ title: m.label, message: 'Bu bölüm demo sürümünde yakında eklenecek.' })
              }
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={m.label}
            >
              <GlowCard style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={m.icon} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                  {m.label}
                </Text>
                <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
              </GlowCard>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleResetData}
          accessibilityRole="button"
          accessibilityLabel="Verileri sıfırla"
          accessibilityHint="Bu cihazdaki tüm ilerlemeyi kalıcı olarak siler"
          style={({ pressed }) => [
            styles.logout,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            Verileri Sıfırla
          </Text>
        </Pressable>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  head: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
  },
  email: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 40,
  },
  progressCard: {
    gap: 10,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  progressPct: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  progressHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  menu: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});
