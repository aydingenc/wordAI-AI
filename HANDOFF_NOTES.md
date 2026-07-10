# Codex Handoff Notes

Bu proje, Replit'te beğenilen mobil frontend prototipinin tasarım dilini koruyarak devam ettirilmelidir. Bu notlar yeni ekran ekleme çalışmalarında mevcut görsel standardın bozulmaması için hazırlanmıştır.

## 1. Korunan ekranlar

Aşağıdaki ekranlar görsel olarak korunacak ana referans ekranlardır. Bu ekranlarda yeniden tasarım, sadeleştirme, renk/spacing değişimi veya layout refactor yapılmamalıdır; yalnızca çalışmayı engelleyen teknik hata varsa minimum düzeltme yapılmalıdır.

- **Onboarding ekranı:** `app/index.tsx`
- **Login / giriş-kayıt ekranı:** `app/auth.tsx`
- **Ana sayfa:** `app/(tabs)/home.tsx`
- **Ana sayfadaki “+” butonuyla açılan akış başlangıç ekranı:** `app/create.tsx`

## 2. Mevcut tasarım standardı

Tasarım dili koyu, premium ve mobil uygulama hissi veren violet/neon atmosfer üzerine kuruludur.

- **Renkler:** Ana arka plan siyah-mor tondadır (`#0B0713`). Kartlar koyu mor yüzeyler, aksanlar violet/magenta glow ile kullanılır. Renk token'ları `constants/colors.ts` içinde tutulur.
- **Kart stili:** Yuvarlatılmış, gölgeli, ince border'lı ve violet glow hissi olan kartlar kullanılır. Mevcut ortak kart bileşeni `components/GlowCard.tsx` dosyasındadır.
- **Butonlar:** Büyük radius, güçlü primary violet dolgu, gölge ve hafif press scale hissi korunur. Mevcut ortak buton bileşeni `components/PrimaryButton.tsx` dosyasındadır.
- **Spacing:** Mobil ekranda nefes alan ama kompakt düzen tercih edilir. Kart içlerinde düzenli padding, ekranlarda safe area uyumlu üst/alt boşluklar kullanılır.
- **Tipografi:** Inter font ailesi ve güçlü başlık hiyerarşisi kullanılır. Başlıklar büyük ve belirgin, açıklamalar muted renkte tutulur.
- **Animasyon yaklaşımı:** Sade, premium hissi veren reveal/pop/press animasyonları kullanılır. Gereksiz hareket veya farklı animasyon dili eklenmemelidir.
- **Arka plan:** `components/GradientBackground.tsx` mevcut siyah/mor gradient atmosferinin ana kaynağıdır; yeni ekranlarda aynı atmosfer tercih edilmelidir.

## 3. Yeni ekran eklerken uyulacak kurallar

- Kullanıcı screenshot veya referans görsel vermeden yeni ekran tasarlama.
- Yeni ekranı mevcut Replit ekranlarının görsel standardına göre ekle; yeni bir tasarım dili oluşturma.
- Korunan ekranlara dokunma; navigation gerekiyorsa yalnızca ilgili buton/route bağlantısını minimum şekilde düzenle.
- Büyük refactor yapma. Değişiklikleri küçük, güvenli ve test edilebilir tut.
- Backend, API, database, Supabase/Firebase, OpenAI API, gerçek auth, ödeme, analytics veya deploy entegrasyonu ekleme.
- Tüm veriler local/mock data olarak kalmalı.
- Görünen UI metinleri Türkçe olmalı. Teknik dosya isimleri İngilizce kalabilir.
- Yeni UI için önce mevcut reusable bileşenleri kullan: `GradientBackground`, `GlowCard`, `PrimaryButton`, `ScreenHeader`, `AnimatedReveal`, `Chip`.

## 4. Mock/local data yapısı

- Mock öğrenme verileri, kelime sözlüğü, quiz üretimi, tema/sahne içeriği ve görseller `data/mock.ts` içinde tutulur.
- Öğrenme ilerlemesi uygulama içinde local state/context olarak yönetilir; kalıcı backend bağlantısı yoktur.
- Yeni örnek içerik gerektiğinde `data/mock.ts` içindeki mevcut tipleri ve generator yaklaşımını koru.
- Kullanıcıya görünen örnek metinler Türkçe olmalı; öğrenilen İngilizce kelimeler ve örnek İngilizce cümleler içerik gereği İngilizce kalabilir.

## 5. Navigation yapısı

- Proje Expo Router kullanır; route dosyaları `app/` altında tutulur.
- Root stack `app/_layout.tsx` içinde tanımlıdır.
- Tab yapısı `app/(tabs)/` klasöründedir.
- Ana akış başlangıcı `app/create.tsx` route'udur; ana sayfadaki “+” aksiyonu bu ekrana yönlenir.
- Kelime akışı `words-info`, `words-entry`, `story-loading` ve `learn/*` ekranlarına ilerler.
- Tema/sahne akışı `themes`, `theme/[id]`, `scene/[id]` ve `learn/*` ekranlarına ilerler.
- Yeni ekran eklenirse route yalnızca ihtiyaç duyulan minimum navigation bağlantısıyla eklenmelidir.
