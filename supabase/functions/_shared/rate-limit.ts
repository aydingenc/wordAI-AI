// @ts-nocheck -- This directory is type-checked by Deno, not the Expo tsconfig.
import { ApiError } from './http.ts';
import { firstRpcRow, sha256Hex } from './policy.ts';
import { throwRpcError } from './clients.ts';

function clientAddress(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('cf-connecting-ip')?.trim() || null;
}

export async function enforceRateLimit(
  adminClient: ReturnType<typeof import('./clients.ts').createAdminClient>,
  request: Request,
  userId: string,
  endpoint: string,
  limit: number,
  windowSeconds = 60,
): Promise<void> {
  // Apply an independent per-user limit and, when available, a wider per-IP
  // limit. Store only one-way hashes; never persist the raw IP address.
  const subjects = [{ value: `user:${userId}`, subjectLimit: limit }];
  const address = clientAddress(request);
  if (address) subjects.push({ value: `ip:${address}`, subjectLimit: limit * 5 });

  for (const subject of subjects) {
    const subjectHash = await sha256Hex(subject.value);
    const { data, error } = await adminClient.rpc('consume_api_rate_limit_service', {
      p_subject_hash: subjectHash,
      p_endpoint: endpoint,
      p_limit: subject.subjectLimit,
      p_window_seconds: windowSeconds,
    });
    throwRpcError(error);

    const result = firstRpcRow(data);
    if (!result?.allowed) {
      const retryAfterSeconds = Number(result?.retry_after_seconds ?? windowSeconds);
      throw new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please try again shortly.', {
        retryAfterSeconds,
      });
    }
  }
}
