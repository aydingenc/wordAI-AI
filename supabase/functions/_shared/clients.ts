// @ts-nocheck -- This directory is type-checked by Deno, not the Expo tsconfig.
import { createClient } from 'npm:@supabase/supabase-js@2.110.7';
import { ApiError } from './http.ts';

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`SERVER_ENV_MISSING_${name}`);
  return value;
}

export function createAdminClient() {
  return createClient(
    requiredEnv('SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function authenticateRequest(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new ApiError(401, 'AUTH_REQUIRED', 'A valid user session is required.');

  const accessToken = match[1].trim();
  const client = createClient(
    requiredEnv('SUPABASE_URL'),
    requiredEnv('SUPABASE_ANON_KEY'),
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'The user session is invalid or expired.');
  }

  return { user: data.user, userClient: client };
}

export function throwRpcError(error: { message?: string } | null): void {
  if (!error) return;
  const knownCode = [
    'AUTH_REQUIRED',
    'INVALID_WORD_ID',
    'INVALID_SOURCE_HASH',
    'WORD_NOT_IN_LIBRARY',
    'STALE_SOURCE_HASH',
  ].find((code) => error.message?.includes(code));
  if (knownCode) throw new Error(knownCode);
  throw new Error('DATABASE_OPERATION_FAILED');
}
