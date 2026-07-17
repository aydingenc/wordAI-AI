# WordLoop UI/UX ve Store Hazırlık Denetimi

> **Denetim kapsamı:** Bu rapor, sağlanan proje arşivindeki kaynak kod, route yapısı, ortak bileşenler, mock veri, asset'ler ve Expo yapılandırmasının statik incelenmesiyle hazırlanmıştır. Proje çalıştırılmamış, build alınmamış, dosyalar değiştirilmemiş ve paket kurulmamıştır. Cihaz üzerindeki görsel davranışlar için “çalıştırılarak doğrulanmalı” ifadesi kullanılmıştır.

## 1. Yönetici Özeti

WordLoop’un mevcut sürümü, özellikle onboarding, giriş/kayıt, ana sayfa ve öğrenme başlangıç ekranlarında belirgin bir ürün kimliği oluşturmuş, koyu mor/violet temalı, modern ve dikkat çekici bir mobil prototiptir. Uygulamanın “kelimeleri hikâye, quiz ve kelime kartlarıyla öğrenme” değeri kod ve ekran yapısından anlaşılmaktadır. Ortak `GradientBackground`, `GlowCard`, `PrimaryButton`, `ScreenHeader`, `AnimatedReveal` ve `Chip` bileşenleri tasarım bütünlüğüne olumlu katkı sağlamaktadır.

Bununla birlikte proje bugün itibarıyla **ürün demosu / ileri seviye UI prototipi** durumundadır; gerçek kullanıcıya açık bir store sürümü değildir. Temel nedenler şunlardır:

- Kimlik doğrulama gerçek değildir; form herhangi bir doğrulamadan sonra doğrudan ana sayfaya geçmektedir.
- Kullanıcı adı, e-posta, seri, seviye, skor, ilerleme ve kelime sayılarının önemli bölümü sabit veya mock veridir.
- Öğrenme ilerlemesi yalnızca React Context belleğinde tutulur; uygulama kapanınca yapılan ilerleme kaybolur.
- Görsel yükleme, kamera, Google ile giriş, bildirimler, ayarlar, yardım, premium ve bazı AI aksiyonları yalnızca UI veya demo davranışıdır.
- Günlük tekrar, gerçek hafıza algoritması, hesap silme, veri silme, izin akışları, offline/hata durumları ve store gereklilikleri tamamlanmamıştır.
- İki ayrı öğrenme sonrası akış birlikte bulunmaktadır: `learn/*` route sistemi ile `story-reader` + `PostStoryFlow` tabanlı eski sistem. Bu durum davranış ve tasarım tutarsızlığı riski oluşturur.
- 116 civarı dokunulabilir kontrol bulunmasına karşılık yalnızca birkaç erişilebilirlik özelliği tanımlanmıştır.
- Projede hiç `FlatList` kullanılmazken uzun listelerin tamamı `ScrollView` veya `.map()` ile çizilmektedir.
- TypeScript kontrolü mevcut konfigürasyon nedeniyle başlatılamamıştır: `tsconfig.json` içindeki `ignoreDeprecations: "6.0"`, kurulu TypeScript 5.9.3 tarafından geçersiz kabul edilmektedir.
- `app.json` içinde iOS bundle identifier, Android package adı, izin açıklamaları ve store'a özgü yapılandırmalar eksiktir.

Tasarım açısından güçlü bir temel vardır ve korunmalıdır. Ancak yayın öncesinde yalnızca kozmetik düzenleme değil, temel ürün tamamlanmışlığı, kalıcı veri, gerçek/şeffaf özellik durumu, erişilebilirlik ve store uyumluluğu üzerinde önemli çalışma gereklidir.

## 2. Net Store Kararı

# **D — Henüz store'a hazır değil**

Bu karar tasarımın kötü olmasından değil, mevcut uygulamanın büyük ölçüde mock/local/in-memory prototip olması nedeniyle verilmiştir. Kullanıcı uygulamayı kullanarak bir öğrenme oturumunu görsel olarak tamamlayabilir; fakat hesap, ilerleme, günlük tekrar, profil istatistikleri, yükleme, AI üretimi ve premium gibi birçok alan gerçek ürün davranışına sahip değildir. Uygulama kapatıldığında ilerlemenin kaybolması, aktif görünen fakat çalışmayan özellikler, eksik hesap silme/veri yönetimi ve store yapılandırma eksikleri yayın için engelleyicidir.

**Store seviyesine geçiş için minimum koşul:** Ana öğrenme akışının tek bir kanonik akışta birleşmesi, ilerlemenin kalıcı saklanması, yanıltıcı UI alanlarının kaldırılması veya açıkça “yakında/demo” olarak işaretlenmesi, auth/premium/yükleme kararlarının netleştirilmesi, hesap ve veri yönetimi ekranlarının tamamlanması, erişilebilirlik ve responsive cihaz testlerinin yapılmasıdır.

## 3. Genel Puanlama

| Kategori | Puan | Kısa gerekçe |
|---|---:|---|
| Genel görsel kalite | 7.8/10 | Koyu violet kimlik, gradient, kart ve glow dili güçlü; bazı ekranlar çok yoğun ve farklı token setleri nedeniyle parçalı hissedebilir. |
| Tasarım sistemi tutarlılığı | 6.2/10 | Ortak bileşenler var; ancak birçok büyük ekran kendi `TOKENS` nesnesini ve hardcoded stillerini kullanıyor. Beklenen `AppText`, `AppCard`, `ScreenContainer`, `useResponsive` sistemi bulunmuyor. |
| Kullanıcı akışı | 6.0/10 | Ana öğrenme yolu anlaşılır; fakat iki paralel akış, geri dönüş davranışları, eksik hata/boş durumlar ve sahte aksiyonlar bütünlüğü zedeliyor. |
| İlk kullanım deneyimi | 7.5/10 | Onboarding ve auth görsel açıdan güçlü, değer önerisi belirgin; gerçek hesap oluşturma olmaması kritik eksik. |
| Öğrenme deneyimi | 6.8/10 | Hikâye → quiz → kartlar → özet sırası doğru; gerçek ölçüm, tekrar algoritması ve kalıcı ilerleme yok. |
| Mobil responsive kalite | 5.8/10 | Safe area ve scroll kullanımı yaygın; ancak 54+ büyük sabit ölçü, yatay iki kolonlar ve responsive yardımcı sistemi olmaması risk yaratıyor. |
| Erişilebilirlik | 3.2/10 | Dokunma kontrollerinin çoğunda label/role/hint yok; küçük metinler, renk temelli durumlar ve animasyon azaltma desteği eksik. |
| İçerik ve mikro metinler | 6.4/10 | Türkçe genel olarak anlaşılır; “Hikaye/Hikâye”, seviye adları, demo metinleri ve aktif görünen yakında alanlarında tutarsızlık var. |
| Fonksiyonel tamamlanmışlık | 3.8/10 | Birçok özellik mock, yalnızca UI veya in-memory. Gerçek auth, yükleme, premium, bildirim, ayarlar ve AI yok. |
| Store hazırlığı | 2.8/10 | Bundle/package, izin metinleri, hesap silme, privacy link stratejisi, veri saklama ve store testleri eksik. |
| Premium ürün hissi | 7.3/10 | Görsel atmosfer güçlü; fazla glow, bazı yoğun ekranlar ve dummy bilgiler güven hissini azaltıyor. |
| Genel ürün olgunluğu | 4.8/10 | İleri seviye prototip; gerçek MVP yayınından önce önemli ürün ve teknik tamamlama gerekiyor. |

## 4. Proje ve Ekran Envanteri

### Route ve ekran envanteri

