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
  category: 'custom' | 'theme';
  themeName?: string;
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

export function buildParagraphs(words: Word[]): StoryParagraph[] {
  const a = words[0] ?? makeWord('journey');
  const b = words[1] ?? makeWord('dream');
  const c = words[2] ?? makeWord('city');
  return [
    {
      en: `It was early ${'morning'} when the story began. ${cap(a.en)} filled the air, and every step felt like the start of a new ${b.en}.`,
      tr: `Hikaye başladığında sabahın erken saatleriydi. Havada ${a.tr} vardı ve her adım yeni bir ${b.tr} başlangıcı gibiydi.`,
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

// ---------------------------------------------------------------------------
// Themes & scenes (Hazır Temalar)
// ---------------------------------------------------------------------------

interface ThemeSeed {
  id: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
  wordBank: string[][]; // one array per level (3 levels)
  sceneNames: string[];
}

const THEME_SEEDS: ThemeSeed[] = [
  {
    id: 'nature',
    name: 'Doğa',
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

export const THEME_STORIES: Story[] = THEMES.map((theme) => {
  const scene = theme.scenes[0];
  return {
    id: `story-${theme.id}`,
    title: scene.name,
    level: scene.levelName,
    category: 'theme',
    themeName: theme.name,
    image: theme.image,
    paragraphs: scene.paragraphs,
    targetWords: scene.words.map((w) => w.en),
  };
});

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

export function findWordByEn(en?: string): Word | undefined {
  if (!en) return undefined;
  const key = en.toLowerCase();
  const base = DICT[key];
  if (base) return { id: `lookup-${key}`, strength: 60, ...base };
  return undefined;
}

// SentenceLab — extra example sentences generated locally (no API)
export function labExamples(word: Word): { en: string; tr: string }[] {
  const w = word.en;
  return [
    { en: `Yesterday I wrote the word "${w}" in my notebook.`, tr: `Dün "${w}" kelimesini defterime yazdım.` },
    { en: `Can you use "${w}" in a short sentence?`, tr: `"${w}" kelimesini kısa bir cümlede kullanabilir misin?` },
    { en: `The teacher explained "${w}" with a simple example.`, tr: `Öğretmen "${w}" kelimesini basit bir örnekle açıkladı.` },
    { en: `I finally remember what "${w}" means.`, tr: `Sonunda "${w}" kelimesinin ne anlama geldiğini hatırlıyorum.` },
    { en: `We practiced "${w}" together this morning.`, tr: `Bu sabah "${w}" kelimesini birlikte çalıştık.` },
  ];
}
