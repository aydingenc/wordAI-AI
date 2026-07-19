# WordLoop — Aşama 1A.2: Kanonik öğrenme ekranlarına final tasarımın taşınması

Aşama 1A tamamlandı: typecheck 0 hata, kanonik akış `app/learn/*`, üç giriş noktası bağlı, pill/NEW sistemi `learn/story.tsx`'e taşındı, `story-reader.tsx` Redirect ile devre dışı (kodu duruyor). `WORDLOOP_AUDIT_FIX_REPORT.md` proje kökünde.

Sorun: kanonik ekranlar finalize edilmiş tasarımları taşımıyor. `learn/story.tsx` basit kart-listesi düzeninde; asıl okuma deneyimi `story-reader.tsx` kodunda. `learn/quiz.tsx` ve `learn/summary.tsx` finalize edilmiş tasarımlarını hiç almadı.

Bu görev SADECE görsel/etkileşim katmanını taşır. 1A'nın kurduğu route zinciri, parametre sözleşmesi ve pill mantığı DEĞİŞMEYECEK.

## Kurallar

* Yeni npm paketi yükleme; `npm install` / `npx expo install` çalıştırma. Salt-okunur komutlar (`npx tsc --noEmit`, lint) serbest.
* Başlamadan `npx tsc --noEmit` baseline al; sonunda tekrar çalıştır, yeni hata ekleme.
* Git: lokal `audit-phase-1a` branch'i üzerinde devam et; ekran başına küçük, açıklayıcı commit at. Push/PR yok.
* `story-reader.tsx`'i yalnızca KAYNAK olarak oku; Redirect davranışını ve dosyanın kendisini değiştirme.
* Mevcut tasarım tokenlarını kullan: `GradientBackground`, `GlowCard`, `PrimaryButton`, koyu violet kimlik, Inter. İkonlar `@expo/vector-icons` (Feather + MaterialCommunityIcons) — başka ikon seti kullanma.
* Referans HTML dosyaları repoda varsa aç ve birebir uy: `ai-story-live-demo-v25.html`, `quiz-screen-demo-v6.html`, `session-summary-demo-v6.html`. Yoksa bu dosyadaki yazılı spec bağlayıcıdır.
* Denetim raporunu değiştirme; `WORDLOOP_AUDIT_FIX_REPORT.md`'ye sonda "## Aşama 1A.2" bölümü ekle (1A içeriğini silme).

## Görev 1 — `learn/story.tsx`: okuma deneyimini story-reader'dan taşı

Görsel/etkileşim katmanının kaynağı `story-reader.tsx`'teki mevcut RN kodudur — oradan taşı, HTML'den yeniden yazma. Hedef davranış:

* Yapı: 3 bölüm × 4 sayfa = 12 sayfa; sayfa başına ~100 kelime, ~50 kelimelik 2 paragraf; kitap tarzı ilk-satır girintisi; paragraflar arası ~19px boşluk. Mevcut hikâye verisi kısaysa aynı bölümleme mantığı elde olan içeriğe orantılı uygulanır — sahte içerik ÜRETME.
* Bölüm gezintisi: 3 sabit 34x34 numara dairesi (içinde SADECE rakam; rakam kontrastının görünür olduğunu doğrula — bilinen bug) + altında ayrı başlık satırı. Başlık konteynere sığıyorsa statik; taşıyorsa onTextLayout ile ölçülüp marquee (bekle→kay→dur→başa dön, döngü).
* Bölüm başlıkları içerik-temalı isimler; "Giriş/Gelişme/Sonuç" KULLANMA.
* Sayfa dot'ları bölüm-lokal index ile.
* Her bölüm için tam genişlik 170px sayfa görseli (placeholder; yeni asset üretme).
* Çeviri: her paragrafın altında sabit TR bloğu ve global "Türkçe çeviri" switch'i KALDIRILACAK. Yerine: çeviri ikonu, görselin altında TR panelini açar/kapar; sayfa değişince panel otomatik kapanır.
* Düzen: ScrollView + scroll'un DIŞINDA sabit alt bar: küçük "geri" + gradyanlı "Sonraki Sayfa"; 12. sayfada yeşil "Quize Devam Et".
* Mevcut stepper (Hikaye/Quiz/Kartlar) bu düzenle çakışıyorsa kaldırılabilir; header'daki başlık/sahne/seviye bilgisi korunur.
* Pill/NEW sistemi OLDUĞU GİBİ kalır (tek kaynak storyCount; kırmızı/yeşil/amber/mavi; NEW yalnızca kırmızı tier'da ve kelimenin hikâyedeki ilk geçişinde bir kez, kalıcı Set ile). Koru: NEW'in kırmızı-dışı pillere sıçramaması ve tekrar etmemesi — bilinen buglar.
* Çıkış davranışı aynı: ekran sonunda 1A'nın sözleşmesiyle `learn/quiz`'e gidilir.

## Görev 2 — `learn/quiz.tsx`: quiz v6 tasarımı

* Soru sayısı DİNAMİK: hedef kelime başına 1 kelime sorusu + okuduğunu anlama soruları (`targetWords.map(...).concat(comprehensionQuestions)` mantığı). Sabit soru sayısı yazma.
* Sorular tamamen İNGİLİZCE: hikâyeden boşluk doldurma + İngilizce şıklar; anlama soruları da İngilizce. Yalnızca arayüz metinleri (butonlar, başlıklar) Türkçe.
* Soru başına "Yardım" butonu: kesikli çerçeveli ipucu paneli açar. İpucu kelimeye ÖZEL tanımsal bir ipucudur (örn. "Bu kelime, yeni ve bilinmeyen bir şeye atılan, heyecan verici bir deneyimi anlatır.") — kelimenin kendisini SÖYLEMEZ, cevabı doğrudan VERMEZ, ama çıkarım yaptırır. Ne fazla ele veren ne jenerik.
* Sonuç ekranı yüzdeye göre kademeli:
  * %40 altı → 😢 kırmızı halka, başlık "Yeterli değil", alt metin "Metne tekrar dön, bol bol oku ve dinle.", CTA "Hikâye'ye Geri Dön".
  * %40–69 → 🙂 amber, "Fena değil, gelişiyorsun".
  * %70+ → 🎉 yeşil, başlık dinamik: "N Kelime artık senin!" (N = gerçekten doğru cevaplanan kelime sayısı).
* XP = doğru sayısı × kademe çarpanı (5 / 10 / 15).
* Pill dönüşü kelime-bazlı doğru: yalnızca DOĞRU cevaplanan kelimelerin pili kırmızı→yeşil döner (wordResults{kelime:bool} map'i). Yanlış cevaplanan kelime kutlama kademesinde bile kırmızı kalır.
* Pill dönüşü şimdilik kozmetiktir; gerçek storyCount artışı ileride backend işidir. Sahte kalıcılık ekleme — sonuçları mevcut session sözleşmesiyle `learn/summary`'ye aktar.

## Görev 3 — `learn/summary.tsx`: özet v6 tasarımı

* Pop-in rozet + "Harika bir oturumdu!" + hikâye adı + konfeti patlaması.
* 2x2 istatistik grid'i: Toplam XP / Yeni Kelime / Toplam Kelime / Quiz Skoru — hepsi oturumun GERÇEK verisinden.
* Seri banner'ı (🔥 "N günlük seriye ulaştın!"): gerçek seri verisi YOKSA sabit sahte N gösterme — banner'ı gizle veya bu görevde ekleme; durumu raporda not et (1B kalıcılık işinden sonra bağlanacak).
* "Bugün Öğrendiğin Kelimeler" yeşil-pill özet satırı.
* Sağ üst X kapatma: top 28 / right 26 konumu (cihaz köşe yuvarlaklığının kırpmasından kaçınmak için — bilinçli değer, azaltma).
* 3 CTA hiyerarşisi: birincil "Farklı Tema Farklı Hikâyeler" → Hazır Temalar sayfası; ikincil "Bu Kelimelerin Uzmanı Olmak İstiyorum" → pratik hub'ı. DİKKAT: 1A raporu §5'teki PostStoryFlow/pratik-hub erişim durumunu kontrol et — uygulamada gerçek ve çalışan bir hedef yoksa bu ikincil CTA'yı pasif/"Yakında" yap, ölü link bırakma; üçüncül "Aynı Kelimelerden Farklı Hikâye Oluştur" → Kelimelerden Öğren sayfası.
* Düzen dersi: `justify-content:center` + `margin-top:auto` KOMBİNASYONU kullanma (sıkışık küme + tek dev boşluk üretir). `flex-start` + her öğe arasında açık, dengeli dikey marginler kullan.

## Doğrulama ve çıktı

* Üç giriş noktasından (kelimeler / hazır temalar / görsel galeri) özet ekranına kadar zinciri statik olarak yeniden doğrula — 1A'nın route'ları bozulmamalı.
* `npx tsc --noEmit` final: baseline'a göre yeni hata yok.
* `WORDLOOP_AUDIT_FIX_REPORT.md` sonuna "## Aşama 1A.2" bölümü: değiştirilen dosyalar, ekran başına yapılanlar, seri banner'ı ve ikincil CTA kararları, `Gerçek cihazda doğrulanmalı` işaretleri.
* Test etmediğini test edilmiş gösterme.