| Ekran | Dosya yolu | Route | Ulaşılabilir mi? | Durum | Not |
|---|---|---|---|---|---|
| Onboarding | `app/index.tsx` | `/` | Evet | Görsel prototip | Auth ekranına ilerler; ilk açılış durumu kalıcı değil. |
| Giriş / Kayıt | `app/auth.tsx` | `/auth` | Evet | Sadece UI / mock auth | Form gönderimi gerçek hesap oluşturmadan `/home` açar. Google ile giriş gerçek değildir. |
| Ana sayfa | `app/(tabs)/home.tsx` | `/home` | Evet | Büyük ölçüde mock | Kullanıcı adı, seviyeler, son kelimeler ve bazı istatistikler sabittir. |
| Kelimelerim | `app/(tabs)/words.tsx` | `/words` | Evet | Mock + context | Başlangıç verisi mock; kalıcılık yok. |
| Hikâyelerim | `app/(tabs)/stories.tsx` | `/stories` | Evet | Mock + context | Tema hikâyeleri ve oturumda oluşturulan hikâyeler. Beklenen üç sekmeli filtre yapısı yok. |
| Keşfet | `app/(tabs)/explore.tsx` | `/explore` | Evet | Kısmen çalışan UI | Tema bağlantıları çalışır; diğer hızlı alanların bazıları route'a bağlıdır. |
| Profil | `app/(tabs)/profile.tsx` | `/profile` | Evet, tab bar'da gizli | Dummy/yarım | Sabit öğrenci bilgileri, %68 ve 7 gün seri; bildirim/ayar/destek Alert gösterir. |
| Öğrenme yolu seçimi | `app/create.tsx` | `/create` | Evet | UI + route bağlantıları | Kelimeler ve görseller akışını başlatır. Büyük ve karmaşık dosya. |
| Kelimelerden öğren bilgi | `app/words-info.tsx` | `/words-info` | Evet | UI | Kelime girişine yönlendirir. |
| Kelime girişi / seviye | `app/words-entry.tsx` | `/words-entry` | Evet | Mock üretim | Dummy CEFR balonları ve 9 saniyelik sahte hazır olma süresi kullanır. |
| Hikâye hazırlanıyor | `app/story-loading.tsx` | `/story-loading` | Evet | Mock zamanlama | Gerçek AI/servis çağrısı yok; session varsa hikâyeye geçer. |
| Görsellerden öğren bilgi | `app/images-info.tsx` | `/images-info` | Evet | UI + mock | Görsel yükleme Alert ile demo olduğunu söyler; mock hikâye üretir. |
| Görsel galeri | `app/images-gallery.tsx` | `/images-gallery` | Evet | Mock galeri | Gerçek fotoğraf/CMS yerine gradient+ikon placeholder'ları içerir. |
| Sahne geçişi | `app/scene-transition.tsx` | `/scene-transition` | Evet | Eski akış köprüsü | `/story-reader` akışına gider; yeni `learn/*` akışından farklıdır. |
| Eski hikâye okuyucu route'u | `app/story-reader.tsx` | `/story-reader` | Dolaylı | Mükerrer akış | `PostStoryFlow` tabanlı alternatif öğrenme sistemi. |
| Hazır temalar | `app/themes.tsx` | `/themes` | Evet | Mock | Tema listesi. |
| Tema detay / seviye yolu | `app/theme/[id].tsx` | `/theme/:id` | Evet | Kısmen çalışan | Seviye kilitleri context'e bağlı; uygulama kapanınca sıfırlanır. |
| Sahne detay | `app/scene/[id].tsx` | `/scene/:id` | Evet | Mock session | Seçilen sahneden oturum oluşturur. |
| Öğrenme hikâyesi | `app/learn/story.tsx` | `/learn/story` | Evet | Ana yeni akış | Çeviri ve hikâye deneyimi; bazı aksiyonlar görsel/yerel düzeyde. |
| Quiz | `app/learn/quiz.tsx` | `/learn/quiz` | Evet | Mock quiz | Sorular `data/mock.ts` tarafından üretilir. |
| Kelime kartları | `app/learn/flashcards.tsx` | `/learn/flashcards` | Evet | Basit yerel durum | Değerlendirme gerçek memory engine'e yazılmaz. |
| Oturum özeti | `app/learn/summary.tsx` | `/learn/summary` | Evet | Kısmen çalışan | Kelimeleri context'e ekler, seviyeyi açar; kalıcı değildir. |
| Son öğrenilen kelimeler | `app/recent-words.tsx` | `/recent-words` | Evet | Context/mock | “Tümü” için ayrı kapsamlı kelime listesi bulunmuyor. |
| Canlı kelime ağı | `app/word-network.tsx` | `/word-network` | Evet | Dummy veri / UI | 432 satır, kendi hardcoded temaları ve sabit ağ koordinatları var. |
| Hikâye detay | `app/story/[id].tsx` | `/story/:id` | Evet | Mock/context | Hikâye okuyucu; kapsamı yeni öğrenme hikâye ekranından farklı. |
| Yasal doküman | `app/legal/[doc].tsx` | `/legal/:doc` | Auth'tan ulaşılır | Yerel metin | Store için gerçek, erişilebilir web URL'si ve hukuki doğrulama gerekir. |
| 404 | `app/+not-found.tsx` | otomatik | Evet | Temel | Ana sayfaya döndürür. |

### Kök route'a kayıtlı olmayan veya otomatik route davranışına bırakılan noktalar

- `+not-found` otomatik sistem route'udur; normaldir.
- Tüm mevcut ana route dosyaları `app/_layout.tsx` içinde tanımlıdır.
- `/profile` route'u tab ekranı olarak tanımlıdır fakat özel tab bar'daki `BAR` listesinde yer almaz; yalnızca ana sayfa ve diğer yönlendirmelerden açılır. Bu tercih bilinçliyse sorun değildir, ancak geri davranışı test edilmelidir.

### Ortak UI bileşenleri

- Güçlü ve tekrar kullanılabilir: `GradientBackground`, `GlowCard`, `PrimaryButton`, `ScreenHeader`, `AnimatedReveal`, `Chip`, `Logo`, `ErrorBoundary`.
- Akışa özel büyük bileşenler: `StoryReader`, `PostStoryFlow`, `QuizScreen`, `SessionSummaryScreen`, `FlashcardsPractice`, `FillBlankPractice`, `MemoryGamePractice`, `SpeedRoundPractice`, `WordMatchPractice`, `WordNetwork`.
- Beklenen fakat projede bulunmayan ortak temel yapılar: `AppText`, `AppCard`, `ScreenContainer`, `useResponsive`, ortak typography/spacing modülü.

### Tema, renk ve tipografi

- `constants/colors.ts` ve `hooks/useColors.ts` temel palette hizmet eder.
- Inter 400/500/600/700 fontları `app/_layout.tsx` içinde yüklenir.
- Tema “automatic” görünse de `CLAUDE.md` açıklamasına göre light ve dark paletler aynı olduğu için uygulama fiilen dark-only çalışır.
- Birçok büyük ekran ortak palette yerine kendi `TOKENS` sabitlerini kullanır; bu durum görsel drift riskidir.

## 5. Eksik veya Atlanmış Ekranlar

Aşağıdaki alanlar önceki ürün hedefleri ve store beklentileriyle karşılaştırıldığında eksik veya tamamlanmamıştır:

| Eksik alan | Kanıt / mevcut durum | Öncelik |
|---|---|---|
| Gerçek Ayarlar ekranı | `app/(tabs)/profile.tsx` içindeki “Ayarlar” yalnızca Alert açıyor. | P1 |
| Bildirim tercihleri | Profilde “Bildirimler” yalnızca demo Alert'i. | P2 |
| Yardım ve destek | Profilde route yok, Alert var. | P2 |
| Hesap silme | Hiçbir route veya aksiyon yok. | P0 |
| Kullanıcı verilerini silme/sıfırlama | Yok. | P0 |
| Gerçek çıkış ve oturum yönetimi | “Çıkış Yap” yalnızca `/` route'una döner. | P1 |
| Günlük tekrar ana ekranı | Kodda ayrı “Bugünkü Tekrar / Günlük Tekrar” route'u yok. | P1 |
| Gerçek tekrar algoritması | Memory Engine bulunmuyor; kart cevapları kalıcı skora işlenmiyor. | P1 |
| Tüm kelimeler ekranı | `/recent-words` var, ancak tüm kelime geçmişi ve filtreli liste yok. | P2 |
| WordDNA detay ekranı | Ayrı WordDNA ekranı bulunmuyor; bazı bağlantılar kelime ağına gidiyor. | P1 |
| SentenceLab detay ekranı | Ayrı route ve kullanıcıya açıklanan bütünleşik ekran yok. | P1 |
| Kelime kartı çalışma merkezi | Yalnızca oturum içi `learn/flashcards` var; tüm/tema/seviye/durum filtreli giriş ekranı yok. | P2 |
| Premium detay ve satın alma durumu | Ana sayfada premium görsel alan var; gerçek premium ekran/şeffaf “yakında” durumu yok. | P1 |
| İnternet yok ekranı | Yok. | P2 |
| Genel hata ekranları | Root ErrorBoundary var, fakat işlem bazlı hata state'leri yok. | P1 |
| Boş durum ekranları | Bazı listelerde veri yokken özel empty-state bulunmuyor. | P2 |
| İzin açıklama/ön bilgilendirme ekranları | Kamera/galeri/mikrofon izin akışları uygulanmamış. | P1 |
| Onboarding tamamlanma kalıcılığı | Uygulamanın her açılışında tekrar gösterilmesini engelleyen saklama yok. | P2 |
| Kullanıcının kaldığı yerden devam etmesi | Session ve ilerleme AsyncStorage/database'e yazılmıyor. | P0 |
| Üst seviye seçimi | Mock akışta Başlangıç/Orta/İleri veya A1-C2 parçaları var; ürün hedefindeki “Üst seviye” net değil. | P2 |
| Hikâyelerim üç sekmeli filtre | Tümü / kendi / hazır tema ayrımı kodda istenen yapıda yok. | P2 |
| UGC güvenlik araçları | Gelecekte paylaşım/topluluk açılacaksa raporla/engelle/moderasyon yok. Şu an yayın kapsamına dahil edilmemeli. | P1 |

## 6. Kullanıcı Akışı Bulguları

### Onboarding → Auth → Ana sayfa

**Güçlü:** Görsel sunum ve ürün vaadi güçlüdür. CTA'nın auth ekranına ilerlemesi açıktır.

