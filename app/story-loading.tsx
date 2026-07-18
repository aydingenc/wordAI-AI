import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';

const STAGES = [
  { icon: 'search' as const, label: 'Kelimeler inceleniyor' },
  { icon: 'cpu' as const, label: 'AI hikayeni yazıyor' },
  { icon: 'help-circle' as const, label: 'Quiz hazırlanıyor' },
  { icon: 'check-circle' as const, label: 'Hazır!' },
];

export default function StoryLoadingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentSession } = useProgress();
  const [stage, setStage] = useState(0);
  const spin = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.linear }), -1);
    pulse.value = withRepeat(withTiming(1.15, { duration: 900 }), -1, true);
  }, [spin, pulse]);

  useEffect(() => {
    // No session to build a story from (e.g. reached this screen directly,
    // or the session was cleared mid-flight) — don't run the fake "AI is
    // writing your story" animation for content that doesn't exist. Show
    // the error state below immediately instead of a silent 3.5s wait.
    if (!currentSession) return;
    const timers = [700, 1500, 2300, 3000].map((d, i) =>
      setTimeout(() => setStage(i), d),
    );
    const done = setTimeout(() => {
      router.replace('/learn/story');
    }, 3500);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!currentSession) {
    return (
      <GradientBackground>
        <View style={styles.wrap}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            Aktif bir ders bulunamadı
          </Text>
          <PrimaryButton
            label="Ana Sayfaya Dön"
            icon="home"
            variant="secondary"
            onPress={() => router.replace('/home')}
          />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.wrap}>
        <View style={styles.orbit}>
          <Animated.View
            style={[
              styles.ring,
              { borderColor: colors.primary, borderTopColor: 'transparent' },
              ringStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.core,
              { backgroundColor: colors.primary, shadowColor: colors.primaryGlow },
              coreStyle,
            ]}
          >
            <Feather name="cpu" size={34} color={colors.primaryForeground} />
          </Animated.View>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Hikayen oluşturuluyor
        </Text>

        <View style={styles.stages}>
          {STAGES.map((s, i) => {
            const active = i <= stage;
            return (
              <View key={s.label} style={styles.stageRow}>
                <View
                  style={[
                    styles.stageIcon,
                    {
                      backgroundColor: active ? colors.primary : colors.secondary,
                    },
                  ]}
                >
                  <Feather
                    name={active && i < stage ? 'check' : s.icon}
                    size={15}
                    color={active ? colors.primaryForeground : colors.mutedForeground}
                  />
                </View>
                <Text
                  style={[
                    styles.stageLabel,
                    { color: active ? colors.foreground : colors.mutedForeground },
                  ]}
                >
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 40,
  },
  orbit: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 65,
    borderWidth: 4,
  },
  core: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 10,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
  },
  stages: {
    gap: 14,
    alignSelf: 'stretch',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
});
