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
import { assertWordId } from '../_shared/policy.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';

// Canonical 12.000 V2 legacy ID resolver (Teknik Şartname sec. 9). Lets old
// deep-links, favorites, and any other stored legacy wordId resolve to a
// canonical ID during the transition. Unknown legacy id -> 404. This only
// returns IDs and a pending flag -- no protected content -- so it needs an
// authenticated session but no entitlement/quota claim.
Deno.serve(async (request: Request) => {
  const options = handleOptions(request);
  if (options) return options;

  try {
    requirePost(request);
    const body = await readJsonObject(request);
    const legacyWordId = assertWordId(body.wordId);
    const { user } = await authenticateRequest(request);
    const adminClient = createAdminClient();
    await enforceRateLimit(adminClient, request, user.id, 'resolve-legacy-word', 60, 60);

    const { data: resolved, error } = await adminClient.rpc('resolve_legacy_word_id_service', {
      p_legacy_word_id: legacyWordId,
    });
    throwRpcError(error);
    if (!resolved) throw new ApiError(404, 'LEGACY_WORD_ID_NOT_FOUND', 'This legacy word id is not mapped to a canonical word.');

    return jsonResponse(request, resolved);
  } catch (error) {
    return errorResponse(request, error);
  }
});
