import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  LearnSession,
  Story,
  THEME_STORIES,
  Word,
} from '@/data/mock';
import {
  CardEvaluation,
  clearPersistedState,
  computeStreak,
  defaultState,
  loadPersistedState,
  PersistedState,
  savePersistedState,
  todayKey,
} from '@/lib/storage';

interface ProgressState {
  /** false until the persisted snapshot has been read from storage at least once. */
  isHydrated: boolean;
  onboarded: boolean;
  profileName: string | null;
  recentWords: Word[];
  customStories: Story[];
  /** unlocked level count per theme (default 1 → only Başlangıç open) */
  themeProgress: Record<string, number>;
  currentSession: LearnSession | null;
  /** Real consecutive-day usage streak, derived from recorded active dates — never fabricated. */
  streak: number;
  cardEvaluations: Record<string, CardEvaluation>;

  isLevelUnlocked: (themeId: string, levelIndex: number) => boolean;
  unlockNextLevel: (themeId: string, levelIndex: number) => void;
  startSession: (session: LearnSession) => void;
  clearSession: () => void;
  addLearnedWords: (words: Word[]) => void;
  addCustomStory: (story: Story) => void;
  getStoryById: (id?: string) => Story | undefined;
  completeOnboarding: (profileName: string | null) => void;
  recordCardEvaluation: (wordEn: string, known: boolean) => void;
  /** Wipes all local data (storage + in-memory) back to a fresh install. Used by the "Verileri sıfırla" flow. */
  resetAllData: () => Promise<void>;
}

const ProgressContext = createContext<ProgressState | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [recentWords, setRecentWords] = useState<Word[]>([]);
  const [customStories, setCustomStories] = useState<Story[]>([]);
  const [themeProgress, setThemeProgress] = useState<Record<string, number>>({});
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [cardEvaluations, setCardEvaluations] = useState<Record<string, CardEvaluation>>({});
  // Deliberately NOT persisted: a mid-session read/quiz/flashcards state is
  // discarded on cold restart (a safe "clear", per the audit task's allowed
  // options) rather than attempting full navigation-stack resume.
  const [currentSession, setCurrentSession] = useState<LearnSession | null>(null);

  // Hydrate once from storage on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadPersistedState();
      if (cancelled) return;
      const today = todayKey();
      const activeDatesWithToday = stored.activeDates.includes(today)
        ? stored.activeDates
        : [...stored.activeDates, today];
      setOnboarded(stored.onboarded);
      setProfileName(stored.profileName);
      setRecentWords(stored.recentWords);
      setCustomStories(stored.customStories);
      setThemeProgress(stored.themeProgress);
      setActiveDates(activeDatesWithToday);
      setCardEvaluations(stored.cardEvaluations);
      setIsHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change, but never before the initial hydration has
  // completed — otherwise the pre-hydration defaults would overwrite
  // whatever was already saved on disk.
  const skipFirstSaveRef = useRef(true);
  useEffect(() => {
    if (!isHydrated) return;
    if (skipFirstSaveRef.current) {
      skipFirstSaveRef.current = false;
      return;
    }
    const next: PersistedState = {
      version: defaultState().version,
      onboarded,
      profileName,
      recentWords,
      customStories,
      themeProgress,
      activeDates,
      cardEvaluations,
    };
    savePersistedState(next);
  }, [
    isHydrated,
    onboarded,
    profileName,
    recentWords,
    customStories,
    themeProgress,
    activeDates,
    cardEvaluations,
  ]);

  const streak = useMemo(() => computeStreak(activeDates), [activeDates]);

  const isLevelUnlocked = useCallback(
    (themeId: string, levelIndex: number) => {
      const unlocked = themeProgress[themeId] ?? 1;
      return levelIndex < unlocked;
    },
    [themeProgress],
  );

  const unlockNextLevel = useCallback((themeId: string, levelIndex: number) => {
    setThemeProgress((prev) => {
      const current = prev[themeId] ?? 1;
      const needed = levelIndex + 2; // unlock the level after the completed one
      if (needed > current) {
        return { ...prev, [themeId]: Math.min(needed, 3) };
      }
      return prev;
    });
  }, []);

  const startSession = useCallback((session: LearnSession) => {
    setCurrentSession(session);
  }, []);

  const clearSession = useCallback(() => setCurrentSession(null), []);

  const addLearnedWords = useCallback((words: Word[]) => {
    setRecentWords((prev) => {
      const seen = new Set<string>();
      const merged = [...words, ...prev].filter((w) => {
        const key = w.en.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return merged;
    });
  }, []);

  const addCustomStory = useCallback((story: Story) => {
    setCustomStories((prev) => [story, ...prev]);
  }, []);

  const getStoryById = useCallback(
    (id?: string) => {
      if (!id) return undefined;
      return (
        customStories.find((s) => s.id === id) ??
        THEME_STORIES.find((s) => s.id === id)
      );
    },
    [customStories],
  );

  const completeOnboarding = useCallback((name: string | null) => {
    setOnboarded(true);
    setProfileName((prev) => name ?? prev);
  }, []);

  const recordCardEvaluation = useCallback((wordEn: string, known: boolean) => {
    const key = wordEn.toLowerCase();
    setCardEvaluations((prev) => ({
      ...prev,
      [key]: { known, at: new Date().toISOString() },
    }));
  }, []);

  const resetAllData = useCallback(async () => {
    await clearPersistedState();
    const fresh = defaultState();
    setOnboarded(fresh.onboarded);
    setProfileName(fresh.profileName);
    setRecentWords(fresh.recentWords);
    setCustomStories(fresh.customStories);
    setThemeProgress(fresh.themeProgress);
    setActiveDates([todayKey()]);
    setCardEvaluations(fresh.cardEvaluations);
    setCurrentSession(null);
  }, []);

  const value = useMemo<ProgressState>(
    () => ({
      isHydrated,
      onboarded,
      profileName,
      recentWords,
      customStories,
      themeProgress,
      currentSession,
      streak,
      cardEvaluations,
      isLevelUnlocked,
      unlockNextLevel,
      startSession,
      clearSession,
      addLearnedWords,
      addCustomStory,
      getStoryById,
      completeOnboarding,
      recordCardEvaluation,
      resetAllData,
    }),
    [
      isHydrated,
      onboarded,
      profileName,
      recentWords,
      customStories,
      themeProgress,
      currentSession,
      streak,
      cardEvaluations,
      isLevelUnlocked,
      unlockNextLevel,
      startSession,
      clearSession,
      addLearnedWords,
      addCustomStory,
      getStoryById,
      completeOnboarding,
      recordCardEvaluation,
      resetAllData,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressState {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return ctx;
}
