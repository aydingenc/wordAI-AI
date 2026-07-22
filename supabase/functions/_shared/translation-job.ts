// @ts-nocheck -- This directory is type-checked by Deno, not the Expo tsconfig.
import { getTranslationProvider } from './translation-provider.ts';
import { validateTranslation, TranslationValidationError } from './policy.ts';

export interface TranslationJobInput {
  adminClient: unknown;
  wordId: string;
  sourceHash: string;
  storyEn: string;
  leaseToken: string;
}

function errorCode(error: unknown): string {
  if (error instanceof TranslationValidationError) return error.code;
  if (error instanceof Error && /^[A-Z0-9_]{3,80}$/.test(error.message)) return error.message;
  if (error instanceof Error && /^GOOGLE_TRANSLATION_HTTP_\d{3}$/.test(error.message)) return error.message;
  return 'TRANSLATION_FAILED';
}

export async function translateAndPersist(input: TranslationJobInput): Promise<void> {
  try {
    const provider = getTranslationProvider();
    const rawTranslation = await provider.translate({
      sourceText: input.storyEn,
      sourceLanguage: 'en',
      targetLanguage: 'tr',
    });
    const storyTr = validateTranslation(input.storyEn, rawTranslation);

    const { data, error } = await input.adminClient.rpc('complete_story_translation_job_service', {
      p_word_id: input.wordId,
      p_source_hash: input.sourceHash,
      p_lease_token: input.leaseToken,
      p_translated_text: storyTr,
      p_input_character_count: input.storyEn.length,
      p_output_character_count: storyTr.length,
      p_language_code: 'tr',
    });
    if (error) throw new Error('TRANSLATION_COMPLETE_RPC_FAILED');
    if (data !== true) throw new Error('TRANSLATION_LEASE_LOST');
  } catch (error) {
    const code = errorCode(error);
    const safeMessage = error instanceof TranslationValidationError
      ? error.message
      : 'The translation provider or worker did not complete the job.';

    try {
      await input.adminClient.rpc('fail_story_translation_job_service', {
        p_word_id: input.wordId,
        p_source_hash: input.sourceHash,
        p_lease_token: input.leaseToken,
        p_error_code: code,
        p_error_message: safeMessage,
        p_language_code: 'tr',
      });
    } catch {
      // A newer worker may have taken over the expired lease; do not overwrite it.
    }

    console.error('Story translation job failed', { wordId: input.wordId, errorCode: code });
  }
}

export interface CanonicalTranslationJobInput {
  adminClient: unknown;
  storyVariantId: string;
  sourceHash: string;
  storyEn: string;
  leaseToken: string;
}

// Canonical 12.000 V2 equivalent of translateAndPersist, keyed by
// story_variant_id instead of legacy word_id (sec. 4.3).
export async function translateAndPersistCanonicalStory(input: CanonicalTranslationJobInput): Promise<void> {
  try {
    const provider = getTranslationProvider();
    const rawTranslation = await provider.translate({
      sourceText: input.storyEn,
      sourceLanguage: 'en',
      targetLanguage: 'tr',
    });
    const storyTr = validateTranslation(input.storyEn, rawTranslation);

    const { data, error } = await input.adminClient.rpc('complete_canonical_story_translation_job_service', {
      p_story_variant_id: input.storyVariantId,
      p_source_hash: input.sourceHash,
      p_lease_token: input.leaseToken,
      p_translated_text: storyTr,
      p_input_character_count: input.storyEn.length,
      p_output_character_count: storyTr.length,
      p_language_code: 'tr',
    });
    if (error) throw new Error('TRANSLATION_COMPLETE_RPC_FAILED');
    if (data !== true) throw new Error('TRANSLATION_LEASE_LOST');
  } catch (error) {
    const code = errorCode(error);
    const safeMessage = error instanceof TranslationValidationError
      ? error.message
      : 'The translation provider or worker did not complete the job.';

    try {
      await input.adminClient.rpc('fail_canonical_story_translation_job_service', {
        p_story_variant_id: input.storyVariantId,
        p_source_hash: input.sourceHash,
        p_lease_token: input.leaseToken,
        p_error_code: code,
        p_error_message: safeMessage,
        p_language_code: 'tr',
      });
    } catch {
      // A newer worker may have taken over the expired lease; do not overwrite it.
    }

    console.error('Canonical story translation job failed', { storyVariantId: input.storyVariantId, errorCode: code });
  }
}
