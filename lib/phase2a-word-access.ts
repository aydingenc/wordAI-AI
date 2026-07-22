import { ensureAnonymousSession, supabase } from './supabase';

/**
 * The mock app's local word dictionary (data/mock.ts) and the real Phase 2A
 * catalog are two disconnected content sources with unrelated id formats
 * (`w-<ts36>-<rand>` vs `<category>-<word>`). No screen currently has a real
 * catalog word_id to pass through route params, so this resolves one by
 * matching the English word text against the safely public-readable
 * `public.words.word` column. Returns null if the word isn't in the real
 * catalog yet (most mock words won't be, until content coverage grows) or if
 * Supabase isn't configured.
 */
export async function resolvePhase2aWordId(englishWord: string): Promise<string | null> {
  if (!supabase) return null;
  const trimmed = englishWord.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('words')
    .select('id')
    .ilike('word', trimmed)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

/**
 * `claim_word_feature_access` (the RPC behind get-word-lab/open-word-story)
 * requires the word to already be in the caller's own `user_words` — this
 * app has no "add to Phase 2A library" flow yet, so viewing a word's
 * WordDNA/story is what implicitly adds it, mirroring how the mock app
 * already treats "recently viewed" as "in your list".
 */
export async function ensurePhase2aWordMembership(wordId: string): Promise<void> {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  const session = await ensureAnonymousSession();
  const { error } = await supabase
    .from('user_words')
    .upsert({ user_id: session.user.id, word_id: wordId, status: 'active' }, { onConflict: 'user_id,word_id' });
  if (error) throw new Error('MEMBERSHIP_UPSERT_FAILED');
}
