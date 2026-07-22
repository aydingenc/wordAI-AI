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
import { assertCanonicalWordId, assertOptionalStoryVariantId, firstRpcRow } from '../_shared/policy.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';
import { translateAndPersistCanonicalStory } from '../_shared/translation-job.ts';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

// Canonical 12.000 V2 contract (Teknik Şartname sec. 9). If storyVariantId is
// omitted, the canonical's default story is used. If provided, the payload
// RPC's join proves the variant actually belongs to this canonical word.
Deno.serve(async (request: Request) => {
  const options = handleOptions(request);
  if (options) return options;

  try {
    requirePost(request);
    const body = await readJsonObject(request);
    const canonicalWordId = assertCanonicalWordId(body.canonicalWordId);
    const storyVariantId = assertOptionalStoryVariantId(body.storyVariantId);
    const { user, userClient } = await authenticateRequest(request);
    const adminClient = createAdminClient();
    await enforceRateLimit(adminClient, request, user.id, 'open-word-story-v2', 20, 60);

    const { data: accessData, error: accessError } = await userClient.rpc(
      'claim_canonical_word_feature_access',
      { p_canonical_word_id: canonicalWordId, p_feature: 'word_story' },
    );
    throwRpcError(accessError);
    const access = firstRpcRow(accessData);

    if (!access) throw new Error('INVALID_ACCESS_DECISION');
    if (access.decision === 'paywall') {
      throw new ApiError(
        403,
        'PAYWALL_REQUIRED',
        'Bugünkü ücretsiz hikâye hakkını kullandın. Devam etmek için Premium’a geç.',
        {
          dailyUsage: {
            used: access.daily_used,
            limit: access.daily_limit,
            resetAt: access.reset_at,
          },
        },
      );
    }
    if (access.decision !== 'allowed') throw new Error('INVALID_ACCESS_DECISION');

    const { data: story, error: storyError } = await adminClient.rpc(
      'get_canonical_word_story_payload_service',
      { p_canonical_word_id: canonicalWordId, p_story_variant_id: storyVariantId ?? null },
    );
    throwRpcError(storyError);
    if (!story?.storyEn || !story?.sourceHash) {
      throw new ApiError(409, 'CONTENT_BUILD_PENDING', 'Word story was not found or is not published yet.');
    }

    const { data: stateData, error: stateError } = await adminClient.rpc(
      'get_canonical_story_translation_state_service',
      { p_story_variant_id: story.storyVariantId, p_source_hash: story.sourceHash, p_language_code: 'tr' },
    );
    throwRpcError(stateError);

    let translationStatus = stateData?.translationStatus ?? 'missing';
    let retryAfterSeconds = Number(stateData?.retryAfterSeconds ?? 0);

    if (translationStatus !== 'completed') {
      const { data: claimData, error: claimError } = await adminClient.rpc(
        'claim_canonical_story_translation_job_service',
        {
          p_story_variant_id: story.storyVariantId,
          p_source_hash: story.sourceHash,
          p_language_code: 'tr',
          p_lease_seconds: 120,
          p_max_attempts: 3,
        },
      );
      throwRpcError(claimError);
      const jobClaim = firstRpcRow(claimData);
      if (!jobClaim) throw new Error('TRANSLATION_CLAIM_FAILED');

      translationStatus = jobClaim.claim_status === 'claimed' ? 'processing' : jobClaim.claim_status;
      retryAfterSeconds = Number(jobClaim.retry_after_seconds ?? retryAfterSeconds);

      if (jobClaim.claim_status === 'claimed' && jobClaim.claim_lease_token) {
        EdgeRuntime.waitUntil(
          translateAndPersistCanonicalStory({
            adminClient,
            storyVariantId: story.storyVariantId,
            sourceHash: story.sourceHash,
            storyEn: story.storyEn,
            leaseToken: jobClaim.claim_lease_token,
          }),
        );
      }
    }

    return jsonResponse(request, {
      storyAccess: 'allowed',
      canonicalWordId: story.canonicalWordId,
      storyVariantId: story.storyVariantId,
      storyEn: story.storyEn,
      sourceHash: story.sourceHash,
      translationStatus,
      translateUnlockRule: 'reach_last_page',
      ...(retryAfterSeconds > 0 ? { retryAfterSeconds } : {}),
    });
  } catch (error) {
    return errorResponse(request, error);
  }
});
