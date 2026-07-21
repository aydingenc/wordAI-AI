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
  assertWordId,
  buildWordLabResponse,
  firstRpcRow,
} from '../_shared/policy.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';

Deno.serve(async (request: Request) => {
  const options = handleOptions(request);
  if (options) return options;

  try {
    requirePost(request);
    const body = await readJsonObject(request);
    const wordId = assertWordId(body.word_id);
    const { user, userClient } = await authenticateRequest(request);
    const adminClient = createAdminClient();
    await enforceRateLimit(adminClient, request, user.id, 'get-word-lab', 60, 60);

    const { data: claimData, error: claimError } = await userClient.rpc(
      'claim_word_feature_access',
      { p_word_id: wordId, p_feature: 'word_lab_full' },
    );
    throwRpcError(claimError);
    const claim = firstRpcRow(claimData);
    if (!claim || !['full', 'preview'].includes(claim.decision)) {
      throw new Error('INVALID_ACCESS_DECISION');
    }

    // service_role is used only after the user, membership, premium, and quota
    // checks above have completed.
    const { data: payload, error: payloadError } = await adminClient.rpc(
      'get_word_lab_payload_service',
      { p_word_id: wordId },
    );
    throwRpcError(payloadError);
    if (!payload) throw new ApiError(404, 'CONTENT_NOT_FOUND', 'Word content was not found.');

    return jsonResponse(request, buildWordLabResponse(claim, payload));
  } catch (error) {
    return errorResponse(request, error);
  }
});
