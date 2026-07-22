# WordLoop Canonical 12.000

Bu dizin, `WordLoop_Canonical_12000_Teknik_Sartname.md` şartnamesinin bu turda uygulanan kapsamını içerir: 8.000 legacy satırın kayıpsız 5.132 canonical kelimeye dönüştürülmesi ve havuzun 6.868 yeni aday + 500 yedekle 12.000'e hazırlanması. Home Search (arama) Edge Function'ları bu turun kapsamı dışındadır; `word_search_aliases` tablosu bu yüzden yalnızca **private** şemada, `service_role` erişimiyle oluşturulmuş ve doldurulmuştur — arama akışının kendisi ayrı bir sonraki fazdır (`audit-home-search-phase-2b`).

Phase 2A'nın hiçbir tablosu, kolonu veya Edge Function'ı silinmedi ya da değiştirilmedi; V1 uçları (`get-word-lab`, `open-word-story`, `get-word-story-translation`) aynen çalışmaya devam eder. Bu faz tamamen eklemelidir.

## Veri kaynağı — fark analizi

Çalışma kitabındaki (`WordLoop_8000den_12000_Benzersiz_Canonical_Havuz.xlsx`) `Örnek_Seti_Varyant` sayfası yalnızca 8 İngilizce alan içeriyor, Türkçe karşılığı hiçbir sayfada yok. İnceleme şunu doğruladı: gerçek EN+TR içerik xlsx'te değil, Phase 2A'nın orijinal `words_import.csv` dosyasında (7.999 satır) + `202607210004_repair_science_null.sql` onarım satırında (`science-null`, 1 satır) bulunuyor. `WordLoop_Legacy_8000_Canonical_Map.csv`'nin kendi `source` kolonu bunu doğruluyor: 7.999 satır `words_import.csv`, 1 satır `repair_migration_202607210004` kaynaklı. Workbook/CSV dosyaları yalnızca ID/gruplama/hash eşlemesi sağlıyor; gerçek içerik iki dosyanın birleşiminden geliyor. Bu, `scripts/canonical-catalog.mjs`'nin temel tasarımıdır.

## Migration sırası

1. `202607220001_canonical_schema.sql` — yeni public/private tablolar, RLS, grant'ler. `word_search_aliases` private şemada (kullanıcı kararı, bkz. aşağıdaki sapma notu).
2. `202607220002_backfill_legacy_to_canonical.sql` — staging tablosu + `apply_canonical_backfill_service()`, sec. 5.8'deki 8 invariant'ı da doğrulayıp transaction'ı rollback eder.
3. `202607220003_remap_user_data_and_grants.sql` — `canonical_user_words` / `canonical_daily_*` (V1 tablolarına dokunmaz, idempotent remap fonksiyonları).
4. `202607220004_canonical_service_rpcs.sql` — V2 payload/entitlement/translation-job RPC'leri + legacy ID resolver.
5. `202607220005_word_content_build_queue.sql` — 6.868 TARGET + 500 RESERVE kuyruğu, atomik claim/publish/reject.

### Şartnameden bilinçli sapma

Şartnamenin 4.1 bölümü `word_search_aliases.normalized_alias`'ı tek başına primary key olarak tanımlıyor. Bu, Ek not 2'nin istediği karşılıklı tire/boşluk alias'ıyla (`"date night"` metninin hem kendi canonical'ına hem `date-night`'ın canonical'ına çözülmesi) birlikte var olamaz — aynı metin iki farklı `canonical_word_id`'ye işaret etmesi gerekiyor. Aynı paragrafın "aynı sorgu birden çok kelimeye gidiyorsa seçim listesi göster" cümlesi zaten çoklu sonucu öngördüğü için, primary key `(normalized_alias, canonical_word_id)` çifti yapıldı. Kullanıcının kendi kararı (private şema, yalnız `service_role`) aynen uygulandı.

## Veri doğrulama sonuçları (gerçek dosyalara karşı çalıştırıldı)

```
npm run canonical:preflight -- \
  --words-import <words_import.csv> \
  --legacy-map <WordLoop_Legacy_8000_Canonical_Map.csv> \
  --canonical-5132 <WordLoop_Canonical_5132.csv> \
  --queue <WordLoop_6868_Yeni_500_Yedek_Kuyruk.csv>
```

Bu turda gerçek dosyalarla çalıştırıldı; şartname sec. 2'deki her sayı, `experience` kontrol örneği, Ek not 1 (5.698 çift vs 5.693 tekil), Ek not 2 (11 tire/boşluk çifti) ve 6.868+500 kuyruk sayıları **birebir eşleşti** (0 fark). Ayrıntılı çıktı PR açıklamasındadır.

