// @ts-nocheck -- Supabase Edge Runtime entrypoint.
import { authenticateRequest, createAdminClient, throwRpcError } from '../_shared/clients.ts';
import {
  ApiError,
  errorResponse,
  handleOptions,
  jsonResponse,
  readJsonObject,
  requirePost,
} from '../_shared/http.ts';
import {
  assertCanonicalWordId,
  assertSourceHash,
  assertStoryVariantId,
  firstRpcRow,
} from '../_shared/policy.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';
import { translateAndPersistCanonicalStory } from '../_shared/translation-job.ts';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

// Canonical 12.000 V2 contract (Teknik Şartname sec. 7, 9).
// readerReachedLastPage is an additional application-level gate on top of the
// real entitlement/grant check below -- per spec it is explicitly NOT treated
// as the security boundary by itself, so the paywall/library checks still run
// even when the client claims the reader reached the last page.
Deno.serve(async (request: Request) => {
  const options = handleOptions(request);
  if (options) return options;

  try {
    requirePost(request);
    const body = await readJsonObject(request);
    const canonicalWordId = assertCanonicalWordId(body.canonicalWordId);
    const storyVariantId = assertStoryVariantId(body.storyVariantId);
    const sourceHash = assertSourceHash(body.sourceHash);
    if (body.readerReachedLastPage !== true) {
      throw new ApiError(
        403,
        'STORY_NOT_FINISHED',
        'Hikâyenin son sayfasına kadar ilerlemeniz gerekmektedir.',
      );
    }

    const { user, userClient } = await authenticateRequest(request);
    const adminClient = createAdminClient();
    await enforceRateLimit(adminClient, request, user.id, 'get-word-story-translation-v2', 30, 60);

    const { data: accessData, error: accessError } = await userClient.rpc(
      'claim_canonical_word_feature_access',
      { p_canonical_word_id: canonicalWordId, p_feature: 'word_story' },
    );
    throwRpcError(accessError);
    const access = firstRpcRow(accessData);
    if (!access) throw new Error('INVALID_ACCESS_DECISION');
    if (access.decision === 'paywall') {
      throw new ApiError(403, 'PAYWALL_REQUIRED', 'Bu hikâye için erişim hakkın bulunmuyor.');
    }
    if (access.decision !== 'allowed') throw new Error('INVALID_ACCESS_DECISION');

    const { data: story, error: storyError } = await adminClient.rpc(
      'get_canonical_word_story_payload_service',
      { p_canonical_word_id: canonicalWordId, p_story_variant_id: storyVariantId },
    );
    throwRpcError(storyError);
    if (!story?.storyEn || !story?.sourceHash) {
      throw new ApiError(409, 'CONTENT_BUILD_PENDING', 'Word story was not found or is not published yet.');
    }
    if (story.sourceHash !== sourceHash) {
      throw new ApiError(409, 'STALE_SOURCE_HASH', 'The English story has changed. Reopen it first.');
    }

    const { data: state, error: stateError } = await adminClient.rpc(
      'get_canonical_story_translation_state_service',
      { p_story_variant_id: storyVariantId, p_source_hash: sourceHash, p_language_code: 'tr' },
    );
    throwRpcError(stateError);
    if (state?.translationStatus === 'completed' && typeof state.storyTr === 'string') {
      return jsonResponse(request, { translationStatus: 'completed', storyTr: state.storyTr });
    }

    const { data: claimData, error: claimError } = await adminClient.rpc(
      'claim_canonical_story_translation_job_service',
      {
        p_story_variant_id: storyVariantId,
        p_source_hash: sourceHash,
        p_language_code: 'tr',
        p_lease_seconds: 120,
        p_max_attempts: 3,
      },
    );
    throwRpcError(claimError);
    const jobClaim = firstRpcRow(claimData);
    if (!jobClaim) throw new Error('TRANSLATION_CLAIM_FAILED');

    if (jobClaim.claim_status === 'completed' && typeof jobClaim.claim_translated_text === 'string') {
      return jsonResponse(request, { translationStatus: 'completed', storyTr: jobClaim.claim_translated_text });
    }

    if (jobClaim.claim_status === 'claimed' && jobClaim.claim_lease_token) {
      EdgeRuntime.waitUntil(
        translateAndPersistCanonicalStory({
          adminClient,
          storyVariantId,
          sourceHash,
          storyEn: story.storyEn,
          leaseToken: jobClaim.claim_lease_token,
        }),
      );
    }

    const translationStatus = jobClaim.claim_status === 'claimed' ? 'processing' : jobClaim.claim_status;
    return jsonResponse(request, {
      translationStatus,
      retryAfterSeconds: Number(jobClaim.retry_after_seconds ?? 2),
    });
  } catch (error) {
    return errorResponse(request, error);
  }
});
