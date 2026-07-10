import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  LearnSession,
  RECENT_WORDS,
  Story,
  THEME_STORIES,
  Word,
} from '@/data/mock';

interface ProgressState {
  recentWords: Word[];
  customStories: Story[];
  /** unlocked level count per theme (default 1 → only Başlangıç open) */
  themeProgress: Record<string, number>;
  currentSession: LearnSession | null;

  isLevelUnlocked: (themeId: string, levelIndex: number) => boolean;
  unlockNextLevel: (themeId: string, levelIndex: number) => void;
  startSession: (session: LearnSession) => void;
  clearSession: () => void;
  addLearnedWords: (words: Word[]) => void;
  addCustomStory: (story: Story) => void;
  getStoryById: (id?: string) => Story | undefined;
}

const ProgressContext = createContext<ProgressState | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [recentWords, setRecentWords] = useState<Word[]>(RECENT_WORDS);
  const [customStories, setCustomStories] = useState<Story[]>([]);
  const [themeProgress, setThemeProgress] = useState<Record<string, number>>({});
  const [currentSession, setCurrentSession] = useState<LearnSession | null>(null);

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

  const value = useMemo<ProgressState>(
    () => ({
      recentWords,
      customStories,
      themeProgress,
      currentSession,
      isLevelUnlocked,
      unlockNextLevel,
      startSession,
      clearSession,
      addLearnedWords,
      addCustomStory,
      getStoryById,
    }),
    [
      recentWords,
      customStories,
      themeProgress,
      currentSession,
      isLevelUnlocked,
      unlockNextLevel,
      startSession,
      clearSession,
      addLearnedWords,
      addCustomStory,
      getStoryById,
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
