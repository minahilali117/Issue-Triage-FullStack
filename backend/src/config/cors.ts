const defaultOrigin = 'http://localhost:3000';

export const getAllowedOrigins = (): string[] => {
  const raw =
    process.env.CORS_ORIGIN ?? process.env.FRONTEND_ORIGIN ?? defaultOrigin;

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};
