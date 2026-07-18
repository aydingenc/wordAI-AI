import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';
import { APP_NAME } from '@/constants/app';

type Section = { heading: string; body: string };

const DOCS: Record<string, { title: string; intro: string; sections: Section[] }> = {
  terms: {
    title: 'Kullanım Koşulları',
    intro: `Bu sayfa ${APP_NAME} uygulamasının bir demo sürümüne aittir ve yalnızca örnek amaçlı yer tutucu metin içerir.`,
    sections: [
      {
        heading: '1. Hizmetin Kapsamı',
        body: 'bigFather, dil öğrenmeni kolaylaştırmak için kelimeler ve görsellerden kişisel dersler oluşturan bir öğrenme aracıdır. Bu demo sürümünde gerçek bir hesap oluşturulmaz ve verilerin sunucuda saklanmaz.',
      },
      {
        heading: '2. Hesap ve Sorumluluk',
        body: 'Uygulamayı kullanırken sağladığın bilgilerin doğruluğundan sen sorumlusun. Hesabının güvenliğini korumak ve giriş bilgilerini gizli tutmak senin sorumluluğundadır.',
      },
      {
        heading: '3. İçerik Kullanımı',
        body: 'Uygulama içinde üretilen hikâyeler, quizler ve kelime kartları kişisel öğrenme amaçlıdır. İçerikleri ticari amaçla çoğaltmadan önce ilgili izinleri almalısın.',
      },
      {
        heading: '4. Değişiklikler',
        body: 'Bu koşullar zaman zaman güncellenebilir. Önemli değişikliklerde uygulama içinde bilgilendirileceksin. Kullanmaya devam etmen güncel koşulları kabul ettiğin anlamına gelir.',
      },
    ],
  },
  privacy: {
    title: 'Gizlilik Politikası',
    intro: `${APP_NAME} gizliliğine önem verir. Bu demo sayfası, gerçek bir gizlilik politikasının nasıl görüneceğini gösteren örnek bir metindir.`,
    sections: [
      {
        heading: '1. Toplanan Bilgiler',
        body: 'Bu demo sürümde adın, e-postan veya şifren gibi bilgiler yalnızca cihazında geçici olarak tutulur; herhangi bir sunucuya gönderilmez veya kalıcı olarak saklanmaz.',
      },
      {
        heading: '2. Bilgilerin Kullanımı',
        body: 'Sağladığın bilgiler yalnızca uygulama deneyimini kişiselleştirmek için kullanılır. Üçüncü taraflarla paylaşılmaz ve reklam amacıyla işlenmez.',
      },
      {
        heading: '3. Çerezler ve İzleme',
        body: 'Demo sürüm herhangi bir izleme çerezi veya analitik aracı kullanmaz. Kullanım alışkanlıkların takip edilmez.',
      },
      {
        heading: '4. Haklarına Dair',
        body: 'Verilerinin silinmesini istediğinde uygulamayı kaldırman yeterlidir; cihazında tutulan tüm geçici bilgiler kaldırılır.',
      },
    ],
  },
};

export default function LegalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const data = DOCS[doc ?? 'terms'] ?? DOCS.terms;

  return (
    <GradientBackground>
      <ScreenHeader title={data.title} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>{data.intro}</Text>
        {data.sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={[styles.heading, { color: colors.foreground }]}>{s.heading}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{s.body}</Text>
          </View>
        ))}
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          Son güncelleme: demo sürümü — bu metin yalnızca örnek amaçlıdır.
        </Text>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  intro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