**Sorunlar:**
- Onboarding tamamlandı bilgisi saklanmaz; tekrar açılış davranışı koddan kalıcı şekilde yönetilmiyor.
- Auth gerçek değildir. Kullanıcı formun çalıştığını ve hesabının oluştuğunu düşünebilir.
- Form alanlarının gerçek hata doğrulaması, e-posta formatı, şifre politikası ve sunucu hatası bulunmaz.
- Google ile kayıt/giriş aktif görünüp gerçek entegrasyon sunmuyorsa yanıltıcıdır.

### Ana sayfa → “+” → öğrenme yolu

**Güçlü:** Merkezi `+` butonu ve iki ana öğrenme yolu anlaşılır bir giriş noktası oluşturur.

**Sorunlar:**
- Ana sayfadaki Aydın adı, seviye sayıları, son kelime chip'leri ve bazı başarı göstergeleri gerçek kullanıcı verisi değildir.
- Premium alanı gerçek aksiyon sunmuyorsa aktif pazarlama kartı gibi görünmemelidir.
- Ana sayfa 911 satırdır ve çok sayıda modal/karusel/özel UI içerir; küçük değişikliklerde regresyon riski yüksektir.

### Kelimelerden öğren

**Akış:** `/words-info` → `/words-entry` → `/story-loading` → `/learn/story` → `/learn/quiz` → `/learn/flashcards` → `/learn/summary`.

**Güçlü:** Kullanıcının hedef kelime girmesi ve adım adım öğrenmesi net bir ürün akışıdır.

**Sorunlar:**
- Kelime seviyesi `DUMMY_LEVELS` ile döngüsel atanır; kullanıcıya gerçek analiz gibi sunulursa yanıltıcıdır.
- Hikâye hazır olma süresi 9 saniyelik mock timer'dır; gerçek üretim değildir.
- “60 saniye” hazırlık ekranı bileşeni, gerçek işlem durumuyla bağlı değildir.
- Quiz ve kart sonuçları gerçek bir öğrenme modeli veya hafıza skoruna işlenmez.
- Uygulama kapanırsa current session kaybolur ve kullanıcı kaldığı yerden devam edemez.

### Görsellerden öğren

Projede iki farklı görsel akış vardır:

1. `images-info` → `images-gallery` → `scene-transition` → `story-reader` → `PostStoryFlow`
2. `themes` → `theme/[id]` → `scene/[id]` → `story-loading` → `learn/*`

Bu iki sistem aynı temel ürünü farklı route ve bileşenlerle uygular. Kullanıcı iki yoldan farklı quiz/kart/özet deneyimi görebilir. Tek bir kanonik öğrenme akışı seçilmelidir.

**Ek sorunlar:**
- `images-info.tsx` içindeki yükleme düğmesi Alert ile “demo” olduğunu söyler.
- `images-gallery.tsx` gerçek görseller yerine bazı gradient+ikon placeholder'ları kullanır.
- Kamera/galeri izinleri ve gerçek dosya seçimi uygulanmamıştır.
- Kullanıcının yüklediği görselin saklanması, silinmesi ve gizlilik durumu yoktur.

### Hazır temalar ve seviye kilidi

**Güçlü:** Tema → sahne → öğrenme yapısı ve seviyelerin sırayla açılması EdTech açısından mantıklıdır.

**Sorunlar:**
- Kilit ilerlemesi `ProgressContext` içinde bellekte tutulur; uygulama yeniden açıldığında tüm seviyeler sıfırlanır.
- Seviye isimleri ürün genelinde Başlangıç/Orta/İyi, Başlangıç/Orta/İleri ve A1-C2 gibi farklı biçimlerde kullanılır.
- Tamamlama kriteri gerçekten okuma + quiz + kart başarısına bağlı değildir; route sonunda seviye açılabilir.

### Hikâye okuma, çeviri ve ses

- Çeviri deneyimi mevcut akışta yer alır ve öğrenme açısından değerlidir.
- Ses ikonlarının gerçekten Text-to-Speech çalıştırdığı koddan tüm ekranlarda doğrulanamamıştır. Çalışmıyorsa gizlenmeli veya “yakında” olarak sunulmalıdır.
- Eski `StoryReader` ile yeni `learn/story` arasında metin sayfalama, araçlar ve bitirme davranışı farklı olabilir.

### Quiz → kartlar → özet

**Güçlü:** Öğrenme pedagojisine uygun sıralamadır; kullanıcı oturum sonunda sonuç görür.

**Sorunlar:**
- Quiz soruları mock generator ile sınırlıdır.
- Kullanıcının yanlışlarına göre uyarlama yoktur.
- Kartlardaki “Bilmiyorum/Zor/Biliyorum/Çok iyi” seçeneklerinin sonucu gerçek tekrar tarihine veya hafıza skoruna yazılmaz.
- Özet ekranı gerçek performans ölçmek yerine oturum verisi üzerinden basit sonuç üretir.

### Profil ve çıkış

- Profil sayfasında sabit `Öğrenci`, `ogrenci@wordloop.app`, 7 gün seri, %68 ve Lv 5 bilgileri vardır.
- Bildirimler, Ayarlar ve Yardım & Destek çalışmayan menü öğeleridir.
- Çıkış yapma yalnızca route değiştirir; auth state temizlemez çünkü auth state yoktur.

## 7. UI Tasarım Kalitesi

### Güçlü alanlar

- Koyu violet/neon kimlik ayırt edici ve premium algısı oluşturuyor.
- Inter font ailesi doğru bir mobil ürün tercihi.
- Gradient arka plan ve glow kartlar birbirini destekliyor.
- Onboarding, auth, ana sayfa ve create ekranları için korunan bir tasarım standardı belgelenmiş.
- CTA'lar çoğunlukla yüksek kontrastlı ve görsel olarak ayırt edilebilir.
- Safe area kullanımı çok sayıda ekranda mevcuttur.

### Kaliteyi düşüren noktalar

- Her büyük ekranın kendi `TOKENS` ve gradient dizilerini tanımlaması renk, border ve gölge değerlerinin zamanla ayrışmasına yol açar.
- Glow kullanımı birçok yüzeyde aynı anda yoğunlaşırsa görsel hiyerarşi zayıflar; ana CTA ile dekoratif alanlar aynı ağırlığa gelebilir.
- `word-network.tsx`, `home.tsx`, `create.tsx`, `index.tsx`, `words-entry.tsx` gibi ekranlar tek dosyada çok fazla bölüm taşır. Bu doğrudan kullanıcı sorunu değildir, ancak hizalama ve tutarlılık regresyonu riskini artırır.
- 11 px tab label'ları ve bazı muted metinler küçük ekran/büyük font ayarında zor okunabilir.
- Emoji tabanlı tema ikonları ile Feather/MaterialCommunityIcons karışımı tek ikon dili hissini zayıflatır.
- Bazı ekranlar ortak `GlowCard`/`PrimaryButton` kullanırken bazıları tüm stili sıfırdan tanımlar; kart radius, border ve gölge davranışları farklılaşabilir.

### Tasarım kararı

Mevcut kimlik korunmalıdır. Tam yeniden tasarım gereksizdir. Öncelik, en iyi dört referans ekranın görsel dilini ölçülebilir token'lara dönüştürmek ve yeni/ikincil ekranlardaki sapmaları azaltmaktır.

## 8. Tasarım Sistemi Tutarlılığı

| Yapı | Durum | Bulgular |
|---|---|---|
| `AppText` | Yok | Metinlerin çoğu doğrudan React Native `Text` + inline/style tanımı kullanıyor. |
| `AppCard` | Yok | Benzer amaç için `GlowCard` var; bazı ekranlar bunu kullanmıyor. |
| `ScreenContainer` | Yok | Safe area + ScrollView kalıpları ekranlarda tekrar ediliyor. |
| `PrimaryButton` | Var | Fakat tüm CTA'larda kullanılmıyor; farklı özel gradient butonlar var. |
| `colors` | Var | `constants/colors.ts` ve `useColors`; bazı ekranlar kendi TOKENS paletini kullanıyor. |
| `useResponsive` | Yok | Cihaz genişliğine göre ortak ölçek/spacing sistemi bulunmuyor. |
| Ortak spacing | Kısmi | Çoğunlukla 16/20/24 kullanılsa da merkezi token yok. |
| Ortak typography | Kısmi | Inter font ortak; boyut ve line-height token'ları yok. |
| Ortak icon sistemi | Kısmi | Feather, MaterialCommunityIcons ve emoji karışık. |
| Ortak card sistemi | Kısmi | `GlowCard` var; bazı ekranlar özel card stilleri oluşturuyor. |
| Ortak button sistemi | Kısmi | `PrimaryButton` var; çok sayıda özel Pressable/gradient CTA mevcut. |

### Tasarım sisteminden belirgin kaçan alanlar

- `app/word-network.tsx`: kendi geniş tema veri seti, özel token'lar, sabit ağ boyutları ve özel alt navigasyon.
- `components/StoryGenerationCooldown.tsx`: geniş kendi token seti ve çok sayıda özel ölçü.
- `app/images-gallery.tsx`: yerel `TOKENS` ve placeholder kartlar.
- `app/words-entry.tsx`: özel balon görselleri, dummy seviye renk sistemi ve karmaşık form düzeni.
- `app/index.tsx`, `app/create.tsx`, `app/(tabs)/home.tsx`: korunmuş referans ekranlar olmalarına rağmen ortak primitive kullanımının yanında yüksek miktarda özel stil barındırır; görsel referans olarak korunmalı, fakat yeni ekranlar bunların tüm kod kalıbını kopyalamamalıdır.

