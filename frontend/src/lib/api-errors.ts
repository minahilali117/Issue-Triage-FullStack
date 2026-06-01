import { ApiError } from '@/lib/api';
import { appToast } from '@/lib/toast';

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'Requested resource could not be found.',
  409: 'This action could not be completed because of a conflict.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error occurred.',
};

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (isApiError(error)) {
    if (error.status === 409 && error.message) {
      return error.message;
    }

    const mapped = STATUS_MESSAGES[error.status];
    if (mapped) {
      return mapped;
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

type ShowApiErrorOptions = {
  fallback?: string;
  /** Skip toast for 401 — auth invalid event already clears session. */
  skipUnauthorizedToast?: boolean;
  dedupeKey?: string;
};

export const showApiErrorToast = (
  error: unknown,
  options?: ShowApiErrorOptions,
) => {
  if (isApiError(error) && error.status === 401) {
    if (options?.skipUnauthorizedToast !== false) {
      return;
    }
  }

  const message = getApiErrorMessage(error, options?.fallback);
  appToast.error(message, { dedupeKey: options?.dedupeKey });
};
