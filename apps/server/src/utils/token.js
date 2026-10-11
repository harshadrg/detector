import jwt from 'jsonwebtoken';

const DEV_FALLBACK_SECRET = 'dev_insecure_jwt_secret_detector_2026';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEV_FALLBACK_SECRET) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be set to a secure secret in production mode.');
  }
}

const JWT_SECRET = process.env.JWT_SECRET || DEV_FALLBACK_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Generates a signed JWT session token.
 * @param {{ ecode: string, token_version: number }} payload
 * @returns {string}
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifies and decodes a signed JWT session token.
 * @param {string} token
 * @returns {{ ecode: string, token_version: number, iat: number, exp: number }}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Cookie security configuration options.
 */
export const cookieConfig = {
  accessToken: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  csrfToken: {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  },
};
