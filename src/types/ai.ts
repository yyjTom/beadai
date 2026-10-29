export type AiErrorCode =
  | 'missing_prompt'
  | 'prompt_too_long'
  | 'prompt_too_short'
  | 'content_blocked'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'provider_unavailable'
  | 'provider_timeout'
  | 'provider_rejected'
  | 'not_configured'
  | 'unauthorized'
  | 'server_error';

export interface AiErrorPayload {
  code: AiErrorCode;
  message: string;
  retryAfterSeconds?: number;
}

export interface GeneratedImage {
  dataUrl: string;
  width: number;
  height: number;
  model: string;
  provider: string;
}

export interface AiGenerateResponse {
  image: GeneratedImage;
  entitlement: {
    aiRemaining: number | null;
    aiUnlimited: boolean;
    plan: 'free' | 'pro';
  };
}

export interface ImageProvider {
  readonly name: string;
  generate(prompt: string, opts: { signal?: AbortSignal }): Promise<GeneratedImage>;
}

export const AI_ERROR_MESSAGES: Record<AiErrorCode, string> = {
  missing_prompt: 'Describe what you want to turn into beads first.',
  prompt_too_long: 'That description is too long. Keep it under 400 characters.',
  prompt_too_short: 'Add a few more words so the generator knows what to draw.',
  content_blocked: 'Content policy violation, please try a different prompt.',
  rate_limited: 'Slow down for a moment and try again shortly.',
  quota_exceeded: "You have used today's free AI generations. Sign in for more or subscribe to Pro.",
  provider_unavailable: 'The image generator is unavailable right now. Please try again.',
  provider_timeout: 'The image generator took too long. Please try again.',
  provider_rejected: 'The image generator rejected this request. Please adjust your prompt.',
  not_configured: 'AI generation is not configured on this deployment yet.',
  unauthorized: 'Please sign in to continue.',
  server_error: 'Something went wrong on our side. Please try again.',
};