## 9. Responsive ve Cihaz Uyumluluğu

Statik taramada 54'ten fazla 100 px ve üzeri sabit width/height tanımı görülmüştür. Sabit ölçü tek başına hata değildir; aşağıdaki alanlar cihaz testinde yüksek risklidir.

| Dosya/Ekran | Risk | Seviye | Açıklama |
|---|---|---:|---|
| `app/word-network.tsx` | `NET_BOX_W = 320`, iki kolonlu üst bölüm, sabit düğüm koordinatları | P1 | 320–360 px ekranlarda yatay sıkışma veya taşma; tablet/yatayda gereksiz dar kalma riski. |
| `components/StoryGenerationCooldown.tsx` | 132 px halka, çok aşamalı sabit zaman ve kart düzeni | P2 | Küçük ekran + büyük yazı boyutunda alt bilgi/CTA taşabilir. |
| `app/(tabs)/_layout.tsx` | 62 px FAB, negatif margin, 11 px labels | P2 | Android büyük fontta label taşması; gesture/navigation bar ile FAB konumu test edilmeli. |
| `app/(tabs)/home.tsx` | Çok uzun tek ScrollView ve yoğun kart/karusel | P2 | Düşük cihazlarda render ve büyük fontta kart yüksekliği riski. |
| `app/words-entry.tsx` | Kelime balonları ve yatay seçenekler | P1 | Uzun Türkçe/İngilizce kelimeler ve klavye açıkken CTA görünürlüğü test edilmeli. |
| `app/images-gallery.tsx` | Kart grid/placeholder görseller | P2 | Küçük Android ve tablet kolon davranışı doğrulanmalı. |
| `app/auth.tsx` | Form ve klavye | P1 | Keyboard wrapper mevcut olsa da küçük cihazda kayıt modu + sözleşme metni + CTA test edilmeli. |
| `app/learn/flashcards.tsx` | Kart ve dört değerlendirme butonu | P1 | Uzun çeviri, büyük font ve küçük ekranlarda alt butonlar taşabilir. |
| `app/learn/quiz.tsx` | Cevap seçenekleri | P2 | Uzun cevap metinlerinde sabit kart yüksekliği varsa kırpma riski. |

### Genel responsive değerlendirmesi

- Safe area kullanımı yaygındır ve olumlu bir temeldir.
- 32 `ScrollView` kullanımı uzun ekranların çoğunda taşmayı önler.
- Hiç `FlatList` bulunmaması, büyüyen kelime/hikâye/tema listelerinde performans ve bellek sorununa dönüşebilir.
- `orientation: "portrait"` ile yatay ekran kapatılmıştır; yatay uyumluluk hedeflenmiyorsa bu açıkça ürün kararıdır. Kullanıcı talebindeki yatay ekran testi bu config nedeniyle uygulanamaz.
- `ios.supportsTablet: false`; iPad desteği bilinçli biçimde kapalıdır. Tablet değerlendirmesi yalnızca Android tablet açısından geçerlidir.
- Büyük sistem fontu, `allowFontScaling`, `maxFontSizeMultiplier` veya responsive typography stratejisiyle ele alınmamıştır.

## 10. Erişilebilirlik

Statik taramada yaklaşık 116 Pressable/Touchable kontrolüne karşı yalnızca 4 civarı accessibility prop kullanımı görülmüştür. Bu oran store reddinden çok ürün kalitesi ve kapsayıcılık açısından ciddi eksiktir.

### Başlıca sorunlar

1. İkon-only düğmelerde `accessibilityLabel` ve `accessibilityRole="button"` çoğunlukla yoktur.
2. Seçili tab, kilitli seviye, doğru/yanlış quiz cevabı gibi durumlar ağırlıklı olarak renk ve görselle ifade edilir.
3. Tab label'ları 11 px'tir; düşük görme ve büyük font kullanıcıları için zayıftır.
4. Muted foreground renklerinin koyu arka plandaki kontrastı cihaz üzerinde ölçülmemiştir.
5. Animasyonlar için “reduce motion” kontrolü yoktur; onboarding, reveal, cooldown ve glow animasyonları sistem tercihine göre azaltılmıyor.
6. Form alanlarında placeholder kullanılır; kalıcı label ve hata bağlantısı sınırlıdır.
7. Loading durumları görsel animasyona dayanır; screen reader canlı bölge/duyuru mekanizması yoktur.
8. Sesli içerik çalışacaksa metin alternatifi ve oynatma durumu etiketi gereklidir.
9. Emoji ikonlarının screen reader tarafından anlamsız okunma riski vardır.
10. Dokunma alanlarının bazı ikon butonlarında 44x44 minimumunu karşılayıp karşılamadığı tek tek çalıştırılarak ölçülmelidir.

### Minimum erişilebilirlik paketi

- Tüm ikon-only kontrollerine label, role ve gerekiyorsa hint.
- Tab ve seçimlerde `accessibilityState={{ selected, disabled }}`.
- Quiz sonucunun yalnızca renkle değil ikon + metinle anlatılması.
- Form alanlarına kalıcı label ve anlaşılır hata metni.
- Sistem reduce motion tercihi için animasyon azaltma.
- En küçük metinlerin 12–13 px altına düşmemesi; büyük font testleri.

## 11. EdTech ve Öğrenme Deneyimi

### Kullanıcı ilk dakikada değeri anlıyor mu?

Evet. Hikâye, görsel, quiz ve kelime kartı kombinasyonu onboarding/create akışında anlaşılır. Bu projenin en güçlü ürün tarafıdır.

### Öğrenmeye başlamak kolay mı?

Genel olarak evet. Merkezi `+` ile iki yol ayrımı doğaldır. Ancak kullanıcı ana sayfadaki çok sayıda özellik arasında “bugün ne yapmalıyım?” sorusuna tek bir güçlü günlük CTA ile cevap bulamıyor.

### İlk öğrenme deneyimi uzun mu?

Bilgi ekranı → giriş → 60 saniye görünümlü hazırlık → hikâye → quiz → kartlar → özet dizisi ilk kullanıcı için uzun hissedebilir. Gerçek üretim 9 saniyede hazır olmasına rağmen ekranda 60 saniyelik beklenti metaforu kullanılması özellikle yapay ve yorucu olabilir.

### Başarı hissi var mı?

Özet ve seviye açma mekanizması başarı hissi sağlayabilir. Fakat skorların gerçek performansa dayanmaması ve uygulama kapanınca kaybolması bu hissi ciddi biçimde bozar.

### Durumlar anlaşılır mı?

Yeni/öğreniliyor/mastered/legendary terminolojisi ürün genelinde tek sözlükle uygulanmamış görünmektedir. Bazı ekranlarda seviye, bazı ekranlarda güç/strength, bazı ekranlarda sabit kategori kullanılır. Kullanıcıya kısa bir bilgi ekranı ve tutarlı renk+ikon sistemi gerekir.

### Tekrarın nedeni anlaşılıyor mu?

Ayrı günlük tekrar ekranı ve hafıza risk açıklaması olmadığı için yeterince anlaşılmıyor. Memory Engine henüz gerçek değildir.

### WordDNA ve SentenceLab anlaşılır mı?

Mevcut route envanterinde bu iki özelliği açıklayan tamamlanmış bağımsız ekran yoktur. Kelime ağı WordDNA yerine kullanılıyor gibi görünse de kullanıcı açısından kavramlar ayrışmamıştır.

### Bütünlüklü sistem hissi

Temel öğrenme oturumu bütünlüklüdür; ancak ana sayfadaki kelime ağı, premium, hikâyeler, keşfet ve profil istatistikleri gerçek veriye bağlanmadığı için ürün zaman zaman “özellikler vitrini” hissine döner.

## 12. Metin ve İçerik Sorunları

### Tutarsızlıklar

- `Hikaye` ve `Hikâye` iki biçimde kullanılıyor. Tek standart seçilmeli: Türkçe yazım için “hikâye”.
- `Hikayelerim` ve `Hikâyelerim` farklı dosyalarda/alanlarda görülebilir.
- Seviye terminolojisi: `Başlangıç / Orta / İyi`, `Başlangıç / Orta / İleri`, `A1-A2 / B1-B2 / C1-C2` aynı ürün içinde farklı eşlemelere sahip.
- “Lv 5” Türkçe arayüzde teknik/oyunsal bir kısaltmadır; “5. seviye” daha tutarlıdır.
- “Gün seri” doğal Türkçe değildir; “7 günlük seri” önerilir.
- Profil e-postası ve kullanıcı adı test/dummy içeriktir.
- “AI” ifadesi gerçek AI çalışmayan alanlarda kullanıcıyı yanıltabilir.

### Önerilen mikro metinler

