import { normalizeClientError } from '@/lib/client-error';

export const createErrorReference = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 8).toUpperCase();
  }

  return Math.random().toString(36).slice(2, 10).toUpperCase();
};

export const logClientError = (error: unknown, referenceId: string) => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const normalized = normalizeClientError(error);

  console.error('[client-error]', {
    referenceId,
    name: normalized.name,
    message: normalized.message,
    digest: normalized.digest,
    stack: normalized.stack,
    raw: error,
  });
};
