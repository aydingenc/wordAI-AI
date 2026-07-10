import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { useColors } from '@/hooks/useColors';

export default function ImageAnalysisLoadingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 38) + 12, paddingBottom: insets.bottom + 24 }]}> 
        <Pressable onPress={() => router.back()} style={[styles.backButton, { borderColor: colors.primary, backgroundColor: 'rgba(139,92,246,0.1)' }]}>
          <Feather name="arrow-left" size={23} color={colors.accent} />
        </Pressable>
        <GlowCard style={styles.card}>
          <LinearGradient colors={[colors.primary, '#A855F7']} style={styles.iconWrap}>
            <MaterialCommunityIcons name="image-search" size={42} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.foreground }]}>Görsel Analizi Hazırlanıyor</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Bu demo akışında gerçek yükleme yapılmaz. Görselden kelime ve hikâye oluşturma deneyimi yakında aktif olacak.</Text>
        </GlowCard>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20, gap: 24 },
  backButton: { width: 43, height: 43, borderRadius: 22, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },
  card: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 27, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 330 },
});