| Mevcut | Önerilen |
|---|---|
| `7 Gün seri` | `7 günlük seri` |
| `32 kelime daha, Lv 5'e ulaş!` | `5. seviyeye ulaşmak için 32 kelime daha öğren.` |
| `Bu bölüm demo sürümünde yakında eklenecek.` | Store sürümünde özellik gizlenmeli; iç testte `Bu özellik henüz kullanıma açık değil.` |
| `Hedef kelime: Apple` | `Bir kelime yaz: apple veya elma` |
| `Hikâyen Hazırlanıyor` (gerçek AI yoksa) | `Örnek hikâye hazırlanıyor` veya özellik tamamen demo etiketiyle sunulmalı. |
| `Hafıza Skoru` (hesaplama yoksa) | `Örnek skor` / alan gizlenmeli. |

### İçerik güveni

Gerçek olmayan skor, seviye, seri ve AI analizleri kullanıcıya “sistem beni ölçüyor” izlenimi verir. Store sürümünde bu bilgilerin tamamı gerçek hesaplamaya bağlanmalı veya kaldırılmalıdır.

## 13. Dummy, Yarım veya Yanıltıcı Özellikler

| Özellik | Durum | Kanıt / dosya | Store riski |
|---|---|---|---|
| E-posta ile kayıt/giriş | Sadece UI | `app/auth.tsx`; form sonunda route değişir | Yüksek |
| Google ile giriş | Sadece UI / koddan gerçek entegrasyon doğrulanamadı | `components/GoogleIcon.tsx`, `app/auth.tsx` | Yüksek |
| Kullanıcı profili | Dummy veri | `app/(tabs)/profile.tsx` | Yüksek |
| Çıkış | Kısmen UI | Yalnızca `router.replace('/')` | Orta |
| Bildirimler | Sadece UI | Profil Alert | Orta |
| Ayarlar | Sadece UI | Profil Alert | Yüksek |
| Yardım & destek | Sadece UI | Profil Alert | Orta |
| Kamera/görsel yükleme | Demo Alert | `app/images-info.tsx` | Yüksek |
| Görsel galeri | Dummy/mock | `data/mock.ts`, `app/images-gallery.tsx` | Orta |
| AI hikâye üretimi | Mock | `buildSessionFromWords`, mock timer | Yüksek |
| Hikâye loading süresi | Mock | `COOLDOWN_MOCK_READY_DELAY = 9000` | Orta |
| Kelime seviye analizi | Dummy | `DUMMY_LEVELS` | Yüksek |
| Sesli dinleme | Koddan tüm akışlarda doğrulanamadı | İkon/aksiyonlar incelenmeli | Yüksek |
| Quiz | Mock ama çalışır | `generateQuiz()` | Düşük; örnek içerik olduğu açık olmalı |
| Kelime kartı değerlendirmesi | Kısmen çalışır | Oturum içi state | Yüksek; tekrar sistemine yazmıyor |
| Günlük tekrar | Eksik | Ayrı route/algoritma yok | Yüksek |
| Hafıza skoru | Dummy/eksik | Gerçek engine yok | Yüksek |
| Seviye kilidi | Kısmen çalışır | Context state | Yüksek; kalıcı değil |
| Kelime ağı | Dummy veri / UI | `app/word-network.tsx` | Orta |
| Premium | Sadece tanıtım/UI | Ana sayfa asset/kart | Yüksek |
| Favori/beğeni/paylaşım | Koddan tam doğrulanamadı / UI riski | Hikâye ekranları | Aktifse yüksek |
| Kalıcı offline kayıt | Yok | AsyncStorage kullanımı yok | Kritik |
| Yasal metin | Yerel örnek | `app/legal/[doc].tsx` | Yüksek; gerçek politika gerekli |

## 14. Store Gereklilikleri

### Expo yapılandırması

`app.json` mevcut durumda geliştirme prototipi için yeterli, store için eksiktir.

| Gereklilik | Durum | Not |
|---|---|---|
| App name | Var | `WordLoop` |
| Version | Var | `1.0.0`; buildNumber/versionCode yok. |
| Icon | Var | Kalitesi, şeffaflık ve adaptive icon cihazda doğrulanmalı. Android adaptive icon yok. |
| Splash | Var | Uygulama ikonu kullanılıyor; profesyonel splash kompozisyonu ve cihaz testi gerekir. |
| iOS bundle identifier | Yok | P0 yayın engeli. |
| Android package | Yok | P0 yayın engeli. |
| iOS buildNumber | Yok | Store sürecinde gerekli. |
| Android versionCode | Yok | Store sürecinde gerekli. |
| iOS tablet | Kapalı | `supportsTablet: false`; bilinçli karar. |
| Orientation | Portrait | Yatay destek yok. |
| Android navigation bar | Tanımsız | Renk/kontrast cihazda test edilmeli. |
| Camera/photo permissions | Tanımsız | Gerçek yükleme eklenecekse açıklamalar zorunlu. |
| Microphone permission | Tanımsız | Ses kaydı yoksa istenmemeli. |
| Notification permission | Tanımsız | Bildirim özelliği yayınlanmayacaksa menü gizlenmeli. |
| Privacy policy URL | Yok | Uygulama içi route var, fakat store listing için erişilebilir URL gerekir. |
| Terms URL | Yok | Store ve destek sitesi stratejisi gerekir. |
| Account deletion | Yok | Hesap oluşturuluyorsa uygulama içinden hesap silme gerekir. |
| Data deletion | Yok | Kullanıcı verisi saklanacaksa gerekli. |
| Contact/support | Eksik | Yardım ekranı demo Alert. |

### Store reddi veya güven riski yaratabilecek alanlar

- Aktif görünen fakat çalışmayan Google giriş, premium, yükleme, bildirim ve ayar aksiyonları.
- Hesap oluşturma izlenimi verip gerçek hesap oluşturmama.
- Hesap silme akışının olmaması.
- Kamera/fotoğraf özelliği sunulup izin metinlerinin olmaması.
- Gerçek olmayan AI/hafıza/skor iddiaları.
- Demo e-posta ve sabit kullanıcı bilgileri.
- Uygulama açıklaması ile gerçek özellikler arasında fark oluşması.

### Çocuklara yönelik içerik

Uygulama eğitim odaklıdır ancak doğrudan çocuk uygulaması olarak konumlandırılıp konumlandırılmayacağı belirlenmelidir. Çocuklara yönelik beyan verilecekse veri toplama, reklam, hesap, içerik ve ebeveyn onayı kuralları ayrıca ele alınmalıdır. Koddan hedef yaş grubu doğrulanamaz.

## 15. Performans ve Kod Kalitesi Riskleri

### Dosya büyüklüğü

| Dosya | Yaklaşık satır | Risk |
|---|---:|---|
| `app/(tabs)/home.tsx` | 911 | Çok sayıda bölüm ve modal; regresyon ve render karmaşıklığı. |
| `app/create.tsx` | 608 | Akış seçimi, pazarlama bölümleri ve etkileşimler tek dosyada. |
| `app/index.tsx` | 585 | Onboarding animasyon ve UI tek dosyada. |
| `app/words-entry.tsx` | 513 | Form, dummy seviye, loading ve akış mantığı birlikte. |
| `app/word-network.tsx` | 432 | UI + büyük hardcoded veri + sabit ağ geometrisi. |
| `app/images-info.tsx` | 410 | Bilgi, yükleme demosu, mock üretim ve cooldown birlikte. |
| `app/auth.tsx` | 387 | Login/signup ve form varyantları tek dosyada. |

Bunlar için proje çapında refactor önerilmez. Ancak store öncesi hata düzeltilecek alanlarda yalnızca yüksek riskli bölümleri küçük alt bileşenlere ayırmak mantıklıdır.

### TypeScript kontrolü

Typecheck komutu çalıştırılmaya çalışıldığında şu yapılandırma hatası oluşmuştur:

- `tsconfig.json(11,27): error TS5103: Invalid value for '--ignoreDeprecations'.`
- Kurulu TypeScript: 5.9.3
- Config: `ignoreDeprecations: "6.0"`

Bu nedenle kaynak dosyalardaki TypeScript hataları doğrulanamamıştır. Store öncesi P1 olarak düzeltilmeli ve temiz typecheck alınmalıdır.

### Liste performansı

- `FlatList` kullanımı yoktur.
- Kelime, hikâye, tema ve galeri içerikleri büyüdüğünde `ScrollView + map` tüm öğeleri aynı anda render eder.
- MVP'de küçük listelerde sorun olmayabilir; 5000 kelime ve çok sayıda hikâye hedefinde sanallaştırılmış liste zorunlu hale gelir.

### State ve veri kalıcılığı

- `ProgressContext` yalnızca `useState` kullanır.
- AsyncStorage kullanımı bulunmamıştır.
- Uygulama kapanması, crash veya update durumunda recentWords, customStories, themeProgress ve currentSession kaybolur.
- Bu P0 ürün riskidir.

### Replit bağımlı scriptler

- `package.json` dev script'i Replit environment değişkenlerine bağlıdır.
- Yerel çalışma için belgelerde farklı komut önerilmiştir.
- Store pipeline kurulurken scriptlerin standart Expo/EAS stratejisine ayrılması gerekir; bu raporda deployment yapılmamıştır.

