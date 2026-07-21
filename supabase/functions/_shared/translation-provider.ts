// @ts-nocheck -- This directory is type-checked by Deno, not the Expo tsconfig.

export interface TranslationRequest {
  sourceText: string;
  sourceLanguage: 'en';
  targetLanguage: 'tr';
}

export interface TranslationProvider {
  readonly providerName: string;
  readonly modelName: string;
  translate(request: TranslationRequest): Promise<string>;
}

export class MockTranslationProvider implements TranslationProvider {
  readonly providerName = 'mock';
  readonly modelName = 'mock/no-network';
  private readonly output?: string;

  constructor(output?: string) {
    this.output = output;
  }

  async translate(request: TranslationRequest): Promise<string> {
    // Deterministic and intentionally performs no fetch/network operation.
    return this.output ?? `[MOCK tr]\n${request.sourceText}`;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

export class GoogleTranslationLlmProvider implements TranslationProvider {
  readonly providerName = 'google_cloud_translation';
  readonly modelName = 'general/translation-llm';

  async translate(request: TranslationRequest): Promise<string> {
    const apiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY')?.trim();
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')?.trim();
    const location = Deno.env.get('GOOGLE_CLOUD_LOCATION')?.trim();
    if (!apiKey || !projectId || !location) {
      throw new Error('GOOGLE_TRANSLATION_NOT_CONFIGURED');
    }

    const endpoint = new URL('https://translation.googleapis.com/language/translate/v2');
    endpoint.searchParams.set('key', apiKey);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        q: [request.sourceText],
        source: request.sourceLanguage,
        target: request.targetLanguage,
        format: 'text',
        model: `projects/${projectId}/locations/${location}/models/general/translation-llm`,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      // Never include the response body: provider errors can contain request data.
      throw new Error(`GOOGLE_TRANSLATION_HTTP_${response.status}`);
    }

    const payload = await response.json();
    const translated = payload?.data?.translations?.[0]?.translatedText;
    if (typeof translated !== 'string') throw new Error('GOOGLE_TRANSLATION_INVALID_RESPONSE');
    return decodeHtmlEntities(translated);
  }
}

export function getTranslationProvider(): TranslationProvider {
  const configured = Deno.env.get('TRANSLATION_PROVIDER')?.trim().toLowerCase();
  if (configured === 'mock') return new MockTranslationProvider();
  if (configured === 'google') return new GoogleTranslationLlmProvider();
  throw new Error('TRANSLATION_PROVIDER_NOT_CONFIGURED');
}
