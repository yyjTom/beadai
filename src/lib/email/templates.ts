import { env } from '@/lib/env';
import type { MagicLinkMail } from '@/lib/email/types';

const escape = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const layout = (title: string, body: string): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1E7;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFDF7;border-radius:24px;padding:32px;color:#2B2A29;">
        <tr>
          <td style="font-size:20px;font-weight:bold;">${escape(title)}</td>
        </tr>
        <tr>
          <td style="padding-top:18px;font-size:15px;line-height:24px;color:#6B6660;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding-top:28px;font-size:12px;line-height:20px;color:#6B6660;">
            beadai.app — turn photos and ideas into fuse bead patterns.
            If you did not request this link, you can safely ignore this email.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

export const magicLinkMail = (input: MagicLinkMail): { subject: string; html: string; text: string } => {
  const subject = 'Your beadai sign-in link';
  const safeUrl = escape(input.url);

  const body = `
    <p style="margin:0 0 16px;">Use the button below to sign in to ${escape(input.brandName)}. No password is needed.</p>
    <p style="margin:0 0 20px;">
      <a href="${safeUrl}" style="display:inline-block;background:#2B2A29;color:#FFFDF7;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:bold;">
        Sign in to beadai
      </a>
    </p>
    <p style="margin:0 0 12px;">This link works once and expires in ${input.expiresInMinutes} minutes.</p>
    <p style="margin:0;word-break:break-all;font-size:13px;">If the button does not work, paste this address into your browser:<br />${safeUrl}</p>
  `;

  const text = [
    'Use this link to sign in to beadai. No password is needed.',
    '',
    input.url,
    '',
    `This link works once and expires in ${input.expiresInMinutes} minutes.`,
    '',
    'If you did not request it, you can ignore this email.',
  ].join('\n');

  return { subject, html: layout(subject, body), text };
};

export const emailFromAddress = (): string => env.emailFrom;

export const supportEmail = (): string => env.supportEmail;
