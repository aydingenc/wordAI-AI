// @ts-nocheck -- This directory is type-checked by Deno, not the Expo tsconfig.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function allowedOrigin(request: Request): string {
  const configured = Deno.env.get('APP_ALLOWED_ORIGIN')?.trim();
  if (!configured) return '*';
  return request.headers.get('origin') === configured ? configured : configured;
}

export function corsHeaders(request: Request): HeadersInit {
  return {
    'access-control-allow-origin': allowedOrigin(request),
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

export function jsonResponse(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export function handleOptions(request: Request): Response | null {
  if (request.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function requirePost(request: Request): void {
  if (request.method !== 'POST') {
    throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Only POST requests are accepted.');
  }
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new ApiError(415, 'INVALID_REQUEST', 'Content-Type must be application/json.');
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiError(400, 'INVALID_REQUEST', 'Request body must be valid JSON.');
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object.');
  }
  return value as Record<string, unknown>;
}

const SAFE_CODE_STATUS: Record<string, number> = {
  AUTH_REQUIRED: 401,
  INVALID_REQUEST: 400,
  INVALID_WORD_ID: 400,
  INVALID_SOURCE_HASH: 400,
  INVALID_CANONICAL_WORD_ID: 400,
  INVALID_STORY_VARIANT_ID: 400,
  WORD_NOT_IN_LIBRARY: 403,
  CONTENT_NOT_FOUND: 404,
  PAYWALL_REQUIRED: 403,
  STALE_SOURCE_HASH: 409,
  RATE_LIMITED: 429,
  STORY_NOT_FINISHED: 403,
  CONTENT_BUILD_PENDING: 409,
  LEGACY_WORD_ID_NOT_FOUND: 404,
};

export function errorResponse(request: Request, error: unknown): Response {
  if (error instanceof ApiError) {
    return jsonResponse(
      request,
      { error: { code: error.code, message: error.message, ...error.details } },
      error.status,
    );
  }

  const rawMessage = error instanceof Error ? error.message : '';
  if (rawMessage in SAFE_CODE_STATUS) {
    const status = SAFE_CODE_STATUS[rawMessage];
    return jsonResponse(request, { error: { code: rawMessage, message: rawMessage } }, status);
  }

  console.error('Phase 2A endpoint failed', {
    errorType: error instanceof Error ? error.name : typeof error,
  });
  return jsonResponse(
    request,
    { error: { code: 'INTERNAL_ERROR', message: 'The request could not be completed.' } },
    500,
  );
}