### Mock veri yoğunluğu

- `data/mock.ts` tüm tema, kelime, quiz, hikâye ve galeri içeriğini taşır.
- `app/word-network.tsx` ayrıca kendi büyük hardcoded tema listesine sahiptir; aynı domain için ikinci veri kaynağıdır.
- Aynı kelime/seviye bilgilerinin farklı dosyalarda ayrışması kullanıcıya tutarsız sonuç gösterebilir.

## 16. Önceliklendirilmiş Bulgular

| ID | Öncelik | Alan | Dosya/Ekran | Sorun | Kullanıcı etkisi | Önerilen çözüm |
|---|---|---|---|---|---|---|
| WL-001 | P0 | Veri | `context/ProgressContext.tsx` | Tüm ilerleme yalnızca bellekte; kalıcı saklama yok. | Uygulama kapanınca öğrenme geçmişi ve kilitler kaybolur. | MVP için yerel kalıcı storage katmanı ekle; session resume ve migration davranışını tanımla. |
| WL-002 | P0 | Store/Auth | `app/auth.tsx`, `app/(tabs)/profile.tsx` | Gerçek hesap yokken hesap varmış gibi UI sunuluyor; hesap silme yok. | Kullanıcı yanıltılır; store politikası riski. | Ya tamamen misafir/local profil olarak açıkla ya da gerçek auth + hesap silme tamamla. |
| WL-003 | P0 | Store config | `app.json` | iOS bundle identifier ve Android package eksik. | Store build/yayın mümkün değil. | Yayın kimliklerini, buildNumber/versionCode'u tanımla. |
| WL-004 | P1 | Akış | `story-reader.tsx`, `components/PostStoryFlow.tsx`, `learn/*` | İki paralel öğrenme sonrası akış. | Farklı girişlerde farklı deneyim ve ilerleme davranışı. | Tek kanonik akış seç; route'ları ona bağla, kullanılmayan yolu gizle/kaldır. |
| WL-005 | P1 | TypeScript | `tsconfig.json` | Typecheck config hatası nedeniyle çalışmıyor. | Gizli tip/navigation hataları yakalanamıyor. | Kurulu TS sürümüyle uyumlu config kullan ve sıfır hata doğrula. |
| WL-006 | P1 | Yanıltıcı UI | `words-entry.tsx` | `DUMMY_LEVELS` gerçek analiz gibi gösterilebilir. | Kullanıcı seviye tespitine güvenemez. | Dummy etiketi ekle veya gerçek kurala bağla; store sürümünde sahte analizi kaldır. |
| WL-007 | P1 | Görsel yükleme | `images-info.tsx` | Yükleme/kamera demo Alert; gerçek izin ve dosya akışı yok. | Ana vaatlerden biri çalışmaz. | Yayından önce tamamla veya özelliği “yakında” olarak pasifleştir. |
| WL-008 | P1 | Erişilebilirlik | Tüm uygulama | 116 dokunulabilir kontrole karşı çok az accessibility prop. | Screen reader kullanıcıları uygulamayı kullanamaz. | Kontrol bazlı label/role/state denetimi yap. |
| WL-009 | P1 | Responsive | `word-network.tsx` | Sabit 320x280 ağ ve iki kolon düzeni. | Küçük telefonda taşma/sıkışma. | Genişliğe göre tek kolon veya ölçeklenen layout kullan. |
| WL-010 | P1 | Ürün | Günlük tekrar | Ayrı ekran ve gerçek algoritma yok. | Ana öğrenme döngüsü tamamlanmaz. | Basit ama gerçek local tekrar kuyruğu ve günlük ekran oluştur. |
| WL-011 | P1 | Profil | `profile.tsx` | Sabit kullanıcı, seri, seviye ve ilerleme. | Güven kaybı ve yanıltıcı metrikler. | Gerçek veriye bağla veya alanları kaldır. |
| WL-012 | P1 | Store | Privacy/terms/account deletion | Uygulama içi örnek metin var; gerçek URL ve veri yönetimi yok. | Store reddi/gizlilik riski. | Hukuken doğrulanmış dokümanlar ve uygulama içi veri silme ekle. |
| WL-013 | P1 | Premium | `home.tsx` | Premium pazarlama alanı var, gerçek durum belirsiz. | Kullanıcı satın alma bekler veya yanıltılır. | MVP'de gizle ya da açık “yakında” non-interactive banner yap. |
| WL-014 | P2 | Tasarım sistemi | Çeşitli ekranlar | Ortak token yerine çok sayıda özel TOKENS/hardcoded renk. | Görsel drift ve bakım riski. | Sadece tekrarlanan temel renk/spacing değerlerini merkezi token'a bağla. |
| WL-015 | P2 | Performans | Liste ekranları | FlatList yok. | 5000 kelimede yavaşlık ve bellek tüketimi. | Büyük listelerde FlatList/SectionList kullan. |
| WL-016 | P2 | Metin | Tüm uygulama | Hikaye/Hikâye, İyi/İleri ve seviye adları tutarsız. | Öğrenme modeli anlaşılmaz. | Tek ürün sözlüğü oluştur ve tüm UI metnini eşitle. |
| WL-017 | P2 | Empty/error | Liste ve öğrenme ekranları | Boş, ağ hatası, üretim hatası, retry state'leri eksik. | Kullanıcı boş veya çıkmaz ekranda kalabilir. | Her ana akış için empty/loading/error/retry durumu tanımla. |
| WL-018 | P2 | Tab navigation | `(tabs)/_layout.tsx` | Profil tab route'u bar'da görünmüyor; tab bar label 11 px. | Navigasyon ve erişilebilirlikte belirsizlik. | Profilin modal/stack mi tab mı olduğuna karar ver; font testleri yap. |
| WL-019 | P2 | İlk kullanım | Onboarding | Tamamlanma durumu saklanmıyor. | Her açılışta onboarding tekrar çıkabilir. | İlk kullanım bayrağını local sakla. |
| WL-020 | P3 | Görsel kalite | İkon sistemi | Emoji + Feather + MaterialCommunityIcons karışık. | Hafif amatör/tutarsız görünüm. | Tema ikonlarını tek görsel stile yaklaştır. |

## 17. Ekran Bazlı Değerlendirme

### Onboarding

- Dosya: `app/index.tsx`
- Route: `/`
- Durum: Görsel olarak güçlü, işlevsel prototip
- Güçlü yönler: Ürün vaadi, premium atmosfer, animasyonlu tanıtım.
- Sorunlar: Tamamlanma bayrağı yok; her açılış senaryosu belirsiz; 585 satırlık karmaşık yapı.
- Kullanıcı riski: Tekrar tekrar onboarding görmek.
- Responsive riski: Küçük ekran ve büyük fontta çok bölümlü içerik.
- Erişilebilirlik riski: Animasyon azaltma ve screen reader sırası.
- Önerilen iyileştirme: Tasarımı koru; yalnızca ilk kullanım saklama, reduce motion ve cihaz testleri ekle.
- Öncelik: P2

### Giriş / Kayıt

- Dosya: `app/auth.tsx`
- Route: `/auth`
- Durum: Sadece UI / mock auth
- Güçlü yönler: Temiz form, güçlü görsel hiyerarşi, yasal linkler.
- Sorunlar: Gerçek auth yok; Google butonu yanıltıcı; hesap silme/şifre sıfırlama yok.
- Kullanıcı riski: Hesap oluşturduğunu sanma, verinin kaybolması.
- Responsive riski: Klavye ve kayıt formu küçük cihazda test edilmeli.
- Erişilebilirlik riski: Placeholder ağırlıklı inputlar, hata ilişkisi eksik.
- Önerilen iyileştirme: Yayın modeli seç: “yerel misafir profil” veya gerçek auth. Aktif olmayan Google butonunu kaldır.
- Öncelik: P0

### Ana Sayfa

- Dosya: `app/(tabs)/home.tsx`
- Route: `/home`
- Durum: Güçlü görsel prototip, önemli ölçüde dummy veri
- Güçlü yönler: Zengin, premium, motivasyon odaklı giriş; ana özelliklere bağlantı.
- Sorunlar: Sabit Aydın adı, seviye metrikleri, son kelimeler, premium ve bazı öneriler; 911 satır.
- Kullanıcı riski: Gerçek ilerleme sanılan sahte metrikler.
- Responsive riski: Yoğun uzun ScrollView, karusel ve modal kombinasyonu.
- Erişilebilirlik riski: Çok sayıda ikon-only kontrol ve küçük yardımcı metin.
- Önerilen iyileştirme: Tasarımı koru; bütün metrikleri context/storage verisine bağla, çalışmayan kartları gizle.
- Öncelik: P1

### Öğrenme Yolu Seçimi

- Dosya: `app/create.tsx`
- Route: `/create`
- Durum: Çalışan route seçim ekranı
- Güçlü yönler: Kelime ve görsel yolları net ayrılıyor; ürün değerini iyi anlatıyor.
- Sorunlar: Görsel yolun iki farklı alt akışa ayrılması; yoğun içerik.
- Kullanıcı riski: Farklı girişlerden farklı öğrenme deneyimi.
- Responsive riski: Küçük telefonlarda uzun kartlar/CTA konumu.
- Erişilebilirlik riski: Kartların role/state tanımları.
- Önerilen iyileştirme: Ekranı koru; her iki yolu tek kanonik session pipeline'a bağla.
- Öncelik: P1

