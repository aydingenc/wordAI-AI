# WordLoop Phase 2A — WordDNA, SentenceLab ve Kelime Hikâyesi

Bu dizin yalnızca onaylı WordDNA, SentenceLab ve Kelime Hikâyesi backend kapsamını uygular. Mobil ekranlar yeniden tasarlanmadı, hiçbir migration deploy edilmedi ve gerçek Google isteği gönderilmedi.

## Başlangıç fark analizi

Repository başlangıçta bir Supabase dizini veya çalışan backend içermiyordu. Ayrı teslim edilen eski SQL paketinde ise:

- `public.words`, temel metadata ile premium örnekleri, bütün tense metinlerini, `story_en` ve `story_tr` alanlarını aynı public tabloda tutuyordu.
- `select using (true)` politikası nedeniyle korunan metinler istemci tarafından doğrudan alınabiliyordu.
- WordDNA/SentenceLab için ortak günlük 3 benzersiz kelime hakkı, hikâye için günlük 1 kelime hakkı ve atomik sayaç yoktu.
- `user_words` üyelik doğrulaması yoktu.
- Premium kontrolü yalnızca boolean alana dayanabilecek durumdaydı; süre sonu zorunlu olarak denetlenmiyordu.
- Çeviri için kaynak hash’i, tek işlem sahipliği, lease, retry/backoff ve durum tablosu yoktu.
- 16 × 500 yerine 7.999 kayıt vardı; `Science!A429` satırında kelime boş, hikâye ise `nan` hedefiyle bozuktu.
- Import dosyaları düzeltmeleri `on conflict do nothing` ile sessizce atlayabiliyordu.

Phase 2A bu farkları yeni migration, RPC, Edge Function ve testlerle kapatır.

## Migration sırası

Dosyalar timestamp sırasıyla çalıştırılır:

1. `202607210001_phase2a_foundation.sql`
   - metadata tablosu, `user_words`, private içerik, günlük kota tabloları
   - RLS/grant politikaları
   - İstanbul gününe göre atomik `claim_word_feature_access`
2. `202607210002_move_legacy_content.sql`
   - eski geniş `public.words` içeriğini private tabloya kontrollü upsert eder
   - eski `story_tr` metinlerini yalnız private rollback arşivine taşır
   - korunan sütunları `public.words` tablosundan fiziksel olarak kaldırır
3. `202607210003_translation_jobs_and_rate_limits.sql`
   - boş çeviri cache/job tablosu
   - lease token, retry/backoff, source hash ve tek iş sahibi RPC'leri
   - kullanıcı/IP hash tabanlı endpoint rate limit'i
4. `202607210004_repair_science_null.sql`
   - `science-null` metadata ve örneklerini geri ekler
   - `nan` yerine doğru hedefi kullanan yeni İngilizce hikâyeyi yazar
   - Türkçe cache satırı oluşturmaz
5. `202607210005_controlled_word_import.sql`
   - temiz kurulumlar için private staging tablosu ve doğrulamalı upsert pipeline'ı

### Mevcut 7.999 kelimelik veritabanı

Eski `public.words` verisi zaten yüklüyse migration'lar doğrudan sırayla uygulanır. İkinci migration korunan alanları private tabloya taşır; dördüncü migration eksik kaydı tamamlar.

### Temiz veritabanı

Önce beş migration çalıştırılır. Ardından eski paketteki `words_import.csv` dosyası private staging tablosuna yüklenir ve tek transaction'lık doğrulamalı import çağrılır:

```sql
truncate table private.word_import_staging;
```

```text
\copy private.word_import_staging FROM 'words_import.csv' WITH (FORMAT csv, HEADER true)
```

```sql
select public.apply_word_import_staging_service(7999);
```

Fonksiyon; staging satır sayısını, boş/tekrarlı kimlikleri, nihai 8.000 kelimeyi, 16 kategoriyi ve kategori başına 500 kaydı doğrular. Hata varsa transaction geri alınır. `story_tr`, `private.story_translations` tablosuna hiçbir koşulda yazılmaz.

## Endpoint sözleşmeleri

Bütün endpoint'ler `POST`, `Content-Type: application/json` ve `Authorization: Bearer <user JWT>` ister. JWT, istemci claim'ine güvenilmeden `auth.getUser()` ile doğrulanır.

