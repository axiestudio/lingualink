import "dotenv/config";

export const ENV = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  FEATHERLESS_API_KEY: process.env.FEATHERLESS_API_KEY,
  ALLOW_DEV_RATE_LIMITS: process.env.ALLOW_DEV_RATE_LIMITS,
};
