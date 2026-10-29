import { env } from '@/lib/env';
import { emailFromAddress, magicLinkMail } from '@/lib/email/templates';
import type { EmailProvider, MagicLinkMail, SendMailInput } from '@/lib/email/types';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export const isEmailConfigured = (): boolean => Boolean(env.resendApiKey);

const postWithRetry = async (payload: Record<string, unknown>): Promise<void> => {
  const key = env.resendApiKey;
  if (!key) throw new Error('email_not_configured');

  const attempt = async (): Promise<Response> =>
    fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  let response = await attempt();
  let delay = 600;

  for (let retry = 0; retry < 2 && (response.status >= 500 || response.status === 429); retry += 1) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    response = await attempt();
    delay *= 2;
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 160);
    console.error('[resend] send failed', response.status, detail);
    throw new Error('email_send_failed');
  }
};

export const resendProvider: EmailProvider = {
  name: 'resend',
  async send(input: SendMailInput): Promise<void> {
    await postWithRetry({
      from: emailFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  },
};

export const sendMagicLinkEmail = async (input: MagicLinkMail): Promise<void> => {
  const mail = magicLinkMail(input);

  if (!isEmailConfigured()) {
    console.error('[email] RESEND_API_KEY missing; magic link email was not sent');
    throw new Error('email_not_configured');
  }

  await resendProvider.send({ to: input.to, ...mail });
};