Mobil istemci `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ile açılır. Oturum yoksa Supabase Anonymous Auth üzerinden kalıcı bir anonim kullanıcı oluşturur; aynı cihazdaki oturum güvenli depolamada saklanır. `service_role`, Google service-account veya başka bir sunucu sırrı hiçbir zaman `EXPO_PUBLIC_*` değişkenine yazılmaz. Premium satın alma devreye alınmadan önce anonim kimliğin Apple/Google/e-posta kimliğine bağlanması gerekir.

### `get-word-lab`

Girdi:

```json
{ "word_id": "travel-airport" }
```

İlk üç benzersiz ücretsiz kelime veya aktif premium için `accessMode: "full"` döner. Ücretsiz dördüncü ve sonraki kelimede `accessMode: "preview"` döner. Preview cevabında `mid`, `advanced`, continuous, past, future ve perfect metinleri `null` olarak bile bulunmaz.

```json
{
  "accessMode": "preview",
  "reason": "DAILY_LIMIT_REACHED",
  "isPremium": false,
  "dailyUsage": { "used": 3, "limit": 3, "resetAt": "..." },
  "allowedTabs": { "wordDna": ["basic"], "sentenceLab": ["present"] },
  "word": {},
  "content": {
    "wordDna": { "basic": { "en": "...", "tr": "..." } },
    "sentenceLab": { "present": { "en": "...", "tr": "..." } }
  }
}
```

### `open-word-story`

Girdi:

```json
{ "word_id": "travel-airport" }
```

Ücretsiz ilk benzersiz hikâyede veya premium kullanıcıda İngilizceyi hemen döndürür. Cache yoksa atomik job claim'den sonra çeviriyi `EdgeRuntime.waitUntil()` ile arka planda başlatır. İkinci ücretsiz hikâye `403/PAYWALL_REQUIRED` döndürür ve translation job oluşturulmaz.

```json
{
  "storyAccess": "allowed",
  "storyEn": "...",
  "sourceHash": "64-character-sha256",
  "translationStatus": "processing",
  "translateUnlockRule": "reach_last_page"
}
```

### `get-word-story-translation`

İstemci bu endpoint'i kullanıcı son sayfaya ulaştığında çağırır.

```json
{
  "word_id": "travel-airport",
  "source_hash": "64-character-sha256"
}
```

Hazır cevap:

```json
{ "translationStatus": "completed", "storyTr": "..." }
```

Devam eden veya retry bekleyen cevap:

```json
{ "translationStatus": "processing", "retryAfterSeconds": 2 }
```

Kaynak hikâye değişmişse `409/STALE_SOURCE_HASH` döner; eski hash'e ait çeviri kullanılmaz.

## Translate butonu istemci kuralı

Backend `translateUnlockRule: "reach_last_page"` döndürür. Mobil istemci:

- son sayfadan önce butonu dokunulabilir-kilitli göstermeli,
- erken dokunuşta “Türkçe çeviri, hikâyenin son sayfasına ulaştığında açılacak.” mesajını göstermeli,
- son sayfaya ulaşıldıktan sonra aynı okuma oturumunda tekrar kilitlememeli,
- yalnız son sayfada `get-word-story-translation` çağırmalıdır.

Bu UX kuralı premium güvenlik sınırı değildir; her iki story endpoint'i de üyelik ve günlük/premium hakkı backend'de yeniden doğrular.

## Çeviri sağlayıcısı ve ücret güvenliği

Yerel örnek ayar bilinçli olarak ağ kullanmayan mock sağlayıcıdır:

```text
TRANSLATION_PROVIDER=mock
```

Google yalnız üretimde bilinçli olarak `TRANSLATION_PROVIDER=google` seçildiğinde ve aşağıdaki Edge Function secret'ları tanımlandığında kullanılabilir:

- `TRANSLATION_LIVE_ENABLED=true`
- `GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON_BASE64`
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_LOCATION`

Service-account JSON değeri base64 olarak yalnız Edge Function secret'ında tutulur. Sağlayıcı OAuth 2.0 ile Google Cloud Translation v3 `general/translation-llm` modelini çağırır; uzun metinleri paragraf sınırlarını koruyan güvenli parçalara böler. `TRANSLATION_LIVE_ENABLED` ayrı bir kill-switch'tir. Kimlik bilgisi mobil uygulamaya, SQL'e, loglara veya repository'ye yazılmaz. Bu uygulama sırasında gerçek kimlik bilgisi tanımlanmadı ve gerçek API çağrısı yapılmadı.

## RLS ve grant özeti

| Nesne | `anon` | `authenticated` | Sunucu |
|---|---:|---:|---:|
| `public.words` metadata | SELECT | SELECT | tam |
| `public.user_words` | yok | yalnız kendi satırları | tam |
| `public.entitlements` | yok | yalnız kendi satırı SELECT | tam |
| `private.word_learning_content` | yok | yok | service RPC |
| kota/grant tabloları | yok | yok | güvenli claim RPC |
| translation/cache tabloları | yok | yok | service RPC |

