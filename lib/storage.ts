import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story, Word } from '@/data/mock';

/**
 * Local-first persistence layer. WordLoop has no backend — this is the only
 * place progress survives an app restart. Schema is versioned so a future
 * shape change can migrate or safely discard old data instead of crashing.
 */

export const STORAGE_KEY = 'wordloop:progress:v1';
export const SCHEMA_VERSION = 1;

export interface CardEvaluation {
  known: boolean;
  at: string; // ISO timestamp of the last evaluation
}

export interface PersistedState {
  version: number;
  onboarded: boolean;
  profileName: string | null;
  recentWords: Word[];
  customStories: Story[];
  themeProgress: Record<string, number>;
  /** Calendar days (YYYY-MM-DD, device-local) the app was opened on — basis for the real streak stat. */
  activeDates: string[];
  /** Flashcard "Zorlandım"/"Biliyorum" evaluations, keyed by word.en.toLowerCase(). */
  cardEvaluations: Record<string, CardEvaluation>;
}

export function defaultState(): PersistedState {
  return {
    version: SCHEMA_VERSION,
    onboarded: false,
    profileName: null,
    recentWords: [],
    customStories: [],
    themeProgress: {},
    activeDates: [],
    cardEvaluations: {},
  };
}

/** Minimal structural check — not a full schema, just enough to refuse to hydrate garbage. */
function isPersistedStateShape(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === 'number' &&
    typeof v.onboarded === 'boolean' &&
    (v.profileName === null || typeof v.profileName === 'string') &&
    Array.isArray(v.recentWords) &&
    Array.isArray(v.customStories) &&
    typeof v.themeProgress === 'object' &&
    v.themeProgress !== null &&
    Array.isArray(v.activeDates) &&
    typeof v.cardEvaluations === 'object' &&
    v.cardEvaluations !== null
  );
}

/**
 * Loads persisted state. Returns defaults (never throws, never returns null)
 * on first run, parse failure, or a shape/version mismatch — a corrupt or
 * outdated record must never crash the app, it just resets local progress.
 */
export async function loadPersistedState(): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedStateShape(parsed) || parsed.version !== SCHEMA_VERSION) {
      return defaultState();
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort: a failed write should not crash the session, only skip persistence.
  }
}

export async function clearPersistedState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else to do — the in-memory state reset is what actually matters to the user.
  }
}

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Consecutive-day streak ending today, computed from real recorded active dates (no fabricated numbers). */
export function computeStreak(activeDates: string[]): number {
  if (activeDates.length === 0) return 0;
  const set = new Set(activeDates);
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
