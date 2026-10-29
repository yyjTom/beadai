import { env } from '@/lib/env';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export const googleRedirectUri = (): string =>
  `${env.siteUrl.replace(/\/+$/, '')}/api/auth/google/callback`;

export const buildGoogleAuthUrl = (input: { state: string; redirectUri: string }): string => {
  const params = new URLSearchParams({
    client_id: env.googleClientId ?? '',
    redirect_uri: input.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: input.state,
    access_type: 'online',
    prompt: 'select_account',
  });

  return `${AUTH_URL}?${params.toString()}`;
};

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  subject: string;
}

export const exchangeGoogleCode = async (code: string, redirectUri: string): Promise<string> => {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId ?? '',
      client_secret: env.googleClientSecret ?? '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    console.error('[google] token exchange failed', response.status);
    throw new Error('token_failed');
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error('token_failed');
  return payload.access_token;
};

export const fetchGoogleProfile = async (accessToken: string): Promise<GoogleProfile> => {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.error('[google] userinfo failed', response.status);
    throw new Error('profile_failed');
  }

  const payload = (await response.json()) as {
    email?: string;
    email_verified?: boolean;
    sub?: string;
  };

  if (!payload.email || !payload.sub) throw new Error('profile_failed');

  return {
    email: payload.email,
    emailVerified: payload.email_verified === true,
    subject: `google:${payload.sub}`,
  };
};