- Private tablolarda RLS açık ve client policy'si yoktur.
- Bütün `SECURITY DEFINER` fonksiyonları `search_path = ''` kullanır.
- Fonksiyonların varsayılan `PUBLIC EXECUTE` yetkileri kaldırılmıştır.
- `service_role` korunan içeriği yalnız Edge Function kullanıcı/üyelik/kota doğrulamasından sonra okur.
- Aktif premium: `is_premium = true AND premium_until > now()`.
- Kota işlemi bucket satırını `FOR UPDATE` kilitler; aynı kelime aynı gün tekrar tüketmez.

## Testler

Ücretsiz ve ağsız birim/statik testleri:

```text
node scripts/test-phase2a.mjs
```

Yerel Supabase veritabanında kota/RLS kabul testi:

```text
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/phase2a_access_control.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/phase2a_premium_scenarios.sql
```

7.999 satırlık katalog import edildikten sonra veri kabul testi ayrıca çalıştırılır:

```text
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/phase2a_catalog_validation.sql
```

Gerçek paralel transaction testi yalnız yerel/test Postgres'e karşı:

```text
DATABASE_URL='postgresql://...' scripts/test-phase2a-concurrency.sh
```

Bu test dört eşzamanlı kelime claim'inde tam erişimi en fazla üçte tutar ve dört eşzamanlı story job claim'inde yalnız bir cache/job satırı ile `attempt_count = 1` bekler. Translation provider çağrılmaz.

## Mock staging kurulumu

Supabase CLI geliştirme bağımlılığı olarak `2.109.1` sürümüne sabitlenmiştir. Kurulum aracı gerçek Google sağlayıcısını hiçbir zaman açmaz; uzak secret değerlerini zorla `TRANSLATION_PROVIDER=mock` ve `TRANSLATION_LIVE_ENABLED=false` yapar. Google service-account bilgisi bu akışta gerekmez.

Önce kaynak katalog doğrulanır:

```text
npm run phase2a:preflight -- --catalog /tam/yol/words_import.csv
npm run phase2a:seed -- /tam/yol/words_import.csv
```

Hiçbir uzak değişiklik yapmayan plan:

```text
npm run phase2a:staging:plan -- --project-ref abcdefghijklmnopqrst --catalog /tam/yol/words_import.csv
```

Deploy yalnız kendi bilgisayarınızda `supabase login` tamamlandıktan ve proje referansına özgü onay değişkeni tanımlandıktan sonra çalışır. Access token, veritabanı parolası ve service-role key repository'ye yazılmaz.

macOS/Linux:

```text
export PHASE2A_DEPLOY_CONFIRM=mock-staging:abcdefghijklmnopqrst
npm run phase2a:staging:deploy -- --project-ref abcdefghijklmnopqrst --catalog /tam/yol/words_import.csv
```

PowerShell:

```text
$env:PHASE2A_DEPLOY_CONFIRM = "mock-staging:abcdefghijklmnopqrst"
npm run phase2a:staging:deploy -- --project-ref abcdefghijklmnopqrst --catalog "C:\\tam\\yol\\words_import.csv"
```

Araç yerel test/preflight sonrasında migration dry-run, migration + seed, anonim auth config, mock Edge secret'ları, üç Edge Function ve linked pgTAP testlerini uygular. Gerçek Translation LLM kapalı kalır.

Deploy sonrasında yalnız public URL ve publishable key ile:

```text
npm run phase2a:staging:smoke
```

Smoke testi yeni bir anonim kullanıcıyla üç tam + bir preview kelimeyi, kilitli alanların fiziksel yokluğunu, ayrı hikâye kotasını, mock arka plan çevirisini ve ikinci hikâyedeki paywall'u doğrular. Gerçek Translation LLM gecikme/kalite testi ayrı maliyet onayına tabidir.

## Geçiş ve geri dönüş notu

Migration 0002 korunan sütunları public tablodan kaldırdığı için uygulamaya alınmadan önce veritabanı yedeği alınmalıdır. Taşınan İngilizce içerik `private.word_learning_content`, reddedilen eski Türkçe metin ise `private.legacy_story_translation_archive` içinde korunur. Böylece geri dönüşte veri kaybı olmadan eski geniş tablo kontrollü olarak yeniden oluşturulabilir. Yeni mobil sürüm endpoint'lere geçirilmeden production migration deploy edilmemelidir.
