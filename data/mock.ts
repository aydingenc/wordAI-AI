import { ImageSourcePropType } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Word {
  id: string;
  en: string;
  tr: string;
  example: string;
  exampleTr: string;
  phonetic: string;
  /** Memory strength 0-100 for the WordDNA panel */
  strength: number;
}

export type QuizQuestion =
  | {
      type: 'multiple';
      prompt: string;
      options: string[];
      answerIndex: number;
    }
  | {
      type: 'truefalse';
      prompt: string;
      answer: boolean;
    }
  | {
      type: 'fill';
      prompt: string; // sentence containing "___"
      options: string[];
      answerIndex: number;
    };

export interface StoryParagraph {
  en: string;
  tr: string;
}

export interface Story {
  id: string;
  title: string;
  level: string;
  levelCode?: string;
  category: 'custom' | 'theme';
  themeId?: string;
  themeName?: string;
  themeNameEn?: string;
  image?: ImageSourcePropType;
  paragraphs: StoryParagraph[];
  targetWords: string[];
}

export interface Scene {
  id: string;
  themeId: string;
  levelIndex: number;
  levelName: string;
  name: string;
  image: ImageSourcePropType;
  words: Word[];
  paragraphs: StoryParagraph[];
  quiz: QuizQuestion[];
}

export interface Theme {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  image: ImageSourcePropType;
  scenes: Scene[];
}