### Kelime Girişi

- Dosya: `app/words-entry.tsx`
- Route: `/words-entry`
- Durum: Mock session oluşturur
- Güçlü yönler: Hedef kelime ekleme ve seviye seçimi ürünün merkezine uygun.
- Sorunlar: Dummy CEFR seviyesi, mock cooldown, uzun dosya, gerçek kelime doğrulama yok.
- Kullanıcı riski: Yanlış seviye bilgisine güvenme; anlamsız kelime girişi.
- Responsive riski: Balonlar, klavye ve CTA.
- Erişilebilirlik riski: Input label, silme ikonları ve seçili durumlar.
- Önerilen iyileştirme: Seviye bilgisini kullanıcı seçimi olarak açıkla veya gerçek local wordBank verisine bağla.
- Öncelik: P1

### Görsellerden Öğren Bilgi/Yükleme

- Dosya: `app/images-info.tsx`
- Route: `/images-info`
- Durum: Demo
- Güçlü yönler: Özelliği pazarlama ve güvenlik açıklaması için uygun zemin.
- Sorunlar: Görsel yükleme sadece Alert; TODO asset notları; mock story.
- Kullanıcı riski: Ana özelliğin çalışmaması.
- Responsive riski: Büyük hero/gradient bölümü.
- Erişilebilirlik riski: Görsel seçme kontrolü ve açıklamalar.
- Önerilen iyileştirme: Store sürümünde tamamla ya da pasif “yakında” tabına dönüştür.
- Öncelik: P1

### Görsel Galeri

- Dosya: `app/images-gallery.tsx`
- Route: `/images-gallery`
- Durum: Mock galeri
- Güçlü yönler: Kategori arama ve sahne seçimi anlaşılır.
- Sorunlar: Bazı kartlar gerçek fotoğraf yerine placeholder; iki farklı akışa bağlanıyor.
- Kullanıcı riski: Kalite algısı düşer, farklı sonuç akışları.
- Responsive riski: Grid ve uzun başlıklar.
- Erişilebilirlik riski: Görsel açıklamaları ve seçili durum.
- Önerilen iyileştirme: Tek görsel standardı ve tek öğrenme route'u.
- Öncelik: P2

### Hazır Temalar / Tema Detay

- Dosya: `app/themes.tsx`, `app/theme/[id].tsx`, `app/scene/[id].tsx`
- Route: `/themes`, `/theme/:id`, `/scene/:id`
- Durum: Mock içerikle çalışan temel akış
- Güçlü yönler: Seviye kilidi ve sahne yolculuğu güçlü EdTech fikri.
- Sorunlar: Kilit kalıcı değil; içerik mock; tamamlanma kriteri zayıf.
- Kullanıcı riski: Açılan seviyelerin kaybolması.
- Responsive riski: Sahne kartları ve kilit metinleri.
- Erişilebilirlik riski: Kilit durumu sadece ikon/renkle anlaşılabilir.
- Önerilen iyileştirme: Kalıcı progression ve açık tamamlanma koşulu.
- Öncelik: P0/P1

### Hikâye Hazırlanıyor

- Dosya: `app/story-loading.tsx`, `components/StoryGenerationCooldown.tsx`
- Route: `/story-loading`
- Durum: Mock süre ve hazır olma
- Güçlü yönler: Bekleme süresini öğretici mikro deneyime dönüştürüyor.
- Sorunlar: 60 saniye görseli ile 9 saniyelik mock hazır olma ilişkisi yapay; gerçek hata/retry yok.
- Kullanıcı riski: Gereksiz bekleme algısı ve AI beklentisi.
- Responsive riski: Halka, kart ve alt CTA sıkışması.
- Erişilebilirlik riski: Zamanlayıcı ve animasyonlar screen reader'a açıklanmıyor.
- Önerilen iyileştirme: Gerçek işlem durumuna bağlı kısa, atlanabilir ve hata destekli loading.
- Öncelik: P1

### Hikâye / Quiz / Kart / Özet

- Dosya: `app/learn/story.tsx`, `app/learn/quiz.tsx`, `app/learn/flashcards.tsx`, `app/learn/summary.tsx`
- Route: `/learn/*`
- Durum: En bütünlüklü ana öğrenme akışı
- Güçlü yönler: Pedagojik sıra doğru, görsel devamlılık iyi, sonuç ekranı motivasyon sağlar.
- Sorunlar: Mock soru/veri, gerçek hafıza kaydı yok, session resume yok.
- Kullanıcı riski: Öğrenmenin ölçülmemesi ve ilerlemenin kaybı.
- Responsive riski: Uzun hikâye, cevap seçenekleri ve dört kart butonu.
- Erişilebilirlik riski: Cevap ve durumların renk ağırlıklı olması.
- Önerilen iyileştirme: Bu akışı kanonik akış olarak koru; local persistence ve gerçek değerlendirme katmanı ekle.
- Öncelik: P0/P1

### Son Öğrenilen Kelimeler / Kelimelerim

- Dosya: `app/recent-words.tsx`, `app/(tabs)/words.tsx`
- Route: `/recent-words`, `/words`
- Durum: Mock/context liste
- Güçlü yönler: Kullanıcıya öğrenilen kelimeleri geri gösterir.
- Sorunlar: Başlangıç mock verisi; tüm kelime listesi, filtre, arama ve empty state eksik.
- Kullanıcı riski: Gerçek geçmişle örnek verinin karışması.
- Responsive riski: Veri büyüdüğünde ScrollView performansı.
- Erişilebilirlik riski: Satır aksiyonlarının label'ları.
- Önerilen iyileştirme: Mock başlangıç içeriğini demo olarak ayır; FlatList + filtreli tüm kelimeler ekranı.
- Öncelik: P2

### Canlı Kelime Ağı

- Dosya: `app/word-network.tsx`
- Route: `/word-network`
- Durum: Etkileşimli dummy UI
- Güçlü yönler: Ayırt edici, etkileyici ve ürün kimliğine uygun özellik.
- Sorunlar: Gerçek kullanıcı kelimelerine bağlı değil; ayrı hardcoded veri kaynağı; özel alt nav; sabit geometri.
- Kullanıcı riski: Öğrenilen kelimelerle ilişkili olduğunu sanma.
- Responsive riski: Yüksek; 320 px ağ ve iki kolon.
- Erişilebilirlik riski: Ağ bağlantıları screen reader için anlamsız.
- Önerilen iyileştirme: Görseli koru; gerçek kelime verisine bağlanana kadar “örnek ağ” etiketi, küçük ekranda tek kolon.
- Öncelik: P1

### Hikâyelerim

- Dosya: `app/(tabs)/stories.tsx`, `app/story/[id].tsx`
- Route: `/stories`, `/story/:id`
- Durum: Mock + oturumda oluşturulan içerik
- Güçlü yönler: İçeriği yeniden okuma motivasyonu.
- Sorunlar: Üç sekmeli kaynak filtresi yok; custom story kalıcı değil; empty state yok.
- Kullanıcı riski: Oluşturduğu hikâyeyi uygulama yeniden açıldığında kaybetme.
- Responsive riski: Uzun listede ScrollView.
- Erişilebilirlik riski: Hikâye kartı görsellerinin label'ları.
- Önerilen iyileştirme: Kalıcılık, kaynak filtresi ve empty state.
- Öncelik: P1

### Keşfet

- Dosya: `app/(tabs)/explore.tsx`
- Route: `/explore`
- Durum: Kısmen çalışan vitrin
- Güçlü yönler: Tema keşfini destekler.
- Sorunlar: “Keşfet” ile ana öğrenme girişinin sorumlulukları örtüşebilir; kilitli/yakında özellik durumu net olmalı.
- Kullanıcı riski: Aktif görünen tamamlanmamış özelliklere basma.
- Responsive riski: Yatay kartlar ve uzun Türkçe başlıklar.
- Erişilebilirlik riski: Kartlar ve kilit durumları.
- Önerilen iyileştirme: Yayında yalnızca çalışan kartları aktif tut.
- Öncelik: P2

### Profil

- Dosya: `app/(tabs)/profile.tsx`
- Route: `/profile`
- Durum: Dummy/yarım
- Güçlü yönler: Düzen temiz, menü hiyerarşisi anlaşılır.
- Sorunlar: Sahte kullanıcı/istatistikler; üç menü çalışmıyor; hesap silme yok.
- Kullanıcı riski: Güven kaybı ve store uyumsuzluğu.
- Responsive riski: Düşük-orta.
- Erişilebilirlik riski: Menü kartlarının button role ve label'ları.
- Önerilen iyileştirme: Store öncesi gerçek veriye bağla, ayarlar ve hesap yönetimini tamamla.
- Öncelik: P0/P1

## 18. Korunması Gereken Güçlü Alanlar

