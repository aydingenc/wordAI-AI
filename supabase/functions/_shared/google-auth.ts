// @ts-nocheck -- This directory is type-checked by Deno, not the Expo tsconfig.

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

function base64Url(value: Uint8Array | string): string {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeServiceAccount(): ServiceAccountCredentials {
  const encoded = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON_BASE64')?.trim();
  if (!encoded) throw new Error('GOOGLE_TRANSLATION_NOT_CONFIGURED');

  try {
    const parsed = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))));
    if (typeof parsed.client_email !== 'string' || typeof parsed.private_key !== 'string') {
      throw new Error('invalid credentials');
    }
    return parsed;
  } catch {
    throw new Error('GOOGLE_TRANSLATION_INVALID_CREDENTIALS');
  }
}

function privateKeyBytes(pem: string): Uint8Array {
  const body = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  if (!body) throw new Error('GOOGLE_TRANSLATION_INVALID_CREDENTIALS');
  try {
    return Uint8Array.from(atob(body), (character) => character.charCodeAt(0));
  } catch {
    throw new Error('GOOGLE_TRANSLATION_INVALID_CREDENTIALS');
  }
}

async function serviceAccountAssertion(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1_000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-translation',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3_600,
  }));
  const unsigned = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

export function configuredGoogleProjectId(): string {
  const explicit = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')?.trim();
  if (explicit) return explicit;
  const fromCredentials = decodeServiceAccount().project_id?.trim();
  if (!fromCredentials) throw new Error('GOOGLE_TRANSLATION_NOT_CONFIGURED');
  return fromCredentials;
}

export async function googleCloudAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.accessToken;

  const credentials = decodeServiceAccount();
  const assertion = await serviceAccountAssertion(credentials);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`GOOGLE_AUTH_HTTP_${response.status}`);

  const payload = await response.json();
  if (typeof payload?.access_token !== 'string') throw new Error('GOOGLE_AUTH_INVALID_RESPONSE');
  const expiresIn = Number(payload.expires_in ?? 3_600);
  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(60, expiresIn) * 1_000,
  };
  return cachedToken.accessToken;
}
