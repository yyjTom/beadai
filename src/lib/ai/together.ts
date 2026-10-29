import { env } from '@/lib/env';
import { AI_ERROR_MESSAGES, type AiErrorCode, type GeneratedImage, type ImageProvider } from '@/types/ai';

interface TogetherImageItem {
  b64_json?: string;
  url?: string;
  type?: string;
}

interface TogetherResponse {
  data?: TogetherImageItem[];
  model?: string;
}

export class AiProviderError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode) {
    super(AI_ERROR_MESSAGES[code]);
    this.code = code;
  }
}

const isTransient = (status: number): boolean => status >= 500 || status === 429;

export const togetherProvider: ImageProvider = {
  name: 'together',
  async generate(prompt, opts): Promise<GeneratedImage> {
    const key = env.togetherApiKey;
    if (!key) throw new AiProviderError('not_configured');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.togetherTimeoutMs);

    const onAbort = () => controller.abort();
    opts.signal?.addEventListener('abort', onAbort);

    const attempt = async (): Promise<Response> =>
      fetch('https://api.together.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.togetherModel,
          prompt,
          n: 1,
          width: 1024,
          height: 1024,
          steps: 8,
          response_format: 'base64',
          output_format: 'png',
        }),
        signal: controller.signal,
      });

    try {
      let response = await attempt();
      let delay = 700;

      for (let retry = 0; retry < 1 && isTransient(response.status); retry += 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        response = await attempt();
        delay *= 2;
      }

      if (response.status === 400 || response.status === 422) {
        throw new AiProviderError('provider_rejected');
      }

      if (response.status === 401 || response.status === 403) {
        throw new AiProviderError('not_configured');
      }

      if (response.status === 429) {
        throw new AiProviderError('rate_limited');
      }

      if (!response.ok) {
        throw new AiProviderError('provider_unavailable');
      }

      const payload = (await response.json()) as TogetherResponse;
      const item = payload.data?.[0];

      if (item?.b64_json) {
        const bytes = Math.ceil((item.b64_json.length * 3) / 4);
        if (bytes > env.togetherMaxOutputBytes) {
          throw new AiProviderError('provider_unavailable');
        }

        return {
          dataUrl: `data:image/png;base64,${item.b64_json}`,
          width: 1024,
          height: 1024,
          model: payload.model ?? env.togetherModel,
          provider: 'together',
        };
      }

      if (item?.url) {
        return {
          dataUrl: item.url,
          width: 1024,
          height: 1024,
          model: payload.model ?? env.togetherModel,
          provider: 'together',
        };
      }

      throw new AiProviderError('provider_unavailable');
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AiProviderError('provider_timeout');
      }
      console.error('[together] image generation failed', error);
      throw new AiProviderError('provider_unavailable');
    } finally {
      clearTimeout(timeout);
      opts.signal?.removeEventListener('abort', onAbort);
    }
  },
};
