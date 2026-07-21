// @ts-nocheck -- This directory is type-checked by Deno, not the Expo tsconfig.
import { configuredGoogleProjectId, googleCloudAccessToken } from './google-auth.ts';

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

export const TRANSLATION_LLM_MAX_CODE_POINTS = 4_500;

function splitLongText(value: string, limit: number): string[] {
  const characters = [...value];
  const parts: string[] = [];
  let offset = 0;
  while (offset < characters.length) {
    let end = Math.min(offset + limit, characters.length);
    if (end < characters.length) {
      const candidate = characters.slice(offset, end).join('');
      const boundary = Math.max(candidate.lastIndexOf('. '), candidate.lastIndexOf(' '));
      if (boundary > Math.floor(limit * 0.6)) end = offset + [...candidate.slice(0, boundary + 1)].length;
    }
    parts.push(characters.slice(offset, end).join('').trim());
    offset = end;
    while (characters[offset] === ' ') offset += 1;
  }
  return parts.filter(Boolean);
}

export function chunkTranslationText(
  sourceText: string,
  limit = TRANSLATION_LLM_MAX_CODE_POINTS,
): string[] {
  if (!Number.isInteger(limit) || limit < 100) throw new Error('INVALID_TRANSLATION_CHUNK_LIMIT');
  const paragraphs = sourceText.replace(/\r\n?/g, '\n').split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const pieces = [...paragraph].length > limit ? splitLongText(paragraph, limit) : [paragraph];
    for (const piece of pieces) {
      const combined = current ? `${current}\n\n${piece}` : piece;
      if ([...combined].length <= limit) current = combined;
      else {
        if (current) chunks.push(current);
        current = piece;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export class GoogleTranslationLlmProvider implements TranslationProvider {
  readonly providerName = 'google_cloud_translation';
  readonly modelName = 'general/translation-llm';

  async translate(request: TranslationRequest): Promise<string> {
    if (Deno.env.get('TRANSLATION_LIVE_ENABLED')?.trim().toLowerCase() !== 'true') {
      throw new Error('TRANSLATION_LIVE_DISABLED');
    }
    const projectId = configuredGoogleProjectId();
    const location = Deno.env.get('GOOGLE_CLOUD_LOCATION')?.trim() || 'global';
    if (!/^[a-z0-9-]+$/i.test(projectId) || !/^[a-z0-9-]+$/i.test(location)) {
      throw new Error('GOOGLE_TRANSLATION_NOT_CONFIGURED');
    }
    const accessToken = await googleCloudAccessToken();
    const endpoint = `https://translation.googleapis.com/v3/projects/${projectId}/locations/${location}:translateText`;
    const translatedChunks: string[] = [];

    for (const content of chunkTranslationText(request.sourceText)) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sourceLanguageCode: request.sourceLanguage,
          targetLanguageCode: request.targetLanguage,
          mimeType: 'text/plain',
          model: `projects/${projectId}/locations/${location}/models/general/translation-llm`,
          contents: [content],
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!response.ok) throw new Error(`GOOGLE_TRANSLATION_HTTP_${response.status}`);
      const payload = await response.json();
      const translated = payload?.translations?.[0]?.translatedText;
      if (typeof translated !== 'string') throw new Error('GOOGLE_TRANSLATION_INVALID_RESPONSE');
      translatedChunks.push(translated.trim());
    }
    return translatedChunks.join('\n\n');
  }
}

export function getTranslationProvider(): TranslationProvider {
  const configured = Deno.env.get('TRANSLATION_PROVIDER')?.trim().toLowerCase();
  if (configured === 'mock') return new MockTranslationProvider();
  if (configured === 'google') return new GoogleTranslationLlmProvider();
  throw new Error('TRANSLATION_PROVIDER_NOT_CONFIGURED');
}
