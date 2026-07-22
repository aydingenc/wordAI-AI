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
  buildWordLabResponse,
  firstRpcRow,
} from '../_shared/policy.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';

// Canonical 12.000 V2 contract (Teknik Şartname sec. 9). `requestedTab` is
// accepted but does not change server behavior -- access is decided purely by
// the canonical daily grant, exactly like V1's get-word-lab.
Deno.serve(async (request: Request) => {
  const options = handleOptions(request);
  if (options) return options;

  try {
    requirePost(request);
    const body = await readJsonObject(request);
    const canonicalWordId = assertCanonicalWordId(body.canonicalWordId);
    const { user, userClient } = await authenticateRequest(request);
    const adminClient = createAdminClient();
    await enforceRateLimit(adminClient, request, user.id, 'get-word-lab-v2', 60, 60);

    const { data: claimData, error: claimError } = await userClient.rpc(
      'claim_canonical_word_feature_access',
      { p_canonical_word_id: canonicalWordId, p_feature: 'word_lab_full' },
    );
    throwRpcError(claimError);
    const claim = firstRpcRow(claimData);
    if (!claim || !['full', 'preview'].includes(claim.decision)) {
      throw new Error('INVALID_ACCESS_DECISION');
    }

    const { data: payload, error: payloadError } = await adminClient.rpc(
      'get_canonical_word_lab_payload_service',
      { p_canonical_word_id: canonicalWordId },
    );
    throwRpcError(payloadError);
    if (!payload) throw new ApiError(409, 'CONTENT_BUILD_PENDING', 'Word content is not published yet.');

    return jsonResponse(request, buildWordLabResponse(claim, payload));
  } catch (error) {
    return errorResponse(request, error);
  }
});
