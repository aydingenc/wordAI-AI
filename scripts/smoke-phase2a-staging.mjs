import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const WORD_IDS = ['travel-airport', 'travel-stay', 'travel-welcome', 'travel-drive'];

class FunctionFailure extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
async function errorPayload(error) {
  const response = error?.context instanceof Response ? error.context : null;
  if (!response) return { response: null, payload: null };
  try { return { response, payload: await response.clone().json() }; }
  catch { return { response, payload: null }; }
}
async function invoke(supabaseClient, name, body) {
  const { data, error } = await supabaseClient.functions.invoke(name, { body });
  if (!error) return data;
  const { response, payload } = await errorPayload(error);
  throw new FunctionFailure(payload?.error?.code ?? 'FUNCTION_FAILED', response?.status,
    payload?.error?.message ?? 'Edge Function request failed.');
}
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function waitForMockTranslation(supabaseClient, wordId, sourceHash) {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const result = await invoke(supabaseClient, 'get-word-story-translation', { word_id: wordId, source_hash: sourceHash });
    if (result.translationStatus === 'completed') return result.storyTr;
    assert.ok(['processing', 'failed'].includes(result.translationStatus));
    if (result.translationStatus === 'failed' && Number(result.retryAfterSeconds) === 0) throw new Error('Mock translation exhausted its retry policy.');
    await wait(Math.max(500, Math.min(Number(result.retryAfterSeconds ?? 1) * 1_000, 2_000)));
  }
  throw new Error('Mock translation did not complete within the smoke-test window.');
}
if (!url || !/^https:\/\//.test(url) || !publishableKey || publishableKey.length < 20) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  process.exit(2);
}
const supabase = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
let userId = null;
try {
  const { data: auth, error: authError } = await supabase.auth.signInAnonymously();
  if (authError || !auth.user || !auth.session) throw new Error('Anonymous staging sign-in failed.');
  userId = auth.user.id;
  const { error: membershipError } = await supabase.from('user_words').upsert(
    WORD_IDS.map((wordId) => ({ user_id: userId, word_id: wordId, status: 'active' })),
    { onConflict: 'user_id,word_id' },
  );
  if (membershipError) throw new Error('Could not create staging word memberships.');
  const labResults = [];
  for (const wordId of WORD_IDS) labResults.push(await invoke(supabase, 'get-word-lab', { word_id: wordId }));
  assert.deepEqual(labResults.map((result) => result.accessMode), ['full', 'full', 'full', 'preview']);
  assert.deepEqual(Object.keys(labResults[3].content.wordDna), ['basic']);
  assert.deepEqual(Object.keys(labResults[3].content.sentenceLab), ['present']);
  assert.equal(Object.hasOwn(labResults[3].content.wordDna, 'mid'), false);
  assert.equal(Object.hasOwn(labResults[3].content.wordDna, 'advanced'), false);
  for (const lockedKey of ['presentContinuous', 'past', 'future', 'presentPerfect']) assert.equal(Object.hasOwn(labResults[3].content.sentenceLab, lockedKey), false);
  const story = await invoke(supabase, 'open-word-story', { word_id: WORD_IDS[0] });
  assert.equal(story.storyAccess, 'allowed');
  assert.equal(story.translateUnlockRule, 'reach_last_page');
  assert.match(story.sourceHash, /^[0-9a-f]{64}$/);
  assert.match(await waitForMockTranslation(supabase, WORD_IDS[0], story.sourceHash), /^\[MOCK tr\]/);
  await assert.rejects(
    () => invoke(supabase, 'open-word-story', { word_id: WORD_IDS[1] }),
    (error) => error instanceof FunctionFailure && error.code === 'PAYWALL_REQUIRED' && error.status === 403,
  );
  console.log('PASS mock staging smoke: anonymous auth, 3+preview lab quota, story cache, and paywall.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Phase 2A staging smoke test failed.');
  process.exitCode = 1;
} finally {
  if (userId) await supabase.from('user_words').delete().eq('user_id', userId);
  await supabase.auth.signOut();
}