## Backfill'i çalıştırma (linked/staging Supabase gerekir)

```
npm run canonical:seed -- --words-import <path> --legacy-map <path>
npm run canonical:queue:seed -- --queue <path>
```

Bu, `.gitignore`'da olan `supabase/seed_canonical_backfill.sql` (~21 MB) ve `supabase/seed_canonical_queue.sql` dosyalarını üretir. Migration'lar deploy edildikten sonra:

```
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed_canonical_backfill.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed_canonical_queue.sql
select public.remap_user_words_to_canonical_service();
select public.remap_daily_grants_to_canonical_service();
```

Bu adım bu turda **çalıştırılmadı** — ortamda `psql`/`supabase`/`docker` yok, bu yüzden gerçek bir Postgres'e karşı invariant doğrulaması yapılamadı. Üretilen seed dosyası offline olarak doğrulandı (satır sayısı, escaping, batch yapısı); asıl `apply_canonical_backfill_service()` çağrısı ancak linked/staging bir projede test edilebilir — tıpkı Phase 2A'nın kendi DB-seviyesi testlerinin de yalnızca staging'de çalıştırılmış olması gibi.

## V2 endpoint'leri

Dört yeni Edge Function, hepsi V1 ile aynı `_shared/*` yardımcılarını (rate limit, auth, error handling) paylaşıyor:

- `get-word-lab-v2` — `{ canonicalWordId, requestedTab? }`
- `open-word-story-v2` — `{ canonicalWordId, storyVariantId? }`
- `get-word-story-translation-v2` — `{ canonicalWordId, storyVariantId, sourceHash, readerReachedLastPage }`; `readerReachedLastPage !== true` ise `403 STORY_NOT_FINISHED`, metin hiç dönmez.
- `resolve-legacy-word` — `{ wordId }`; bilinmeyen legacy id `404 LEGACY_WORD_ID_NOT_FOUND`.

## RLS/grant özeti

| Nesne | anon | authenticated | service_role |
|---|---|---|---|
| `canonical_words` / `_categories` / `_senses` | SELECT (yalnız `published`) | SELECT (yalnız `published`) | tam |
| `word_search_aliases` (private) | yok | yok | tam |
| example set / story variant metni (private) | yok | yok | service RPC |
| `legacy_word_canonical_map` (private) | yok | yok | tam |
| `canonical_story_translations` (private) | yok | yok | service RPC |
| `canonical_user_words` | yok | yalnız kendi satırları | tam |
| `canonical_daily_*` (private) | yok | yok | service RPC |
| `canonical_content_build_queue` (private) | yok | yok | tam |

## Kuyruk algoritması testi

`supabase/tests/canonical_queue_algorithm.test.mjs`, SQL RPC'lerin claim/skip-existing/publish/reject/reserve-fallthrough mantığını JS içinde simüle ederek doğruluyor (yerel Postgres olmadığı için gerçek pgTAP eşzamanlılık testi yerine geçmez, yalnızca algoritmayı doğrular). Kural: TARGET satırları RESERVE'den her zaman önce claim edilir; RESERVE yalnızca tüm TARGET satırları çözüldükten sonra dokunulur. 12.000 hedefinde durma kararı SQL'de değil, batch orkestratöründedir (`get_canonical_content_build_progress_service` ile izlenir).

## Çalıştırılan testler

```
npm run canonical:test    # 27/27 geçti (static SQL kontrolleri, hash/normalizasyon unit testleri, kuyruk algoritma simülasyonu)
npm run phase2a:test      # 15/15 geçti (regresyon yok)
npx tsc -p tsconfig.json --noEmit   # 0 hata
```

pgTAP/gerçek eşzamanlılık testleri ve V2 Edge Function'ların gerçek bir Supabase projesine karşı smoke testi bu turda **çalıştırılmadı** (ortamda psql/supabase/docker yok). Bu adımlar Phase 2A'nın `phase2a:staging:deploy`/`smoke` betiklerine benzer bir "canonical:staging:*" akışıyla ayrı bir onaylı adımda yapılmalıdır.

## Maliyet ve provider notu

Bu turda hiçbir gerçek Gemini/Translation LLM çağrısı yapılmadı, gerçek API anahtarı kullanılmadı veya istenmedi. `publish_canonical_content_build_result_service` yalnızca ÖNCEDEN doğrulanmış JSON payload'ı yazar; provider çağrısı ve şema doğrulaması worker/Edge Function katmanındadır ve yalnızca mock provider ile test edilmelidir. 6.868 kelimenin gerçek batch üretimi ayrı maliyet onayı gerektirir (sec. 8'deki dry-run raporu önce sunulmalı).