export interface LearnSession {
  title: string;
  levelName: string;
  targetWords: Word[];
  paragraphs: StoryParagraph[];
  quiz: QuizQuestion[];
  origin: 'words' | 'theme';
  themeId?: string;
  levelIndex?: number;
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export const IMAGES = {
  nature: require('@/assets/images/scene-nature.jpg') as ImageSourcePropType,
  city: require('@/assets/images/scene-city.jpg') as ImageSourcePropType,
  airport: require('@/assets/images/scene-airport.jpg') as ImageSourcePropType,
  cafe: require('@/assets/images/scene-cafe.jpg') as ImageSourcePropType,
  beach: require('@/assets/images/scene-beach.jpg') as ImageSourcePropType,
};

export const LEVEL_NAMES = ['Başlangıç', 'Orta', 'İyi'] as const;
export const LEVEL_CODES = ['A1', 'A2', 'B1'] as const;

// ---------------------------------------------------------------------------
// Word dictionary (learning content stays in English)
// ---------------------------------------------------------------------------

const DICT: Record<string, Omit<Word, 'id' | 'strength'>> = {
  love: { en: 'love', tr: 'sevmek / aşk', example: 'I love learning new languages.', exampleTr: 'Yeni diller öğrenmeyi seviyorum.', phonetic: '/lʌv/' },
  travel: { en: 'travel', tr: 'seyahat etmek', example: 'We travel abroad every summer.', exampleTr: 'Her yaz yurt dışına seyahat ederiz.', phonetic: '/ˈtrævəl/' },
  airport: { en: 'airport', tr: 'havalimanı', example: 'The airport was crowded this morning.', exampleTr: 'Havalimanı bu sabah kalabalıktı.', phonetic: '/ˈeəpɔːt/' },
  coffee: { en: 'coffee', tr: 'kahve', example: 'She drinks coffee without sugar.', exampleTr: 'O, kahveyi şekersiz içer.', phonetic: '/ˈkɒfi/' },
  mountain: { en: 'mountain', tr: 'dağ', example: 'They climbed the tall mountain.', exampleTr: 'Yüksek dağa tırmandılar.', phonetic: '/ˈmaʊntən/' },
  journey: { en: 'journey', tr: 'yolculuk', example: 'Our journey lasted three days.', exampleTr: 'Yolculuğumuz üç gün sürdü.', phonetic: '/ˈdʒɜːni/' },
  sunset: { en: 'sunset', tr: 'gün batımı', example: 'We watched the sunset by the sea.', exampleTr: 'Deniz kenarında gün batımını izledik.', phonetic: '/ˈsʌnset/' },
  dream: { en: 'dream', tr: 'rüya / hayal', example: 'He follows his biggest dream.', exampleTr: 'En büyük hayalinin peşinden gidiyor.', phonetic: '/driːm/' },
  ocean: { en: 'ocean', tr: 'okyanus', example: 'The ocean looked calm and blue.', exampleTr: 'Okyanus sakin ve maviydi.', phonetic: '/ˈəʊʃən/' },
  city: { en: 'city', tr: 'şehir', example: 'The city never sleeps at night.', exampleTr: 'Şehir geceleri hiç uyumaz.', phonetic: '/ˈsɪti/' },
  street: { en: 'street', tr: 'sokak', example: 'The street was full of lights.', exampleTr: 'Sokak ışıklarla doluydu.', phonetic: '/striːt/' },
  building: { en: 'building', tr: 'bina', example: 'That building is very tall.', exampleTr: 'O bina çok yüksek.', phonetic: '/ˈbɪldɪŋ/' },
  ticket: { en: 'ticket', tr: 'bilet', example: 'I bought a ticket to Rome.', exampleTr: "Roma'ya bir bilet aldım.", phonetic: '/ˈtɪkɪt/' },
  luggage: { en: 'luggage', tr: 'bagaj', example: 'She lost her luggage at the gate.', exampleTr: 'Bagajını kapıda kaybetti.', phonetic: '/ˈlʌɡɪdʒ/' },
  flight: { en: 'flight', tr: 'uçuş', example: 'Our flight was delayed by an hour.', exampleTr: 'Uçuşumuz bir saat gecikti.', phonetic: '/flaɪt/' },
  barista: { en: 'barista', tr: 'barista', example: 'The barista made a warm latte.', exampleTr: 'Barista sıcak bir latte yaptı.', phonetic: '/bəˈriːstə/' },
  cup: { en: 'cup', tr: 'fincan', example: 'He filled the cup to the top.', exampleTr: 'Fincanı ağzına kadar doldurdu.', phonetic: '/kʌp/' },
  morning: { en: 'morning', tr: 'sabah', example: 'Every morning starts with tea.', exampleTr: 'Her sabah çayla başlar.', phonetic: '/ˈmɔːnɪŋ/' },
  forest: { en: 'forest', tr: 'orman', example: 'The forest was quiet and green.', exampleTr: 'Orman sessiz ve yeşildi.', phonetic: '/ˈfɒrɪst/' },
  river: { en: 'river', tr: 'nehir', example: 'A cold river ran through the valley.', exampleTr: 'Vadiden soğuk bir nehir akıyordu.', phonetic: '/ˈrɪvə/' },
  beach: { en: 'beach', tr: 'plaj / kumsal', example: 'The beach was warm and golden.', exampleTr: 'Plaj sıcak ve altın rengiydi.', phonetic: '/biːtʃ/' },
  wave: { en: 'wave', tr: 'dalga', example: 'A big wave hit the shore.', exampleTr: 'Büyük bir dalga kıyıya vurdu.', phonetic: '/weɪv/' },
  island: { en: 'island', tr: 'ada', example: 'They sailed to a small island.', exampleTr: 'Küçük bir adaya yelken açtılar.', phonetic: '/ˈaɪlənd/' },
  sun: { en: 'sun', tr: 'güneş', example: 'The sun was bright and warm.', exampleTr: 'Güneş parlak ve sıcaktı.', phonetic: '/sʌn/' },
  book: { en: 'book', tr: 'kitap', example: 'She read a book on the train.', exampleTr: 'Trende bir kitap okudu.', phonetic: '/bʊk/' },
  friend: { en: 'friend', tr: 'arkadaş', example: 'My friend lives in another country.', exampleTr: 'Arkadaşım başka bir ülkede yaşıyor.', phonetic: '/frend/' },
  music: { en: 'music', tr: 'müzik', example: 'They listened to music all night.', exampleTr: 'Bütün gece müzik dinlediler.', phonetic: '/ˈmjuːzɪk/' },
  garden: { en: 'garden', tr: 'bahçe', example: 'The garden smelled like roses.', exampleTr: 'Bahçe gül gibi kokuyordu.', phonetic: '/ˈɡɑːdən/' },
  window: { en: 'window', tr: 'pencere', example: 'Rain fell against the window.', exampleTr: 'Yağmur pencereye vuruyordu.', phonetic: '/ˈwɪndəʊ/' },
  road: { en: 'road', tr: 'yol', example: 'The road was long and empty.', exampleTr: 'Yol uzun ve boştu.', phonetic: '/rəʊd/' },
  adventure: { en: 'adventure', tr: 'macera', example: 'Every trip becomes a new adventure.', exampleTr: 'Her yolculuk yeni bir maceraya dönüşür.', phonetic: '/ədˈventʃə/' },
  sky: { en: 'sky', tr: 'gökyüzü', example: 'The sky turned orange at dusk.', exampleTr: 'Gökyüzü alacakaranlıkta turuncuya döndü.', phonetic: '/skaɪ/' },
  tree: { en: 'tree', tr: 'ağaç', example: 'An old tree stood by the path.', exampleTr: 'Yolun kenarında yaşlı bir ağaç duruyordu.', phonetic: '/triː/' },
  bread: { en: 'bread', tr: 'ekmek', example: 'She bought fresh bread every morning.', exampleTr: 'Her sabah taze ekmek alırdı.', phonetic: '/bred/' },
  breakfast: { en: 'breakfast', tr: 'kahvaltı', example: 'We had a quiet breakfast together.', exampleTr: 'Birlikte sakin bir kahvaltı yaptık.', phonetic: '/ˈbrekfəst/' },
  restaurant: { en: 'restaurant', tr: 'restoran', example: 'The restaurant was full on Friday night.', exampleTr: 'Cuma gecesi restoran doluydu.', phonetic: '/ˈrestrɒnt/' },
  taste: { en: 'taste', tr: 'tat / tatmak', example: 'The soup had a rich, warm taste.', exampleTr: 'Çorbanın zengin, sıcak bir tadı vardı.', phonetic: '/teɪst/' },
  sugar: { en: 'sugar', tr: 'şeker', example: 'He takes his tea without sugar.', exampleTr: 'Çayını şekersiz içer.', phonetic: '/ˈʃʊɡə/' },
  waiter: { en: 'waiter', tr: 'garson', example: 'The waiter recommended the daily special.', exampleTr: 'Garson günün spesiyalini önerdi.', phonetic: '/ˈweɪtə/' },
  movie: { en: 'movie', tr: 'film', example: 'We watched a movie on Saturday night.', exampleTr: 'Cumartesi gecesi bir film izledik.', phonetic: '/ˈmuːvi/' },
  concert: { en: 'concert', tr: 'konser', example: 'The concert lasted almost three hours.', exampleTr: 'Konser neredeyse üç saat sürdü.', phonetic: '/ˈkɒnsət/' },
  dance: { en: 'dance', tr: 'dans', example: 'They danced until midnight.', exampleTr: 'Gece yarısına kadar dans ettiler.', phonetic: '/dɑːns/' },
  actor: { en: 'actor', tr: 'oyuncu', example: 'The actor forgot his lines for a moment.', exampleTr: 'Oyuncu bir an repliklerini unuttu.', phonetic: '/ˈæktə/' },
  theatre: { en: 'theatre', tr: 'tiyatro', example: 'The old theatre was full tonight.', exampleTr: 'Eski tiyatro bu gece doluydu.', phonetic: '/ˈθɪətə/' },
  festival: { en: 'festival', tr: 'festival', example: 'The music festival drew a huge crowd.', exampleTr: 'Müzik festivali büyük bir kalabalık topladı.', phonetic: '/ˈfestɪvəl/' },
  song: { en: 'song', tr: 'şarkı', example: 'She hummed her favorite song.', exampleTr: 'En sevdiği şarkıyı mırıldandı.', phonetic: '/sɒŋ/' },
  laughter: { en: 'laughter', tr: 'kahkaha', example: 'Laughter filled the small room.', exampleTr: 'Küçük odayı kahkaha sesleri doldurdu.', phonetic: '/ˈlɑːftə/' },
  painting: { en: 'painting', tr: 'tablo / resim', example: 'The painting hung above the fireplace.', exampleTr: 'Tablo şöminenin üzerinde asılıydı.', phonetic: '/ˈpeɪntɪŋ/' },
  artist: { en: 'artist', tr: 'sanatçı', example: 'The artist worked in silence for hours.', exampleTr: 'Sanatçı saatlerce sessizce çalıştı.', phonetic: '/ˈɑːtɪst/' },
  museum: { en: 'museum', tr: 'müze', example: 'We spent the afternoon at the museum.', exampleTr: 'Öğleden sonrayı müzede geçirdik.', phonetic: '/mjuˈziːəm/' },
  color: { en: 'color', tr: 'renk', example: 'She chose a warm color for the wall.', exampleTr: 'Duvar için sıcak bir renk seçti.', phonetic: '/ˈkʌlə/' },
  sculpture: { en: 'sculpture', tr: 'heykel', example: 'The sculpture stood in the center of the hall.', exampleTr: 'Heykel salonun ortasında duruyordu.', phonetic: '/ˈskʌlptʃə/' },
  canvas: { en: 'canvas', tr: 'tuval', example: 'He stretched a new canvas for the portrait.', exampleTr: 'Portre için yeni bir tuval gerdi.', phonetic: '/ˈkænvəs/' },
  gallery: { en: 'gallery', tr: 'galeri', example: 'The small gallery opened a new exhibition.', exampleTr: 'Küçük galeri yeni bir sergi açtı.', phonetic: '/ˈɡæləri/' },
  brush: { en: 'brush', tr: 'fırça', example: 'She cleaned her brush after painting.', exampleTr: 'Resim yaptıktan sonra fırçasını temizledi.', phonetic: '/brʌʃ/' },
  portrait: { en: 'portrait', tr: 'portre', example: 'The portrait captured her calm smile.', exampleTr: 'Portre onun sakin gülümsemesini yansıtıyordu.', phonetic: '/ˈpɔːtrət/' },
  creativity: { en: 'creativity', tr: 'yaratıcılık', example: 'The workshop encouraged real creativity.', exampleTr: 'Atölye gerçek bir yaratıcılığı teşvik etti.', phonetic: '/ˌkriːeɪˈtɪvəti/' },
  government: { en: 'government', tr: 'hükümet', example: 'The government announced a new plan.', exampleTr: 'Hükümet yeni bir plan açıkladı.', phonetic: '/ˈɡʌvənmənt/' },
  election: { en: 'election', tr: 'seçim', example: 'The election results surprised everyone.', exampleTr: 'Seçim sonuçları herkesi şaşırttı.', phonetic: '/ɪˈlekʃən/' },
  president: { en: 'president', tr: 'başkan', example: 'The president gave a short speech.', exampleTr: 'Başkan kısa bir konuşma yaptı.', phonetic: '/ˈprezɪdənt/' },
  law: { en: 'law', tr: 'kanun', example: 'The new law takes effect next month.', exampleTr: 'Yeni kanun gelecek ay yürürlüğe giriyor.', phonetic: '/lɔː/' },
  citizen: { en: 'citizen', tr: 'vatandaş', example: 'Every citizen has the right to vote.', exampleTr: 'Her vatandaşın oy kullanma hakkı vardır.', phonetic: '/ˈsɪtɪzən/' },
  vote: { en: 'vote', tr: 'oy', example: 'She cast her vote early in the morning.', exampleTr: 'Oyunu sabah erken saatte kullandı.', phonetic: '/vəʊt/' },
  parliament: { en: 'parliament', tr: 'parlamento', example: 'Parliament debated the issue for hours.', exampleTr: 'Parlamento konuyu saatlerce tartıştı.', phonetic: '/ˈpɑːləmənt/' },
  policy: { en: 'policy', tr: 'politika / ilke', example: 'The company changed its return policy.', exampleTr: 'Şirket iade politikasını değiştirdi.', phonetic: '/ˈpɒləsi/' },
  debate: { en: 'debate', tr: 'tartışma', example: 'The debate lasted longer than planned.', exampleTr: 'Tartışma planlanandan uzun sürdü.', phonetic: '/dɪˈbeɪt/' },
  democracy: { en: 'democracy', tr: 'demokrasi', example: 'Democracy depends on active citizens.', exampleTr: 'Demokrasi aktif vatandaşlara dayanır.', phonetic: '/dɪˈmɒkrəsi/' },
  school: { en: 'school', tr: 'okul', example: 'The school starts at eight every day.', exampleTr: 'Okul her gün sekizde başlar.', phonetic: '/skuːl/' },
  teacher: { en: 'teacher', tr: 'öğretmen', example: 'Our teacher explained the lesson twice.', exampleTr: 'Öğretmenimiz dersi iki kez anlattı.', phonetic: '/ˈtiːtʃə/' },
  student: { en: 'student', tr: 'öğrenci', example: 'Every student handed in the homework.', exampleTr: 'Her öğrenci ödevi teslim etti.', phonetic: '/ˈstjuːdənt/' },
  lesson: { en: 'lesson', tr: 'ders', example: "Today's lesson was about verbs.", exampleTr: 'Bugünkü ders fiiller hakkındaydı.', phonetic: '/ˈlesən/' },
  exam: { en: 'exam', tr: 'sınav', example: 'She studied hard for the exam.', exampleTr: 'Sınav için sıkı çalıştı.', phonetic: '/ɪɡˈzæm/' },
  classroom: { en: 'classroom', tr: 'sınıf', example: 'The classroom was quiet during the test.', exampleTr: 'Sınav sırasında sınıf sessizdi.', phonetic: '/ˈklɑːsruːm/' },
  knowledge: { en: 'knowledge', tr: 'bilgi', example: 'Reading builds knowledge over time.', exampleTr: 'Okumak zamanla bilgi biriktirir.', phonetic: '/ˈnɒlɪdʒ/' },
  library: { en: 'library', tr: 'kütüphane', example: 'He borrowed three books from the library.', exampleTr: 'Kütüphaneden üç kitap ödünç aldı.', phonetic: '/ˈlaɪbrəri/' },
  homework: { en: 'homework', tr: 'ev ödevi', example: 'She finished her homework before dinner.', exampleTr: 'Ev ödevini akşam yemeğinden önce bitirdi.', phonetic: '/ˈhəʊmwɜːk/' },
  run: { en: 'run', tr: 'koşmak', example: 'He runs five kilometers every morning.', exampleTr: 'Her sabah beş kilometre koşar.', phonetic: '/rʌn/' },
  team: { en: 'team', tr: 'takım', example: 'The team trained hard before the match.', exampleTr: 'Takım maçtan önce sıkı çalıştı.', phonetic: '/tiːm/' },
  goal: { en: 'goal', tr: 'gol / hedef', example: 'She scored the winning goal.', exampleTr: 'Kazandıran golü o attı.', phonetic: '/ɡəʊl/' },
  stadium: { en: 'stadium', tr: 'stadyum', example: 'The stadium was packed with fans.', exampleTr: 'Stadyum taraftarlarla doluydu.', phonetic: '/ˈsteɪdiəm/' },
  match: { en: 'match', tr: 'maç', example: 'The match ended in a draw.', exampleTr: 'Maç berabere bitti.', phonetic: '/mætʃ/' },
  champion: { en: 'champion', tr: 'şampiyon', example: 'She became the champion of her category.', exampleTr: 'Kategorisinin şampiyonu oldu.', phonetic: '/ˈtʃæmpiən/' },
  coach: { en: 'coach', tr: 'antrenör', example: 'The coach shouted instructions from the side.', exampleTr: 'Antrenör kenardan talimat bağırdı.', phonetic: '/kəʊtʃ/' },
  victory: { en: 'victory', tr: 'zafer', example: 'The victory was celebrated all night.', exampleTr: 'Zafer bütün gece kutlandı.', phonetic: '/ˈvɪktəri/' },
  athlete: { en: 'athlete', tr: 'sporcu', example: 'The young athlete broke a national record.', exampleTr: 'Genç sporcu ulusal rekor kırdı.', phonetic: '/ˈæθliːt/' },
  training: { en: 'training', tr: 'antrenman', example: 'Morning training starts at six.', exampleTr: 'Sabah antrenmanı altıda başlar.', phonetic: '/ˈtreɪnɪŋ/' },
  computer: { en: 'computer', tr: 'bilgisayar', example: 'The computer restarted on its own.', exampleTr: 'Bilgisayar kendiliğinden yeniden başladı.', phonetic: '/kəmˈpjuːtə/' },
  internet: { en: 'internet', tr: 'internet', example: 'The internet was slow that evening.', exampleTr: 'O akşam internet yavaştı.', phonetic: '/ˈɪntənet/' },
  robot: { en: 'robot', tr: 'robot', example: 'The robot moved the boxes automatically.', exampleTr: 'Robot kutuları otomatik olarak taşıdı.', phonetic: '/ˈrəʊbɒt/' },
  phone: { en: 'phone', tr: 'telefon', example: 'Her phone rang during the meeting.', exampleTr: 'Toplantı sırasında telefonu çaldı.', phonetic: '/fəʊn/' },
  software: { en: 'software', tr: 'yazılım', example: 'The new software fixed the old bug.', exampleTr: 'Yeni yazılım eski hatayı düzeltti.', phonetic: '/ˈsɒftweə/' },
  screen: { en: 'screen', tr: 'ekran', example: 'The screen went dark suddenly.', exampleTr: 'Ekran aniden karardı.', phonetic: '/skriːn/' },
  data: { en: 'data', tr: 'veri', example: 'The data was saved automatically.', exampleTr: 'Veriler otomatik olarak kaydedildi.', phonetic: '/ˈdeɪtə/' },
  device: { en: 'device', tr: 'cihaz', example: 'This device needs to be charged daily.', exampleTr: 'Bu cihazın her gün şarj edilmesi gerekiyor.', phonetic: '/dɪˈvaɪs/' },
  network: { en: 'network', tr: 'ağ', example: 'The network went down for an hour.', exampleTr: 'Ağ bir saatliğine kesildi.', phonetic: '/ˈnetwɜːk/' },
  innovation: { en: 'innovation', tr: 'yenilik', example: 'The company is known for constant innovation.', exampleTr: 'Şirket sürekli yenilikleriyle bilinir.', phonetic: '/ˌɪnəˈveɪʃən/' },
  dress: { en: 'dress', tr: 'elbise', example: 'She wore a simple blue dress.', exampleTr: 'Sade mavi bir elbise giydi.', phonetic: '/dres/' },
  style: { en: 'style', tr: 'tarz', example: 'His style never really changed.', exampleTr: 'Onun tarzı hiç değişmedi.', phonetic: '/staɪl/' },
  fabric: { en: 'fabric', tr: 'kumaş', example: 'The fabric felt soft and light.', exampleTr: 'Kumaş yumuşak ve hafif hissettiriyordu.', phonetic: '/ˈfæbrɪk/' },
  design: { en: 'design', tr: 'tasarım', example: 'The design was simple but elegant.', exampleTr: 'Tasarım sade ama zarifti.', phonetic: '/dɪˈzaɪn/' },
  trend: { en: 'trend', tr: 'trend', example: 'This trend will not last long.', exampleTr: 'Bu trend uzun sürmeyecek.', phonetic: '/trend/' },
  model: { en: 'model', tr: 'manken / model', example: 'The model walked confidently down the runway.', exampleTr: 'Manken podyumda kendinden emin yürüdü.', phonetic: '/ˈmɒdəl/' },
  shoes: { en: 'shoes', tr: 'ayakkabı', example: 'She bought new shoes for the trip.', exampleTr: 'Yolculuk için yeni ayakkabı aldı.', phonetic: '/ʃuːz/' },
  outfit: { en: 'outfit', tr: 'kıyafet', example: 'He picked his outfit the night before.', exampleTr: 'Kıyafetini bir gece önceden seçti.', phonetic: '/ˈaʊtfɪt/' },
  jewelry: { en: 'jewelry', tr: 'mücevher', example: 'The jewelry sparkled under the light.', exampleTr: 'Mücevher ışık altında parladı.', phonetic: '/ˈdʒuːəlri/' },
  boutique: { en: 'boutique', tr: 'butik', example: 'A tiny boutique opened on the corner.', exampleTr: 'Köşede küçük bir butik açıldı.', phonetic: '/buːˈtiːk/' },
  melody: { en: 'melody', tr: 'melodi', example: 'The melody stayed in her head all day.', exampleTr: 'Melodi bütün gün aklından çıkmadı.', phonetic: '/ˈmelədi/' },
  rhythm: { en: 'rhythm', tr: 'ritim', example: 'The drummer kept a steady rhythm.', exampleTr: 'Davulcu sabit bir ritim tuttu.', phonetic: '/ˈrɪðəm/' },
  guitar: { en: 'guitar', tr: 'gitar', example: 'He learned guitar over the summer.', exampleTr: 'Yaz boyunca gitar öğrendi.', phonetic: '/ɡɪˈtɑː/' },
  singer: { en: 'singer', tr: 'şarkıcı', example: 'The singer thanked the crowd twice.', exampleTr: 'Şarkıcı kalabalığa iki kez teşekkür etti.', phonetic: '/ˈsɪŋə/' },
  piano: { en: 'piano', tr: 'piyano', example: 'She practices piano every evening.', exampleTr: 'Her akşam piyano çalışır.', phonetic: '/piˈænəʊ/' },
  band: { en: 'band', tr: 'grup', example: 'The band played until midnight.', exampleTr: 'Grup gece yarısına kadar çaldı.', phonetic: '/bænd/' },
  lyrics: { en: 'lyrics', tr: 'şarkı sözleri', example: 'She wrote the lyrics in one night.', exampleTr: 'Şarkı sözlerini bir gecede yazdı.', phonetic: '/ˈlɪrɪks/' },
  instrument: { en: 'instrument', tr: 'çalgı', example: 'Every child chose a musical instrument.', exampleTr: 'Her çocuk bir müzik çalgısı seçti.', phonetic: '/ˈɪnstrəmənt/' },
  harmony: { en: 'harmony', tr: 'uyum / armoni', example: 'The two voices blended in harmony.', exampleTr: 'İki ses uyum içinde birleşti.', phonetic: '/ˈhɑːməni/' },
  audience: { en: 'audience', tr: 'seyirci / dinleyici', example: 'The audience clapped for several minutes.', exampleTr: 'Seyirciler birkaç dakika alkışladı.', phonetic: '/ˈɔːdiəns/' },
  doctor: { en: 'doctor', tr: 'doktor', example: 'The doctor checked her pulse first.', exampleTr: 'Doktor önce nabzını kontrol etti.', phonetic: '/ˈdɒktə/' },
  hospital: { en: 'hospital', tr: 'hastane', example: 'He was taken to the hospital that night.', exampleTr: 'O gece hastaneye götürüldü.', phonetic: '/ˈhɒspɪtəl/' },
  medicine: { en: 'medicine', tr: 'ilaç', example: 'She takes her medicine every morning.', exampleTr: 'İlacını her sabah alır.', phonetic: '/ˈmedsən/' },
  exercise: { en: 'exercise', tr: 'egzersiz', example: 'Daily exercise improved his mood.', exampleTr: 'Günlük egzersiz onun ruh halini iyileştirdi.', phonetic: '/ˈeksəsaɪz/' },
  nurse: { en: 'nurse', tr: 'hemşire', example: 'The nurse checked on him twice an hour.', exampleTr: 'Hemşire saatte iki kez onu kontrol etti.', phonetic: '/nɜːs/' },
  patient: { en: 'patient', tr: 'hasta', example: 'The patient rested quietly in bed.', exampleTr: 'Hasta yatakta sessizce dinlendi.', phonetic: '/ˈpeɪʃənt/' },
  health: { en: 'health', tr: 'sağlık', example: 'Good sleep is important for your health.', exampleTr: 'İyi uyku sağlığınız için önemlidir.', phonetic: '/helθ/' },
  diet: { en: 'diet', tr: 'diyet / beslenme', example: 'He changed his diet after the checkup.', exampleTr: 'Kontrolden sonra beslenmesini değiştirdi.', phonetic: '/ˈdaɪət/' },
  sleep: { en: 'sleep', tr: 'uyku', example: 'She needs eight hours of sleep.', exampleTr: 'Sekiz saat uykuya ihtiyacı var.', phonetic: '/sliːp/' },
  therapy: { en: 'therapy', tr: 'terapi', example: 'Therapy helped him feel calmer.', exampleTr: 'Terapi onun daha sakin hissetmesine yardımcı oldu.', phonetic: '/ˈθerəpi/' },
  company: { en: 'company', tr: 'şirket', example: 'The company hired ten new employees.', exampleTr: 'Şirket on yeni çalışan işe aldı.', phonetic: '/ˈkʌmpəni/' },
  meeting: { en: 'meeting', tr: 'toplantı', example: 'The meeting ran longer than expected.', exampleTr: 'Toplantı beklenenden uzun sürdü.', phonetic: '/ˈmiːtɪŋ/' },
  manager: { en: 'manager', tr: 'yönetici', example: 'The manager approved the new plan.', exampleTr: 'Yönetici yeni planı onayladı.', phonetic: '/ˈmænɪdʒə/' },
  office: { en: 'office', tr: 'ofis', example: 'The office was empty by six.', exampleTr: 'Ofis saat altıda boşalmıştı.', phonetic: '/ˈɒfɪs/' },
  client: { en: 'client', tr: 'müşteri', example: 'The client asked for a quick reply.', exampleTr: 'Müşteri hızlı bir yanıt istedi.', phonetic: '/ˈklaɪənt/' },
  profit: { en: 'profit', tr: 'kâr', example: 'The store made a small profit this month.', exampleTr: 'Mağaza bu ay küçük bir kâr etti.', phonetic: '/ˈprɒfɪt/' },
  contract: { en: 'contract', tr: 'sözleşme', example: 'They signed the contract on Monday.', exampleTr: 'Sözleşmeyi pazartesi imzaladılar.', phonetic: '/ˈkɒntrækt/' },
  strategy: { en: 'strategy', tr: 'strateji', example: 'The team changed strategy at halftime.', exampleTr: 'Takım devre arasında strateji değiştirdi.', phonetic: '/ˈstrætədʒi/' },
  investment: { en: 'investment', tr: 'yatırım', example: 'That investment paid off within a year.', exampleTr: 'O yatırım bir yıl içinde karşılığını verdi.', phonetic: '/ɪnˈvestmənt/' },
  teamwork: { en: 'teamwork', tr: 'takım çalışması', example: 'Good teamwork made the project easy.', exampleTr: 'İyi takım çalışması projeyi kolaylaştırdı.', phonetic: '/ˈtiːmwɜːk/' },
  dog: { en: 'dog', tr: 'köpek', example: 'The dog waited by the door.', exampleTr: 'Köpek kapının yanında bekledi.', phonetic: '/dɒɡ/' },
  cat: { en: 'cat', tr: 'kedi', example: 'The cat slept on the warm windowsill.', exampleTr: 'Kedi sıcak pencere kenarında uyudu.', phonetic: '/kæt/' },
  bird: { en: 'bird', tr: 'kuş', example: 'A small bird landed on the fence.', exampleTr: 'Küçük bir kuş çitin üzerine kondu.', phonetic: '/bɜːd/' },
  lion: { en: 'lion', tr: 'aslan', example: 'The lion rested under a large tree.', exampleTr: 'Aslan büyük bir ağacın altında dinlendi.', phonetic: '/ˈlaɪən/' },
  elephant: { en: 'elephant', tr: 'fil', example: 'The elephant moved slowly across the field.', exampleTr: 'Fil tarlanın karşısına yavaşça geçti.', phonetic: '/ˈelɪfənt/' },
  fish: { en: 'fish', tr: 'balık', example: 'The fish swam close to the surface.', exampleTr: 'Balık yüzeye yakın yüzdü.', phonetic: '/fɪʃ/' },
  horse: { en: 'horse', tr: 'at', example: 'The horse galloped across the open field.', exampleTr: 'At açık arazide dörtnala koştu.', phonetic: '/hɔːs/' },
  rabbit: { en: 'rabbit', tr: 'tavşan', example: 'A rabbit hid behind the garden wall.', exampleTr: 'Bir tavşan bahçe duvarının arkasına saklandı.', phonetic: '/ˈræbɪt/' },
  tiger: { en: 'tiger', tr: 'kaplan', example: 'The tiger moved silently through the grass.', exampleTr: 'Kaplan otların arasında sessizce ilerledi.', phonetic: '/ˈtaɪɡə/' },
  wildlife: { en: 'wildlife', tr: 'yaban hayatı', example: 'The park protects local wildlife.', exampleTr: 'Park, yerel yaban hayatını korur.', phonetic: '/ˈwaɪldlaɪf/' },
  rain: { en: 'rain', tr: 'yağmur', example: 'The rain stopped just before noon.', exampleTr: 'Yağmur öğleden hemen önce durdu.', phonetic: '/reɪn/' },
  snow: { en: 'snow', tr: 'kar', example: 'Snow covered the entire street.', exampleTr: 'Kar bütün sokağı kapladı.', phonetic: '/snəʊ/' },
  wind: { en: 'wind', tr: 'rüzgar', example: 'A cold wind blew through the valley.', exampleTr: 'Vadiden soğuk bir rüzgar esti.', phonetic: '/wɪnd/' },
  storm: { en: 'storm', tr: 'fırtına', example: 'The storm knocked out the power for hours.', exampleTr: 'Fırtına elektriği saatlerce kesti.', phonetic: '/stɔːm/' },
  cloud: { en: 'cloud', tr: 'bulut', example: 'A single cloud crossed the bright sky.', exampleTr: 'Tek bir bulut parlak gökyüzünü geçti.', phonetic: '/klaʊd/' },
  temperature: { en: 'temperature', tr: 'sıcaklık', example: 'The temperature dropped suddenly at night.', exampleTr: 'Sıcaklık gece aniden düştü.', phonetic: '/ˈtemprətʃə/' },
  forecast: { en: 'forecast', tr: 'hava tahmini', example: 'The forecast promised a sunny weekend.', exampleTr: 'Hava tahmini güneşli bir hafta sonu vaat etti.', phonetic: '/ˈfɔːkɑːst/' },
  sunny: { en: 'sunny', tr: 'güneşli', example: 'It was a sunny day for a walk.', exampleTr: 'Yürüyüş için güneşli bir gündü.', phonetic: '/ˈsʌni/' },
  thunder: { en: 'thunder', tr: 'gök gürültüsü', example: 'Thunder rolled softly in the distance.', exampleTr: 'Uzaktan hafifçe gök gürültüsü duyuldu.', phonetic: '/ˈθʌndə/' },
  season: { en: 'season', tr: 'mevsim', example: 'Autumn is her favorite season.', exampleTr: 'Sonbahar onun en sevdiği mevsim.', phonetic: '/ˈsiːzən/' },
  century: { en: 'century', tr: 'yüzyıl', example: 'The building is almost one century old.', exampleTr: 'Bina neredeyse bir asırlık.', phonetic: '/ˈsentʃəri/' },
  king: { en: 'king', tr: 'kral', example: 'The old king ruled for forty years.', exampleTr: 'Yaşlı kral kırk yıl hüküm sürdü.', phonetic: '/kɪŋ/' },
  empire: { en: 'empire', tr: 'imparatorluk', example: 'The empire once stretched across three continents.', exampleTr: 'İmparatorluk bir zamanlar üç kıtaya yayılıyordu.', phonetic: '/ˈempaɪə/' },
  war: { en: 'war', tr: 'savaş', example: 'The war changed the whole region.', exampleTr: 'Savaş bütün bölgeyi değiştirdi.', phonetic: '/wɔː/' },
  revolution: { en: 'revolution', tr: 'devrim', example: 'The revolution began in a small town.', exampleTr: 'Devrim küçük bir kasabada başladı.', phonetic: '/ˌrevəˈluːʃən/' },
  monument: { en: 'monument', tr: 'anıt', example: 'Tourists gathered around the old monument.', exampleTr: 'Turistler eski anıtın etrafında toplandı.', phonetic: '/ˈmɒnjumənt/' },
  ancient: { en: 'ancient', tr: 'antik', example: 'They explored the ancient ruins together.', exampleTr: 'Antik kalıntıları birlikte keşfettiler.', phonetic: '/ˈeɪnʃənt/' },
  civilization: { en: 'civilization', tr: 'medeniyet', example: 'This civilization lasted for centuries.', exampleTr: 'Bu medeniyet yüzyıllarca sürdü.', phonetic: '/ˌsɪvəlaɪˈzeɪʃən/' },
  heritage: { en: 'heritage', tr: 'miras', example: 'The town is proud of its cultural heritage.', exampleTr: 'Kasaba, kültürel mirasıyla gurur duyuyor.', phonetic: '/ˈherɪtɪdʒ/' },
  timeline: { en: 'timeline', tr: 'zaman çizelgesi', example: 'The museum displayed a full historical timeline.', exampleTr: 'Müze tam bir tarihsel zaman çizelgesi sundu.', phonetic: '/ˈtaɪmlaɪn/' },
  home: { en: 'home', tr: 'ev', example: 'She felt calm as soon as she got home.', exampleTr: 'Eve gider gitmez sakinleşti.', phonetic: '/həʊm/' },
  routine: { en: 'routine', tr: 'rutin', example: 'His morning routine never changes.', exampleTr: 'Sabah rutini hiç değişmez.', phonetic: '/ruːˈtiːn/' },
  commute: { en: 'commute', tr: 'işe gidiş geliş', example: 'The commute takes almost an hour.', exampleTr: 'İşe gidiş geliş neredeyse bir saat sürüyor.', phonetic: '/kəˈmjuːt/' },
  evening: { en: 'evening', tr: 'akşam', example: 'They relaxed together every evening.', exampleTr: 'Her akşam birlikte dinlenirlerdi.', phonetic: '/ˈiːvnɪŋ/' },
  dinner: { en: 'dinner', tr: 'akşam yemeği', example: 'Dinner was ready by seven.', exampleTr: 'Akşam yemeği saat yedide hazırdı.', phonetic: '/ˈdɪnə/' },
  weekend: { en: 'weekend', tr: 'hafta sonu', example: 'They planned a quiet weekend at home.', exampleTr: 'Evde sakin bir hafta sonu planladılar.', phonetic: '/ˌwiːkˈend/' },
  habit: { en: 'habit', tr: 'alışkanlık', example: 'Reading before bed became a habit.', exampleTr: 'Yatmadan önce okumak bir alışkanlık haline geldi.', phonetic: '/ˈhæbɪt/' },
  happiness: { en: 'happiness', tr: 'mutluluk', example: 'True happiness felt simple that day.', exampleTr: 'O gün gerçek mutluluk çok basitti.', phonetic: '/ˈhæpinəs/' },
  sadness: { en: 'sadness', tr: 'üzüntü', example: 'A quiet sadness stayed with her.', exampleTr: 'Sessiz bir üzüntü onunla kaldı.', phonetic: '/ˈsædnəs/' },
  anger: { en: 'anger', tr: 'öfke', example: 'He tried to control his anger.', exampleTr: 'Öfkesini kontrol etmeye çalıştı.', phonetic: '/ˈæŋɡə/' },
  fear: { en: 'fear', tr: 'korku', example: 'Her fear disappeared once the lights came on.', exampleTr: 'Işıklar açılınca korkusu kayboldu.', phonetic: '/fɪə/' },
  excitement: { en: 'excitement', tr: 'heyecan', example: 'The whole room filled with excitement.', exampleTr: 'Bütün oda heyecanla doldu.', phonetic: '/ɪkˈsaɪtmənt/' },
  calm: { en: 'calm', tr: 'sakin', example: 'The lake stayed calm all morning.', exampleTr: 'Göl bütün sabah sakin kaldı.', phonetic: '/kɑːm/' },
  anxiety: { en: 'anxiety', tr: 'kaygı', example: 'A little anxiety crept in before the exam.', exampleTr: 'Sınavdan önce hafif bir kaygı sardı.', phonetic: '/æŋˈzaɪəti/' },
  gratitude: { en: 'gratitude', tr: 'minnettarlık', example: 'She wrote a letter full of gratitude.', exampleTr: 'Minnettarlıkla dolu bir mektup yazdı.', phonetic: '/ˈɡrætɪtjuːd/' },
  hope: { en: 'hope', tr: 'umut', example: 'A small hope kept them going.', exampleTr: 'Küçük bir umut onları ayakta tuttu.', phonetic: '/həʊp/' },
  confidence: { en: 'confidence', tr: 'özgüven', example: 'Her confidence grew with every lesson.', exampleTr: 'Her dersle özgüveni arttı.', phonetic: '/ˈkɒnfɪdəns/' },
  friendship: { en: 'friendship', tr: 'arkadaşlık', example: 'Their friendship lasted for decades.', exampleTr: 'Arkadaşlıkları on yıllarca sürdü.', phonetic: '/ˈfrendʃɪp/' },
  trust: { en: 'trust', tr: 'güven', example: 'Trust took years to build between them.', exampleTr: 'Aralarındaki güveni oluşturmak yıllar aldı.', phonetic: '/trʌst/' },
  couple: { en: 'couple', tr: 'çift', example: 'The couple walked slowly along the shore.', exampleTr: 'Çift, kıyı boyunca yavaşça yürüdü.', phonetic: '/ˈkʌpəl/' },
  marriage: { en: 'marriage', tr: 'evlilik', example: 'Their marriage began with a small ceremony.', exampleTr: 'Evlilikleri küçük bir törenle başladı.', phonetic: '/ˈmærɪdʒ/' },
  romance: { en: 'romance', tr: 'romantizm', example: 'A quiet romance grew between them.', exampleTr: 'Aralarında sessiz bir romantizm gelişti.', phonetic: '/rəʊˈmæns/' },
  partner: { en: 'partner', tr: 'partner', example: 'She introduced her partner to the family.', exampleTr: 'Partnerini ailesiyle tanıştırdı.', phonetic: '/ˈpɑːtnə/' },
  commitment: { en: 'commitment', tr: 'bağlılık', example: 'Their commitment never really wavered.', exampleTr: 'Bağlılıkları hiç sarsılmadı.', phonetic: '/kəˈmɪtmənt/' },
  affection: { en: 'affection', tr: 'sevgi / şefkat', example: 'He showed real affection for his family.', exampleTr: 'Ailesine karşı gerçek bir şefkat gösterdi.', phonetic: '/əˈfekʃən/' },
  flirt: { en: 'flirt', tr: 'flört etmek', example: 'They flirted quietly over coffee.', exampleTr: 'Kahve içerken sessizce flört ettiler.', phonetic: '/flɜːt/' },
  experiment: { en: 'experiment', tr: 'deney', example: 'The experiment took three weeks to finish.', exampleTr: 'Deneyin bitmesi üç hafta sürdü.', phonetic: '/ɪkˈsperɪmənt/' },
  laboratory: { en: 'laboratory', tr: 'laboratuvar', example: 'The laboratory stayed open all night.', exampleTr: 'Laboratuvar bütün gece açık kaldı.', phonetic: '/ləˈbɒrətri/' },
  theory: { en: 'theory', tr: 'teori', example: 'The new theory changed the whole field.', exampleTr: 'Yeni teori bütün alanı değiştirdi.', phonetic: '/ˈθɪəri/' },
  research: { en: 'research', tr: 'araştırma', example: 'Her research focused on ocean life.', exampleTr: 'Araştırması okyanus canlıları üzerineydi.', phonetic: '/rɪˈsɜːtʃ/' },
  discovery: { en: 'discovery', tr: 'keşif', example: 'The discovery surprised the whole team.', exampleTr: 'Keşif bütün ekibi şaşırttı.', phonetic: '/dɪˈskʌvəri/' },
  scientist: { en: 'scientist', tr: 'bilim insanı', example: 'The scientist explained the results calmly.', exampleTr: 'Bilim insanı sonuçları sakince açıkladı.', phonetic: '/ˈsaɪəntɪst/' },
  chemistry: { en: 'chemistry', tr: 'kimya', example: 'Chemistry was her favorite subject at school.', exampleTr: 'Kimya, okulda en sevdiği dersti.', phonetic: '/ˈkemɪstri/' },
  biology: { en: 'biology', tr: 'biyoloji', example: 'The biology lesson covered the whole cell.', exampleTr: 'Biyoloji dersi hücrenin tamamını kapsadı.', phonetic: '/baɪˈɒlədʒi/' },
  physics: { en: 'physics', tr: 'fizik', example: 'Physics explained why the bridge stayed up.', exampleTr: 'Fizik, köprünün neden ayakta kaldığını açıkladı.', phonetic: '/ˈfɪzɪks/' },
  hypothesis: { en: 'hypothesis', tr: 'hipotez', example: 'Their hypothesis turned out to be correct.', exampleTr: 'Hipotezleri doğru çıktı.', phonetic: '/haɪˈpɒθəsɪs/' },
  store: { en: 'store', tr: 'mağaza', example: 'The store closed early on Sundays.', exampleTr: 'Mağaza pazar günleri erken kapanırdı.', phonetic: '/stɔː/' },
  price: { en: 'price', tr: 'fiyat', example: 'The price dropped right before the holiday.', exampleTr: 'Fiyat tatilden hemen önce düştü.', phonetic: '/praɪs/' },
  discount: { en: 'discount', tr: 'indirim', example: 'She waited for a bigger discount.', exampleTr: 'Daha büyük bir indirim için bekledi.', phonetic: '/ˈdɪskaʊnt/' },
  cashier: { en: 'cashier', tr: 'kasiyer', example: 'The cashier smiled and counted the change.', exampleTr: 'Kasiyer gülümseyip para üstünü saydı.', phonetic: '/kæˈʃɪə/' },
  receipt: { en: 'receipt', tr: 'fiş / makbuz', example: 'He kept the receipt just in case.', exampleTr: 'Fişi ihtiyaç olur diye sakladı.', phonetic: '/rɪˈsiːt/' },
  bargain: { en: 'bargain', tr: 'pazarlık / kelepir', example: 'They found a real bargain at the market.', exampleTr: 'Pazarda gerçek bir kelepir buldular.', phonetic: '/ˈbɑːɡɪn/' },
  mall: { en: 'mall', tr: 'alışveriş merkezi', example: 'The mall was busy on Saturday afternoon.', exampleTr: 'Alışveriş merkezi cumartesi öğleden sonra kalabalıktı.', phonetic: '/mɔːl/' },
  purchase: { en: 'purchase', tr: 'satın alma', example: 'She was happy with her final purchase.', exampleTr: 'Son satın aldığı şeyden memnun kaldı.', phonetic: '/ˈpɜːtʃəs/' },
  wallet: { en: 'wallet', tr: 'cüzdan', example: 'He left his wallet on the counter.', exampleTr: 'Cüzdanını tezgahın üzerinde unuttu.', phonetic: '/ˈwɒlɪt/' },
  customer: { en: 'customer', tr: 'müşteri', example: 'The customer asked for a full refund.', exampleTr: 'Müşteri tam iade istedi.', phonetic: '/ˈkʌstəmə/' },
};

let wordIdCounter = 0;
function nextId(prefix: string) {
  wordIdCounter += 1;
  return `${prefix}-${wordIdCounter}`;
}

/** Build a Word from a raw english string, using the dictionary when possible. */
export function makeWord(en: string, strength = 40): Word {
  const key = en.trim().toLowerCase();
  const base = DICT[key];
  if (base) {
    return { id: nextId('w'), strength, ...base };
  }
  return {
    id: nextId('w'),
    en: key,
    tr: 'çeviri',
    example: `This is an example sentence with the word "${key}".`,
    exampleTr: `"${key}" kelimesiyle örnek bir cümle.`,
    phonetic: '',
    strength,
  };
}

export const SAMPLE_WORDS = [
  'love', 'travel', 'airport', 'coffee', 'mountain',
  'journey', 'sunset', 'dream', 'ocean', 'city',
];

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const TR_DISTRACTORS = ['zaman', 'renk', 'kapı', 'deniz', 'ağaç', 'yıldız', 'gölge', 'anahtar'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeFill(word: Word): QuizQuestion {
  const re = new RegExp(`\\b${word.en}\\b`, 'i');
  const blanked = word.example.match(re)
    ? word.example.replace(re, '_____')
    : `We could not stop talking about _____.`;
  const distractors = shuffle(Object.keys(DICT).filter((k) => k !== word.en)).slice(0, 3);
  const options = shuffle([word.en, ...distractors]);
  return {
    type: 'fill',
    prompt: blanked,
    options,
    answerIndex: options.indexOf(word.en),
  };
}

export function generateQuiz(words: Word[]): QuizQuestion[] {
  const w = (i: number) => words[i % words.length];
  const questions: QuizQuestion[] = [];

  // 1) Multiple choice — meaning
  {
    const target = w(0);
    const distractors = shuffle(
      Object.values(DICT)
        .map((d) => d.tr)
        .filter((tr) => tr !== target.tr),
    ).slice(0, 3);
    const options = shuffle([target.tr, ...distractors]);
    questions.push({
      type: 'multiple',
      prompt: `"${target.en}" kelimesinin anlamı nedir?`,
      options,
      answerIndex: options.indexOf(target.tr),
    });
  }

  // 2) True / False
  {
    const target = w(1);
    const showCorrect = Math.random() > 0.5;
    const shownTr = showCorrect
      ? target.tr
      : shuffle(TR_DISTRACTORS)[0];
    questions.push({
      type: 'truefalse',
      prompt: `"${target.en}" kelimesi "${shownTr}" anlamına gelir.`,
      answer: showCorrect,
    });
  }

  // 3) Fill in the blank
  questions.push(makeFill(w(2)));

  // 4) Multiple choice — meaning (another word)
  {
    const target = w(3);
    const distractors = shuffle(
      Object.values(DICT)
        .map((d) => d.tr)
        .filter((tr) => tr !== target.tr),
    ).slice(0, 3);
    const options = shuffle([target.tr, ...distractors]);
    questions.push({
      type: 'multiple',
      prompt: `"${target.en}" kelimesinin anlamı nedir?`,
      options,
      answerIndex: options.indexOf(target.tr),
    });
  }

  // 5) Fill in the blank
  questions.push(makeFill(w(4)));

  return questions;
}

/** The opening line, split into segments so callers can highlight wordA/wordB inline. */
export interface StoryPreview {
  before: string;
  wordA: string;
  middle: string;
  wordB: string;
  after: string;
  tr: string;
}

export function buildStoryPreview(words: Word[]): StoryPreview {
  const a = words[0] ?? makeWord('journey');
  const b = words[1] ?? makeWord('dream');
  return {
    before: 'It was early morning when the story began. ',
    wordA: cap(a.en),
    middle: ' filled the air, and every step felt like the start of a new ',
    wordB: b.en,
    after: '.',
    tr: `Hikaye başladığında sabahın erken saatleriydi. Havada ${a.tr} vardı ve her adım yeni bir ${b.tr} başlangıcı gibiydi.`,
  };
}

export function buildParagraphs(words: Word[]): StoryParagraph[] {
  const c = words[2] ?? makeWord('city');
  const preview = buildStoryPreview(words);
  return [
    {
      en: `${preview.before}${preview.wordA}${preview.middle}${preview.wordB}${preview.after}`,
      tr: preview.tr,
    },
    {
      en: `Along the way we discovered a ${c.en} we had never seen before. The moment stayed with us, quiet and bright.`,
      tr: `Yol boyunca daha önce hiç görmediğimiz bir ${c.tr} keşfettik. O an, sessiz ve parlak, bizimle kaldı.`,
    },
    {
      en: `By the end, everything we had learned came together — words turning slowly into memories.`,
      tr: `Sonunda öğrendiğimiz her şey bir araya geldi — kelimeler yavaşça anılara dönüştü.`,
    },
  ];
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildSessionFromWords(words: Word[], levelName: string): LearnSession {
  return {
    title: 'Kendi Hikayen',
    levelName,
    targetWords: words,
    paragraphs: buildParagraphs(words),
    quiz: generateQuiz(words),
    origin: 'words',
  };
}

export function sessionFromScene(scene: Scene): LearnSession {
  return {
    title: scene.name,
    levelName: scene.levelName,
    targetWords: scene.words,
    paragraphs: scene.paragraphs,
    quiz: scene.quiz,
    origin: 'theme',
    themeId: scene.themeId,
    levelIndex: scene.levelIndex,
  };
}

/**
 * Builds a saveable `Story` from a completed words-origin `LearnSession`
 * (NEW-002) — called only once, when the user finishes reading their own
 * generated story, so it shows up under "Hikayelerim → Kendi Oluşturduklarım".
 * Preset theme stories (`origin: 'theme'`) are never passed here — they
 * already exist in `THEME_STORIES` and must not be re-saved as duplicates.
 */
export function buildCustomStoryFromSession(session: LearnSession): Story {
  return {
    id: nextId('story'),
    title: session.title,
    level: session.levelName,
    category: 'custom',
    paragraphs: session.paragraphs,
    targetWords: session.targetWords.map((w) => w.en),
  };
}

// ---------------------------------------------------------------------------
// Target-word pill/tier contract (WL-004 2a) — single source of truth for
// both the tier color and the "NEW" badge, so they can never contradict
// each other: both are derived from the same storyCount.
// ---------------------------------------------------------------------------

export type WordTier = 'red' | 'green' | 'amber' | 'blue';

export function getWordTier(storyCount: number): WordTier {
  if (storyCount === 0) return 'red';
  if (storyCount >= 1 && storyCount <= 3) return 'green';
  if (storyCount >= 4 && storyCount <= 8) return 'amber';
  return 'blue';
}

export function isNewWord(storyCount: number): boolean {
  return storyCount === 0;
}

export const TIER_COLORS: Record<WordTier, { background: string; borderColor: string; color: string }> = {
  red: { background: 'rgba(248,113,113,0.16)', color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' },
  green: { background: 'rgba(34,197,94,0.16)', color: '#4ade80', borderColor: 'rgba(74,222,128,0.4)' },
  amber: { background: 'rgba(240,180,41,0.16)', color: '#facc15', borderColor: 'rgba(250,204,21,0.4)' },
  blue: { background: 'rgba(56,146,255,0.16)', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.4)' },
};

// Test storyCount values covering all four buckets: 0 (new), 1-3 (green), 4-8 (amber), 9+ (blue).
const STORY_COUNT_TEST_VALUES = [0, 2, 6, 12, 5];

/** Deterministic mock storyCount per word position, until a real per-user story history exists. */
export function mockStoryCountForIndex(index: number): number {
  return STORY_COUNT_TEST_VALUES[index % STORY_COUNT_TEST_VALUES.length];
}

// ---------------------------------------------------------------------------
// StoryReader mock content (12 pages / 3 chapters, until a real content
// pipeline exists)
// ---------------------------------------------------------------------------

export interface StoryReaderTargetWord {
  word: string;
  /** How many times this word has appeared as a target word for this user; 0 means brand new. */
  storyCount: number;
}

export interface StoryReaderPage {
  chapterIndex: 0 | 1 | 2;
  paragraphs: [string, string];
  paragraphsTR: [string, string];
}

export interface StoryReaderData {
  storyTitle: string;
  targetWords: StoryReaderTargetWord[];
  chapters: [{ title: string }, { title: string }, { title: string }];
  pages: StoryReaderPage[];
  stats: { newWords: number; learning: number; mastered: number };
}

const STORY_READER_CHAPTER_TITLES: [string, string, string] = [
  'Yolculuğun Başlangıcı',
  'Beklenmedik Bir Buluşma',
  'Hikâyenin Unutulmaz Finali',
];
const STORY_READER_PAGE_COUNT = 12;

export function buildStoryReaderData(title: string, words: Word[], paragraphs: StoryParagraph[]): StoryReaderData {
  const wordPool = words.length ? words : SAMPLE_WORDS.slice(0, 5).map((w) => makeWord(w));
  const targetWords: StoryReaderTargetWord[] = wordPool.map((w, i) => ({
    word: w.en,
    storyCount: mockStoryCountForIndex(i),
  }));

  const basePs = paragraphs.length ? paragraphs : buildParagraphs(wordPool);
  const pages: StoryReaderPage[] = Array.from({ length: STORY_READER_PAGE_COUNT }, (_, i) => {
    const a = basePs[i % basePs.length];
    const b = basePs[(i + 1) % basePs.length];
    return {
      chapterIndex: Math.floor(i / 4) as 0 | 1 | 2,
      paragraphs: [a.en, b.en],
      paragraphsTR: [a.tr, b.tr],
    };
  });

  const mastered = wordPool.filter((w) => w.strength >= 70).length;
  const learning = Math.max(0, wordPool.length - mastered);

  return {
    storyTitle: title,
    targetWords,
    chapters: [
      { title: STORY_READER_CHAPTER_TITLES[0] },
      { title: STORY_READER_CHAPTER_TITLES[1] },
      { title: STORY_READER_CHAPTER_TITLES[2] },
    ],
    pages,
    stats: { newWords: targetWords.filter((w) => w.storyCount === 0).length, learning, mastered },
  };
}

// ---------------------------------------------------------------------------
// Themes & scenes (Hazır Temalar)
// ---------------------------------------------------------------------------

interface ThemeSeed {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  image: ImageSourcePropType;
  wordBank: string[][]; // one array per level (3 levels)
  sceneNames: string[];
}

const THEME_SEEDS: ThemeSeed[] = [
  {
    id: 'nature',
    name: 'Doğa',
    nameEn: 'Nature',
    description: 'Dağlar, ormanlar ve nehirlerle dolu sakin bir keşif.',
    image: IMAGES.nature,
    sceneNames: ['Dağ Gölü', 'Sessiz Orman', 'Vadi Nehri'],
    wordBank: [
      ['mountain', 'river', 'forest', 'sunset'],
      ['ocean', 'wave', 'island', 'sun'],
      ['garden', 'road', 'window', 'dream'],
    ],
  },
  {
    id: 'city',
    name: 'Şehir',
    nameEn: 'City',
    description: 'Işıklar, sokaklar ve hiç durmayan şehir hayatı.',
    image: IMAGES.city,
    sceneNames: ['Gece Işıkları', 'Kalabalık Cadde', 'Yüksek Binalar'],
    wordBank: [
      ['city', 'street', 'building', 'music'],
      ['road', 'window', 'friend', 'book'],
      ['morning', 'coffee', 'dream', 'journey'],
    ],
  },
  {
    id: 'travel',
    name: 'Seyahat',
    nameEn: 'Travel',
    description: 'Havalimanları, uçuşlar ve yeni yerlere yolculuk.',
    image: IMAGES.airport,
    sceneNames: ['Havalimanı', 'Uçuş Günü', 'Yeni Şehir'],
    wordBank: [
      ['airport', 'flight', 'ticket', 'luggage'],
      ['travel', 'journey', 'city', 'friend'],
      ['dream', 'road', 'book', 'sunset'],
    ],
  },
  {
    id: 'cafe',
    name: 'Kafe',
    nameEn: 'Cafe',
    description: 'Sıcak kahve kokusu ve sakin sabahlar.',
    image: IMAGES.cafe,
    sceneNames: ['Sabah Kahvesi', 'Barista', 'Pencere Kenarı'],
    wordBank: [
      ['coffee', 'barista', 'cup', 'morning'],
      ['book', 'friend', 'music', 'window'],
      ['dream', 'street', 'city', 'love'],
    ],
  },
  {
    id: 'beach',
    name: 'Tatil',
    nameEn: 'Holiday',
    description: 'Deniz, güneş ve altın renkli kumsallar.',
    image: IMAGES.beach,
    sceneNames: ['Altın Kumsal', 'Mavi Dalgalar', 'Küçük Ada'],
    wordBank: [
      ['beach', 'wave', 'sun', 'ocean'],
      ['island', 'travel', 'journey', 'friend'],
      ['sunset', 'dream', 'love', 'music'],
    ],
  },
];

export const THEMES: Theme[] = THEME_SEEDS.map((seed) => {
  const scenes: Scene[] = seed.wordBank.map((bank, levelIndex) => {
    const words = bank.map((en, i) => makeWord(en, 30 + i * 10));
    return {
      id: `${seed.id}-${levelIndex}`,
      themeId: seed.id,
      levelIndex,
      levelName: LEVEL_NAMES[levelIndex],
      name: seed.sceneNames[levelIndex],
      image: seed.image,
      words,
      paragraphs: buildParagraphs(words),
      quiz: generateQuiz(words),
    };
  });
  return { ...seed, scenes };
});

export function getThemeById(id?: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}

export function getSceneById(id?: string): Scene | undefined {
  for (const theme of THEMES) {
    const scene = theme.scenes.find((s) => s.id === id);
    if (scene) return scene;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Stories (Hikayelerim)
// ---------------------------------------------------------------------------

/** One story per scene (3 levels × 5 themes) — powers "Yeni Hikayeler Keşfet" with real level variety (A1/A2/B1). */
export const THEME_STORIES: Story[] = THEMES.flatMap((theme) =>
  theme.scenes.map((scene) => ({
    id: `story-${theme.id}-${scene.levelIndex}`,
    title: scene.name,
    level: scene.levelName,
    levelCode: LEVEL_CODES[scene.levelIndex],
    category: 'theme' as const,
    themeId: theme.id,
    themeName: theme.name,
    themeNameEn: theme.nameEn,
    image: theme.image,
    paragraphs: scene.paragraphs,
    targetWords: scene.words.map((w) => w.en),
  })),
);

// ---------------------------------------------------------------------------
// Recent words (Son Öğrenilen Kelimeler) — seeded with 20 words
// ---------------------------------------------------------------------------

const RECENT_SEED = [
  'love', 'travel', 'airport', 'coffee', 'mountain',
  'journey', 'sunset', 'dream', 'ocean', 'city',
  'street', 'building', 'ticket', 'flight', 'barista',
  'forest', 'river', 'beach', 'wave', 'book',
];

export const RECENT_WORDS: Word[] = RECENT_SEED.map((en, i) =>
  makeWord(en, Math.max(15, 95 - i * 4)),
);

/** Parses the comma-separated "raw" word list session-scoped practice routes pass each other (Aşama 1A.2 practice hub). */
export function parseRawWordList(value: string | undefined): string[] {
  const words = (value ?? '').split(',').map((w) => w.trim()).filter(Boolean);
  return words.length > 0 ? words : RECENT_WORDS.slice(0, 10).map((w) => w.en);
}

// ---------------------------------------------------------------------------
// Word list entries (Kelimelerim screens) — status is derived from reviewCount,
// which counts distinct stories a word has appeared in. It is NEVER incremented
// by flashcard/quiz/practice interactions — only by meeting the word in a new story.
// ---------------------------------------------------------------------------

export type WordStatus = 'new' | 'learning' | 'mastered';

export function getWordStatus(reviewCount: number): WordStatus {
  if (reviewCount <= 3) return 'new';
  if (reviewCount <= 8) return 'learning';
  return 'mastered';
}

export interface WordListEntry extends Word {
  reviewCount: number;
  status: WordStatus;
}

function withReviewCounts(words: Word[]): WordListEntry[] {
  return words.map((w, i) => {
    const reviewCount = ((i * 5) % 12) + 1;
    return { ...w, reviewCount, status: getWordStatus(reviewCount) };
  });
}

export function buildWordListEntries(words: Word[]): WordListEntry[] {
  return withReviewCounts(words);
}

const ALL_WORDS_SEED = [
  ...RECENT_SEED,
  'friend', 'music', 'garden', 'window', 'road', 'sky', 'tree', 'bread',
  'breakfast', 'restaurant', 'movie', 'concert', 'dance', 'song', 'painting',
  'artist', 'museum', 'school', 'teacher', 'student', 'run', 'team', 'goal',
  'computer', 'phone', 'doctor', 'health',
];

export const ALL_WORD_ENTRIES: WordListEntry[] = withReviewCounts(
  ALL_WORDS_SEED.map((en, i) => makeWord(en, Math.max(15, 95 - i * 2))),
);

// ---------------------------------------------------------------------------
// Word buckets for Kelime Kartları hub — CEFR level and part-of-speech aren't
// tagged per word yet, so these split the same word bank deterministically
// (by index) rather than inventing a separate, driftable word list.
// ---------------------------------------------------------------------------

export type WordLevelKey = 'beginner' | 'intermediate' | 'advanced';

export const WORD_LEVEL_META: Record<WordLevelKey, { label: string; code: string }> = {
  beginner: { label: 'Başlangıç', code: 'A1 · A2' },
  intermediate: { label: 'Orta', code: 'B1 · B2' },
  advanced: { label: 'İleri', code: 'C1 · C2' },
};

export function wordsByLevel(level: WordLevelKey): WordListEntry[] {
  const third = Math.ceil(ALL_WORD_ENTRIES.length / 3);
  if (level === 'beginner') return ALL_WORD_ENTRIES.slice(0, third);
  if (level === 'intermediate') return ALL_WORD_ENTRIES.slice(third, third * 2);
  return ALL_WORD_ENTRIES.slice(third * 2);
}

const WORD_TYPE_ROTATION = ['verb', 'noun', 'adjective', 'adverb', 'pronoun'] as const;

export function wordsByType(
  type: 'verb' | 'noun' | 'adjective' | 'adverb' | 'pronoun',
): WordListEntry[] {
  return ALL_WORD_ENTRIES.filter((_, i) => WORD_TYPE_ROTATION[i % WORD_TYPE_ROTATION.length] === type);
}

export function wordsByStatus(status: WordStatus): WordListEntry[] {
  return ALL_WORD_ENTRIES.filter((e) => e.status === status);
}

// ---------------------------------------------------------------------------
// WordDNA / SentenceLab detail — reuses the reviewCount/status convention
// above (distinct-story count). "Total Count" is a separate, larger raw
// tally (quiz + flashcard + story encounters, same story counted every time).
// ---------------------------------------------------------------------------

export interface WordDetail extends WordListEntry {
  /** Raw encounter count across quiz/flashcard/story, unlike reviewCount which only counts distinct stories. */
  totalCount: number;
  lastSeenLabel: string;
  cefr: string;
}

const LAST_SEEN_LABELS = ['Bugün', 'Dün', '2 gün önce', '12 Mayıs', '28 Nisan', '3 Haziran', '15 Mart', '7 Temmuz'];
const CEFR_CODES = ['A2', 'B1', 'B2', 'C1'];

export function getWordDetail(en: string): WordDetail {
  const key = en.trim().toLowerCase();
  const fromAll = ALL_WORD_ENTRIES.find((w) => w.en === key);
  const fromRecent = RECENT_WORDS.find((w) => w.en === key);

  let base: WordListEntry;
  if (fromAll) {
    base = fromAll;
  } else {
    const w = fromRecent ?? makeWord(key);
    const reviewCount = (w.strength % 12) + 1;
    base = { ...w, reviewCount, status: getWordStatus(reviewCount) };
  }

  const seed = base.en.length * 7 + base.strength;
  return {
    ...base,
    totalCount: base.reviewCount * 2 + (seed % 11) + 3,
    lastSeenLabel: LAST_SEEN_LABELS[seed % LAST_SEEN_LABELS.length],
    cefr: CEFR_CODES[seed % CEFR_CODES.length],
  };
}

export interface LevelExample {
  en: string;
  tr: string;
}

function firstTr(tr: string): string {
  return tr.split(' / ')[0].split(' ')[0];
}

export function levelExamplesForWord(word: Pick<Word, 'en' | 'tr' | 'example' | 'exampleTr'>): Record<'basit' | 'orta' | 'ileri', LevelExample> {
  const wTr = firstTr(word.tr);
  return {
    basit: { en: word.example, tr: word.exampleTr },
    orta: {
      en: `Despite everything going on, people still talked about ${word.en} more than anyone expected.`,
      tr: `Her şeye rağmen insanlar hâlâ beklenenden fazla ${wTr} hakkında konuştu.`,
    },
    ileri: {
      en: `The way ${word.en} quietly shaped the entire outcome was more significant than most people initially realized.`,
      tr: `${cap(wTr)}, bütün sonucu sessizce şekillendirme biçimiyle, çoğu insanın başta fark ettiğinden çok daha önemliydi.`,
    },
  };
}

export function tenseExamplesForWord(word: Pick<Word, 'en' | 'tr'>): Record<'present' | 'past' | 'future' | 'perfect', LevelExample> {
  const wTr = firstTr(word.tr);
  return {
    present: { en: `People notice ${word.en} more than they admit.`, tr: `İnsanlar ${wTr} konusunu kabul ettiklerinden daha fazla fark ediyor.` },
    past: { en: `Yesterday, everyone was talking about ${word.en} at some point.`, tr: `Dün, herkes bir noktada ${wTr} hakkında konuşuyordu.` },
    future: { en: `Soon, you will understand ${word.en} much better than today.`, tr: `Yakında, ${wTr} konusunu bugünden çok daha iyi anlayacaksın.` },
    perfect: { en: `She has always been fascinated by ${word.en}.`, tr: `O, her zaman ${wTr} konusuna hayran kalmıştır.` },
  };
}

// ---------------------------------------------------------------------------
// Hazır Görseller (gallery) — 16 categories × 3 cards, mock placeholder content
// ---------------------------------------------------------------------------

export interface GalleryCategory {
  id: string;
  name: string;
  icon: string;
}

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  { id: 'travel', name: 'Travel', icon: 'airplane' },
  { id: 'entertainment', name: 'Entertainment', icon: 'movie-open-outline' },
  { id: 'art', name: 'Art', icon: 'palette-outline' },
  { id: 'politics', name: 'Politics', icon: 'gavel' },
  { id: 'nature', name: 'Nature', icon: 'tree' },
  { id: 'daily-life', name: 'Daily Life', icon: 'weather-sunny' },
  { id: 'business', name: 'Business', icon: 'briefcase-outline' },
  { id: 'health', name: 'Health', icon: 'heart-pulse' },
  { id: 'emotions', name: 'Emotions', icon: 'emoticon-happy-outline' },
  { id: 'relationships-dating', name: 'Relationships & Dating', icon: 'heart-multiple-outline' },
  { id: 'food', name: 'Food', icon: 'coffee' },
  { id: 'science', name: 'Science', icon: 'flask-outline' },
  { id: 'technology', name: 'Technology', icon: 'chip' },
  { id: 'shopping', name: 'Shopping', icon: 'cart-outline' },
  { id: 'sports', name: 'Sports', icon: 'basketball' },
  { id: 'education', name: 'Education', icon: 'school-outline' },
];

const GALLERY_SEEDS: Record<string, string[]> = {
  travel: ['travel', 'airport', 'journey', 'flight', 'ticket', 'luggage', 'road', 'island', 'sunset', 'adventure'],
  entertainment: ['music', 'movie', 'concert', 'dance', 'actor', 'theatre', 'festival', 'song', 'laughter', 'friend'],
  art: ['painting', 'artist', 'museum', 'color', 'sculpture', 'canvas', 'gallery', 'brush', 'portrait', 'creativity'],
  politics: ['government', 'election', 'president', 'law', 'citizen', 'vote', 'parliament', 'policy', 'debate', 'democracy'],
  nature: ['forest', 'river', 'mountain', 'ocean', 'beach', 'wave', 'sun', 'garden', 'sky', 'tree'],
  'daily-life': ['morning', 'breakfast', 'coffee', 'home', 'routine', 'commute', 'evening', 'dinner', 'weekend', 'habit'],
  business: ['company', 'meeting', 'manager', 'office', 'client', 'profit', 'contract', 'strategy', 'investment', 'teamwork'],
  health: ['doctor', 'hospital', 'medicine', 'exercise', 'nurse', 'patient', 'health', 'diet', 'sleep', 'therapy'],
  emotions: ['happiness', 'sadness', 'anger', 'fear', 'excitement', 'calm', 'anxiety', 'gratitude', 'hope', 'confidence'],
  'relationships-dating': ['love', 'friendship', 'trust', 'couple', 'marriage', 'romance', 'partner', 'commitment', 'affection', 'flirt'],
  food: ['coffee', 'barista', 'cup', 'morning', 'bread', 'breakfast', 'restaurant', 'taste', 'sugar', 'waiter'],
  science: ['experiment', 'laboratory', 'theory', 'research', 'discovery', 'scientist', 'chemistry', 'biology', 'physics', 'hypothesis'],
  technology: ['computer', 'internet', 'robot', 'phone', 'software', 'screen', 'data', 'device', 'network', 'innovation'],
  shopping: ['store', 'price', 'discount', 'cashier', 'receipt', 'bargain', 'mall', 'purchase', 'wallet', 'customer'],
  sports: ['run', 'team', 'goal', 'stadium', 'match', 'champion', 'coach', 'victory', 'athlete', 'training'],
  education: ['book', 'school', 'teacher', 'student', 'lesson', 'exam', 'classroom', 'knowledge', 'library', 'homework'],
};

export type LevelTier = 'Başlangıç' | 'Orta' | 'İleri';

export const LEVEL_TIERS: { tier: LevelTier; levels: string[] }[] = [
  { tier: 'Başlangıç', levels: ['A1', 'A2'] },
  { tier: 'Orta', levels: ['B1', 'B2'] },
  { tier: 'İleri', levels: ['C1', 'C2'] },
];

// One card per category per tier — index 0 = Başlangıç, 1 = Orta, 2 = İleri.
const CARD_LEVELS = ['A2', 'B1', 'C1'];

export interface GalleryItem {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  level: string;
  preview: StoryPreview;
  targetWords: string[];
}

/** Category-major order: all 3 cards of category 0, then category 1, etc. */
export const GALLERY_ITEMS: GalleryItem[] = GALLERY_CATEGORIES.flatMap((cat) => {
  const words = GALLERY_SEEDS[cat.id];
  const preview = buildStoryPreview(words.map((en) => makeWord(en)));
  return CARD_LEVELS.map((level, i) => ({
    id: `${cat.id}-${i}`,
    categoryId: cat.id,
    categoryName: cat.name,
    title: `${cat.name} Sahnesi ${i + 1}`,
    level,
    preview,
    targetWords: words,
  }));
});

/** The gallery item used to feed the home screen's static story preview (point 3: shared data source). */
export function getFeaturedGalleryItem(): GalleryItem {
  return GALLERY_ITEMS[0];
}

/**
 * "Tümü" filter order: round-robin across categories — round 1 gives each
 * category's first card in category order, round 2 the second card, etc.
 */
export const GALLERY_ITEMS_ROUND_ROBIN: GalleryItem[] = CARD_LEVELS.map((_, round) => round).flatMap(
  (round) => GALLERY_ITEMS.filter((_, idx) => idx % CARD_LEVELS.length === round),
);

export function sessionFromGalleryItem(item: GalleryItem): LearnSession {
  const words = item.targetWords.map((w) => makeWord(w));
  return {
    title: item.title,
    levelName: item.level,
    targetWords: words,
    paragraphs: buildParagraphs(words),
    quiz: generateQuiz(words),
    origin: 'words',
  };
}

// ---------------------------------------------------------------------------
// Reading-comprehension quiz questions (Aşama 1A.2, learn/quiz.tsx) — grounded
// in the session's own real paragraphs, never fabricated. Correct answer is a
// verbatim sentence from THIS story; wrong choices are verbatim sentences from
// OTHER real generated stories (real text, just the wrong story), so nothing
// shown to the user is invented.
// ---------------------------------------------------------------------------

export interface ComprehensionQuestionSeed {
  text: string;
  choices: string[];
  correctIndex: number;
  hint: string;
}

export function buildComprehensionQuestions(session: LearnSession): ComprehensionQuestionSeed[] {
  const ownSentences = session.paragraphs.map((p) => p.en).filter(Boolean);
  if (ownSentences.length === 0) return [];

  const otherPool = THEME_STORIES.flatMap((s) => s.paragraphs.map((p) => p.en)).filter(
    (s) => !ownSentences.includes(s),
  );
  if (otherPool.length < 3) return [];

  const count = Math.min(2, ownSentences.length);
  const picks = shuffle(ownSentences).slice(0, count);

  return picks.map((correct) => {
    const distractors = shuffle(otherPool.filter((s) => s !== correct)).slice(0, 3);
    const choices = shuffle([correct, ...distractors]);
    return {
      text: 'Bu cümlelerden hangisi bu hikayede geçiyor?',
      choices,
      correctIndex: choices.indexOf(correct),
      hint: 'İpucu: Hikayenin paragraflarını tekrar okuyarak doğru cümleyi bulabilirsin.',
    };
  });
}
