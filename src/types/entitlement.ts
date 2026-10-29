export type PlanKey = 'free' | 'pro';

export interface EntitlementStatus {
  signedIn: boolean;
  email: string | null;
  plan: PlanKey;
  active: boolean;
  aiRemaining: number | null;
  aiUnlimited: boolean;
  canExportPdf: boolean;
  maxGrid: number;
  renewsAt: string | null;
  source: 'anonymous' | 'user' | 'subscription';
  integrations: {
    database: boolean;
    auth: boolean;
    google: boolean;
    email: boolean;
    ai: boolean;
    quota: boolean;
    payments: boolean;
    affiliate: boolean;
  };
}

export interface SessionUser {
  id: string;
  email: string;
  plan: PlanKey;
}

export interface SessionResponse {
  signedIn: boolean;
  user: SessionUser | null;
}
