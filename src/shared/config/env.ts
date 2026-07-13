/**
 * Centralized, validated environment configuration.
 *
 * Every required variable is checked once at startup. If any is missing the
 * process exits immediately with a clear message instead of failing later with
 * a cryptic runtime error (e.g. `jwt must be provided`).
 */

const REQUIRED_VARS = [
  "MONGODB_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "EMAIL_USERNAME",
  "APP_PASSWORD",
  "BASE_URL",
  "ACCESS_KEY",
  "SECRET_ACCESS_KEY",
  "BUCKET_NAME",
  "BUCKET_REGION",
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

function loadEnv(): Record<RequiredVar, string> & {
  PORT: number;
  ACCESS_TOKEN_TTL: string;
  REFRESH_TOKEN_TTL: string;
} {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `[env] Missing required environment variable(s): ${missing.join(", ")}`
    );
    process.exit(1);
  }

  const resolved = REQUIRED_VARS.reduce((acc, key) => {
    acc[key] = process.env[key] as string;
    return acc;
  }, {} as Record<RequiredVar, string>);

  return {
    ...resolved,
    PORT: Number(process.env.PORT) || 3001,
    // Access token lifetime — short-lived; refreshed via /auth/token.
    ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || "6h",
    REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || "7d",
  };
}

export const env = loadEnv();
