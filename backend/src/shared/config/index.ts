import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mongoUri: process.env.MONGO_URI,
  pasetoSecret: process.env.PASETO_SECRET as string,
  smtpHost: process.env.SMTP_HOST,
  whatsappApiKey: process.env.WHATSAPP_API_KEY,
  allowedOrigins: process.env.ALLOWED_ORIGINS,
  datadogApiKey: process.env.DATADOG_API_KEY,
  nodeEnvironment: process.env.NODE_ENV,
  redis: {
    url: process.env.REDIS_URL as string,
  },
  jwt: {
    secret: process.env.JWT_PRIVATE_KEY || 'fallback-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_PRIVATE_KEY || 'fallback-refresh-secret-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    publicKey: process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') || '',
    refreshPrivateKey: process.env.JWT_REFRESH_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    refreshPublicKey: process.env.JWT_REFRESH_PUBLIC_KEY?.replace(/\\n/g, '\n') || '',
  },
  smtp: {
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL,
  },
  frontendUrl: process.env.FRONTEND_URL as string,
  passwordResetExpiryMinutes: 30,
};
