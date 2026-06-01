export type NormalizedClientError = {
  name: string;
  message: string;
  stack?: string;
  digest?: string;
};

export const isChunkLoadError = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  if (error instanceof Error) {
    return (
      error.name === 'ChunkLoadError' ||
      /loading chunk/i.test(error.message) ||
      /chunkloaderror/i.test(error.message)
    );
  }

  const asString = String(error);
  return /loading chunk/i.test(asString) || /chunkloaderror/i.test(asString);
};

export const normalizeClientError = (error: unknown): NormalizedClientError => {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'An unexpected error occurred.',
      stack: error.stack,
      digest: 'digest' in error ? String((error as { digest?: string }).digest ?? '') : undefined,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    const message =
      typeof record.message === 'string'
        ? record.message
        : typeof record.toString === 'function'
          ? String(error)
          : 'An unexpected error occurred.';

    return {
      name: typeof record.name === 'string' ? record.name : 'Error',
      message: message || 'An unexpected error occurred.',
      stack: typeof record.stack === 'string' ? record.stack : undefined,
    };
  }

  return {
    name: 'Error',
    message: String(error) || 'An unexpected error occurred.',
  };
};

export const getChunkLoadErrorCopy = () => ({
  title: 'This page needs a refresh',
  description:
    'The app was updated or the connection timed out while loading. Reload the page to fetch the latest version.',
});
