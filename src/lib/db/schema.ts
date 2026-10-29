import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    emailNormalized: text('email_normalized').notNull(),
    emailDisplay: text('email_display').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('users_email_normalized_key').on(table.emailNormalized)],
);

export const authIdentities = pgTable(
  'auth_identities',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerSubject: text('provider_subject').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('auth_identities_provider_subject_key').on(table.provider, table.providerSubject),
    index('auth_identities_user_idx').on(table.userId),
  ],
);

export const magicLoginTokens = pgTable(
  'magic_login_tokens',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    emailNormalized: text('email_normalized').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    ipHash: text('ip_hash'),
    userAgentHash: text('user_agent_hash'),
  },
  (table) => [
    uniqueIndex('magic_login_tokens_hash_key').on(table.tokenHash),
    index('magic_login_tokens_email_idx').on(table.emailNormalized),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    ipHash: text('ip_hash'),
    userAgentHash: text('user_agent_hash'),
  },
  (table) => [
    uniqueIndex('sessions_token_hash_key').on(table.tokenHash),
    index('sessions_user_idx').on(table.userId),
  ],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerSubscriptionId: text('provider_subscription_id').notNull(),
    status: text('status').notNull(),
    planKey: text('plan_key').notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('subscriptions_provider_sub_key').on(table.provider, table.providerSubscriptionId),
    index('subscriptions_user_idx').on(table.userId),
  ],
);

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id').notNull(),
    provider: text('provider').notNull(),
    eventType: text('event_type').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    result: text('result'),
  },
  (table) => [uniqueIndex('webhook_events_provider_event_key').on(table.provider, table.eventId)],
);

export const dailyAiUsage = pgTable(
  'daily_ai_usage',
  {
    id: text('id').primaryKey(),
    subjectKey: text('subject_key').notNull(),
    dayKey: text('day_key').notNull(),
    count: text('count').notNull().default('0'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('daily_ai_usage_subject_day_key').on(table.subjectKey, table.dayKey)],
);

export const loginRateBuckets = pgTable(
  'login_rate_buckets',
  {
    id: text('id').primaryKey(),
    bucketKey: text('bucket_key').notNull(),
    count: text('count').notNull().default('0'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex('login_rate_buckets_key').on(table.bucketKey)],
);

export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
