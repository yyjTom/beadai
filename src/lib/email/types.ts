export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  readonly name: string;
  send(input: SendMailInput): Promise<void>;
}

export interface MagicLinkMail {
  to: string;
  url: string;
  expiresInMinutes: number;
  brandName: string;
}