1. **Koyu violet premium kimlik:** Ürünü jenerik dil uygulamalarından ayırıyor.
2. **Onboarding görsel dili:** Değer önerisini anlatma gücü yüksek.
3. **Ana öğrenme sırası:** Hikâye → quiz → kelime kartı → özet dizisi korunmalı.
4. **İki öğrenme yolu:** Kelimelerden ve görsellerden öğrenme ayrımı ürünün temel farklılaştırıcısıdır.
5. **Tema/seviye yolculuğu:** Kullanıcıya hedef ve ilerleme hissi verir.
6. **GlowCard/PrimaryButton/GradientBackground:** Yeni ekranlar için doğru temel primitive'lerdir.
7. **Kelime ağı fikri:** Teknik olarak olgunlaştırıldığında güçlü bir premium özellik olabilir.
8. **Türkçe odaklı açıklamalar:** Hedef kullanıcı için anlaşılabilirlik sağlar.
9. **Safe area ve keyboard provider altyapısı:** Mobil sağlamlık için doğru başlangıçtır.
10. **Root ErrorBoundary:** Beklenmeyen render hataları için olumlu güvenlik ağıdır.

## 19. İyileştirilmesi Gereken Alanlar

### Zorunlu ürün iyileştirmeleri

- Kalıcı local kullanıcı ve öğrenme verisi.
- Tek kanonik öğrenme akışı.
- Günlük tekrar ve gerçek hafıza/tekrar mantığı.
- Gerçek veya şeffaf auth modeli.
- Profil, ayarlar, hesap/veri silme.
- Store config ve izin metinleri.
- Çalışmayan aktif butonların kaldırılması/pasifleştirilmesi.

### UI/UX iyileştirmeleri

- Seviye terminolojisinin tekleştirilmesi.
- Büyük font ve küçük telefon testleri.
- İkon-only kontrollerin erişilebilirliği.
- Kelime ağı ve yoğun ekranlarda responsive tek kolon fallback.
- Mock metriklerin gerçek veriye bağlanması.
- Her ana liste/işlem için empty/error/retry state.

### Kod kalitesi iyileştirmeleri

- Typecheck config düzeltme.
- Büyük listelerde FlatList/SectionList.
- Aynı domain verisinin tek kaynaktan gelmesi.
- Yalnızca sık değişen büyük ekran bölümlerini küçük bileşenlere ayırma; geniş çaplı refactor yapmama.

## 20. Store Öncesi Zorunlu Kontrol Listesi

### Store öncesi kesinlikle yapılmalı

- [ ] iOS bundle identifier ve Android package tanımlandı.
- [ ] iOS buildNumber ve Android versionCode tanımlandı.
- [ ] TypeScript typecheck sıfır hatayla çalışıyor.
- [ ] Uygulama kapanıp açıldığında kullanıcı ilerlemesi korunuyor.
- [ ] Aktif öğrenme session'ı güvenli şekilde devam ettirilebiliyor veya temizleniyor.
- [ ] Gerçek auth kullanılacaksa giriş, kayıt, şifre sıfırlama, çıkış ve hesap silme tamamlandı.
- [ ] Auth kullanılmayacaksa uygulama açıkça local/misafir profil olarak tasarlandı; sahte e-posta ve Google butonu kaldırıldı.
- [ ] Kullanıcı verilerini silme/sıfırlama aksiyonu eklendi.
- [ ] Privacy Policy ve Terms metinleri hukuken doğrulandı ve erişilebilir web URL'leri sağlandı.
- [ ] Çalışmayan Google giriş, premium, yükleme, kamera, bildirim, ayar ve AI aksiyonları tamamlandı veya gizlendi.
- [ ] Kelime/görsel öğrenme yolları tek kanonik hikâye → quiz → kart → özet akışına bağlandı.
- [ ] Günlük tekrar ve en azından basit gerçek tekrar kuyruğu tamamlandı.
- [ ] Dummy seviye, seri, skor ve profil verileri kaldırıldı veya gerçek veriye bağlandı.
- [ ] Kamera/fotoğraf özelliği varsa izin açıklamaları ve kullanıcı veri politikası eklendi.
- [ ] Tüm ana ekranlarda boş, hata, loading ve retry durumları test edildi.
- [ ] Küçük Android, standart iPhone, büyük iPhone ve büyük Android cihazlarında manuel test yapıldı.
- [ ] Büyük sistem yazı boyutu ve screen reader temel akış testi yapıldı.
- [ ] App icon, adaptive icon, splash ve status/navigation bar gerçek cihazda doğrulandı.
- [ ] Demo/debug metinleri ve test kullanıcı verileri kaldırıldı.
- [ ] Uygulama açıklamasında yalnızca gerçekten çalışan özellikler vaat edildi.

### Store öncesi yapılması güçlü şekilde önerilir

- [ ] Tüm ikon-only butonlara accessibility label/role/state eklendi.
- [ ] Tab label fontu ve dokunma alanları erişilebilirlik açısından doğrulandı.
- [ ] Seviye ve kelime durum sözlüğü tekleştirildi.
- [ ] Hikâyelerim için kaynak filtreleri ve boş durumlar eklendi.
- [ ] Tüm kelimeler için FlatList tabanlı arama/filtre ekranı eklendi.
- [ ] Kelime ağı küçük ekranda tek kolon/ölçeklenen düzen aldı.
- [ ] Reduce Motion tercihi desteklendi.
- [ ] Ana sayfadaki bilgi yoğunluğu gerçek kullanıcı hedeflerine göre önceliklendirildi.
- [ ] Premium alanı MVP kapsamına göre ya tamamlandı ya da kaldırıldı.
- [ ] Kullanıcı geri bildirim/destek kanalı eklendi.
- [ ] Hata raporlama için kullanıcıya teknik olmayan mesaj ve tekrar deneme sunuldu.

### Store sonrasına bırakılabilir

- [ ] Gelişmiş adaptif öğrenme algoritması.
- [ ] Gelişmiş WordDNA ilişki görselleştirmesi.
- [ ] SentenceLab içinde AI ile yeni örnek üretme.
- [ ] Sosyal paylaşım, takip, yorum ve sohbet.
- [ ] Gelişmiş premium abonelik paketleri.
- [ ] Tablet için özel çok kolon tasarım.
- [ ] Gelişmiş animasyon ve mikro etkileşimler.
- [ ] Bulut senkronizasyonu; MVP local-first çıkacaksa sonraya kalabilir.

## 21. İkinci Aşamada Yapılabilecek İyileştirmeler

1. **Kişiselleştirilmiş günlük plan:** Kullanıcıya “Bugün 8 kelime, 6 dakika” gibi gerçek veriye dayalı tek CTA.
2. **Hata odaklı tekrar:** Quizde yanlış yapılan kelimeleri bir sonraki kart setine otomatik ekleme.
3. **Kelime durum açıklaması:** Yeni, öğreniliyor, mastered ve legendary için kısa onboarding ve ikonlu legend.
4. **Hikâye seviye yükseltme:** Aynı hedef kelimelerle bir sonraki seviyede yeni hikâye hazırlama.
5. **Kelime ağını gerçek veriyle besleme:** Kullanıcının gerçekten öğrendiği kelimeler ve kaynak hikâyeleri.
6. **SentenceLab:** Kelimenin örnek cümleleri, çeviri, ses ve kullanıcının kendi cümlesi.
7. **İçerik kalite kontrolü:** Türkçe mikro metin sözlüğü ve içerik editör checklist'i.
8. **Performans bütçesi:** Büyük görseller, uzun listeler ve animasyonlar için düşük seviye Android test profili.
9. **Analytics olmadan local ürün sinyalleri:** Kullanıcının kendi cihazında görülebilen tamamlanan oturum, tekrar serisi ve süre özeti.
10. **Erişilebilir animasyonlar:** Reduce motion ve daha sakin tema seçeneği.

## 22. Sonuç

WordLoop’un mevcut tasarım dili ve temel öğrenme fikri değerlidir. Claude önemli bir görsel temel kurmuş; onboarding, ana sayfa, create ekranı ve ana `learn/*` akışı korunmaya değerdir. Ancak bazı önceki hedeflerin yalnızca görsel karşılığı vardır, bazıları hiç eklenmemiştir ve bazıları iki farklı akış halinde tekrarlanmıştır.

En önemli ürün kararı şudur: WordLoop store'a “çok özellik gösteren demo” olarak değil, **az ama tamamen çalışan bir öğrenme döngüsü** olarak çıkmalıdır. İlk sürümde kelimelerden öğrenme, hazır temalar, hikâye, quiz, kartlar, günlük tekrar, kalıcı ilerleme, kelime geçmişi ve temel profil kusursuz çalışmalıdır. Görsel yükleme, Google giriş, AI örnek üretme, premium ve sosyal özellikler tamamlanmamışsa gizlenmelidir.

**Nihai karar: D — Henüz store'a hazır değil.**

Tasarım seviyesi umut verici ve yeniden başlamak gerekmiyor. Store öncesi öncelik, mevcut iyi ekranları koruyarak gerçek veri davranışını, kalıcılığı, tekil akışı, erişilebilirliği ve yayın gerekliliklerini tamamlamaktır.
