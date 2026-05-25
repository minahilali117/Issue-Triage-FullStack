export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'triage_auth';

const COOKIE_MAX_AGE_FALLBACK_MS = 24 * 60 * 60 * 1000;

export const AUTH_COOKIE_MAX_AGE_MS = Number(
  process.env.AUTH_COOKIE_MAX_AGE_MS ?? COOKIE_MAX_AGE_FALLBACK_MS,
);

export const AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE === 'true';
