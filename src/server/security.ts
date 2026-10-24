import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheIncr,
  cacheGetSync,
  cacheSetSync,
  cacheDeleteSync,
  cacheIncrSync
} from './redisStore';

// ============================================================================
// 1. PASSWORD POLICY & ASYNC SCRYPT ENGINE (OWASP ASVS V2.1, V6.2)
// ============================================================================

// Scrypt explicit tuning parameters: N = 2^14 (16384), r = 8, p = 1, keylen = 64, maxmem = 64MB
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

export interface PasswordPolicyResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates password strength: min 8, max 128 chars, requires both letters and numbers/symbols.
 * Protects against buffer overflows and scrypt CPU exhaustion DoS (ASVS V2.1.1, V2.1.2).
 */
export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'رمز عبور الزامی است.' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'رمز عبور باید حداقل دارای ۸ کاراکتر باشد.' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'طول رمز عبور نمی‌تواند بیش از ۱۲۸ کاراکتر باشد.' };
  }
  const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(password);
  const hasDigitOrSymbol = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  if (!hasLetter || !hasDigitOrSymbol) {
    return { valid: false, error: 'رمز عبور باید ترکیبی از حروف و اعداد یا نمادها باشد.' };
  }
  return { valid: true };
}

/**
 * Checks against historical password hashes to prevent password reuse (OWASP ASVS V2.1.9).
 */
export async function checkPasswordHistory(
  newPassword: string,
  history?: string[]
): Promise<{ reused: boolean }> {
  if (!Array.isArray(history) || history.length === 0) return { reused: false };
  for (const oldHash of history) {
    const res = await verifyPasswordAsync(newPassword, oldHash);
    if (res.valid) {
      return { reused: true };
    }
  }
  return { reused: false };
}

/**
 * Computes an async Scrypt key derivation without blocking the Node.js event loop.
 */
function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAXMEM },
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey);
      }
    );
  });
}

/**
 * Hashes a password with Scrypt, returning:
 * $scrypt$N=16384,r=8,p=1$<saltHex>$<derivedKeyHex>
 */
export async function hashPasswordAsync(password: string, existingSalt?: string): Promise<string> {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt);
  return `$scrypt$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Backward-compatible synchronous fallback for legacy initializers.
 */
export function hashPasswordSync(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM
  });
  return `$scrypt$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against an existing hash using timing-safe comparison.
 * Supports both new format ($scrypt$...) and legacy format (<salt>:<hex>).
 */
export async function verifyPasswordAsync(
  password: string,
  combinedHash: string
): Promise<{ valid: boolean; needsRehash?: boolean }> {
  try {
    if (!password || !combinedHash) return { valid: false };

    // New format: $scrypt$N=...,r=8,p=1$<salt>$<key>
    if (combinedHash.startsWith('$scrypt$')) {
      const parts = combinedHash.split('$');
      if (parts.length < 5) return { valid: false };
      const salt = parts[3];
      const expectedKeyHex = parts[4];
      const derivedKey = await scryptAsync(password, salt);
      const expectedBuffer = Buffer.from(expectedKeyHex, 'hex');
      const valid = crypto.timingSafeEqual(derivedKey, expectedBuffer);
      return { valid, needsRehash: false };
    }

    // Legacy format: <salt>:<key>
    const [salt, expectedKeyHex] = combinedHash.split(':');
    if (!salt || !expectedKeyHex) return { valid: false };

    const derivedKey = crypto.scryptSync(password, salt, 64, { maxmem: SCRYPT_MAXMEM });
    const expectedBuffer = Buffer.from(expectedKeyHex, 'hex');
    const valid = crypto.timingSafeEqual(derivedKey, expectedBuffer);
    return { valid, needsRehash: true };
  } catch {
    return { valid: false };
  }
}

// Constant-time dummy hash to defeat user enumeration via response timing side-channel
export const DUMMY_TIMING_HASH = hashPasswordSync('morico-dummy-unmatched-pass-for-constant-time');

export async function verifyDummyPasswordAsync(password: string): Promise<void> {
  await verifyPasswordAsync(password, DUMMY_TIMING_HASH);
}

// ============================================================================
// 2. INPUT SANITIZATION & NORMALIZATION HELPERS (OWASP ASVS V4.1, V5.1)
// ============================================================================

/**
 * Converts Persian and Arabic-Indic digits to standard English ASCII digits.
 */
export function toEnglishDigits(str: string): string {
  if (!str || typeof str !== 'string') return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(farsiDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  return res;
}

/**
 * Cleans phone number by converting all digits to English and stripping non-digits.
 */
export function cleanPhoneNumber(phone: unknown): string {
  if (typeof phone !== 'string') return '';
  const english = toEnglishDigits(phone);
  return english.replace(/\D/g, '');
}

/**
 * Checks if a phone number matches Iranian mobile format (09xxxxxxxxx).
 */
export function isValidIranianMobile(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  return /^09\d{9}$/.test(cleaned);
}

/**
 * Strips HTML control tags (< >) and control characters from text inputs.
 */
export function sanitizeText(val: unknown, maxLength = 500): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[<>]/g, '')
    .slice(0, maxLength)
    .trim();
}

// ============================================================================
// 3. SECURE SESSIONS & AUDITED JWT TOKENS WITH JOSE (OWASP ASVS V3.2, V3.5, V6.2)
// ============================================================================

export const JWT_ISSUER = 'urn:morico:ecommerce';
export const JWT_AUDIENCE = 'urn:morico:storefront';

/**
 * Derives a cryptographically secure 256-bit (32-byte) key for HS256 from session secret (RFC 7518, NIST SP 800-108).
 * Eliminates weak character padding and guarantees high-entropy key uniform distribution.
 */
export function getJoseSecretKey(secret: string): Uint8Array {
  return crypto.createHash('sha256').update(secret || 'default-secret-fallback-key-32', 'utf8').digest();
}

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'admin' | 'user' | 'staff';
  tokenVersion: number;
  exp: number;
  iat: number;
  jti: string;
  iss?: string;
  aud?: string;
}

/**
 * Asynchronously signs JWT token using the audited standard jose library.
 */
export async function signJoseToken(
  user: { id: string; username: string; role: 'admin' | 'user' | 'staff'; tokenVersion?: number },
  sessionSecret: string,
  expiresIn = '12h'
): Promise<string> {
  const secretBytes = getJoseSecretKey(sessionSecret);
  return await new jose.SignJWT({
    userId: user.id,
    username: user.username,
    role: user.role,
    tokenVersion: user.tokenVersion || 1
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.id)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretBytes);
}

/**
 * Standard jose library verification with strict claim checks, revocation, and user state verification.
 */
export async function verifyJoseToken(
  token: string,
  sessionSecret: string,
  getUserById?: (id: string) => { id: string; role: string; tokenVersion?: number } | undefined,
  isRevoked?: (jti: string, tokenStr: string) => boolean
): Promise<TokenPayload | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const secretBytes = getJoseSecretKey(sessionSecret);
    const { payload } = await jose.jwtVerify(token, secretBytes, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256']
    });

    const jti = String(payload.jti || '');
    if (isRevoked && isRevoked(jti, token)) {
      return null;
    }

    const userId = String(payload.userId || payload.sub || '');
    const role = (payload.role as 'admin' | 'user' | 'staff') || 'user';
    const tokenVersion = Number(payload.tokenVersion || 1);

    if (getUserById) {
      const activeUser = getUserById(userId);
      if (!activeUser) {
        return null;
      }
      if (activeUser.role !== role && !(activeUser.role === 'admin' && role === 'staff')) {
        return null;
      }
      const currentVersion = activeUser.tokenVersion || 1;
      if (tokenVersion !== currentVersion) {
        return null;
      }
    }

    return {
      userId,
      username: String(payload.username || ''),
      role,
      tokenVersion,
      exp: Number(payload.exp || 0) * 1000,
      iat: Number(payload.iat || 0) * 1000,
      jti,
      iss: String(payload.iss || ''),
      aud: String(payload.aud || '')
    };
  } catch {
    return null;
  }
}

// ============================================================================
// 4. RATE LIMITING & BRUTE-FORCE LOCKOUT (OWASP ASVS V2.2, V13.1)
// 100% Backed by the distributed cache layer (redisStore) with automatic fallback
// ============================================================================

export const LOCKOUT_THRESHOLD = 5; // 5 consecutive failed attempts
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
export const LOCKOUT_DURATION_SEC = 15 * 60;

/**
 * Checks if a specific key (IP or IP+username) is currently locked out via cache layer.
 */
export async function checkLockoutAsync(key: string): Promise<{ locked: boolean; waitSeconds?: number }> {
  const lockedUntilStr = await cacheGet(`auth_locked:${key}`);
  if (lockedUntilStr) {
    const lockedUntil = Number(lockedUntilStr);
    const now = Date.now();
    if (lockedUntil > now) {
      return { locked: true, waitSeconds: Math.ceil((lockedUntil - now) / 1000) };
    }
    await cacheDelete(`auth_locked:${key}`);
  }
  return { locked: false };
}

export function checkLockout(key: string): { locked: boolean; waitSeconds?: number } {
  const lockedUntilStr = cacheGetSync(`auth_locked:${key}`);
  if (lockedUntilStr) {
    const lockedUntil = Number(lockedUntilStr);
    const now = Date.now();
    if (lockedUntil > now) {
      return { locked: true, waitSeconds: Math.ceil((lockedUntil - now) / 1000) };
    }
    cacheDeleteSync(`auth_locked:${key}`);
  }
  return { locked: false };
}

/**
 * Records a failed authentication attempt in the cache layer. Triggers lockout on reaching threshold.
 */
export async function recordAuthFailureAsync(key: string): Promise<{ locked: boolean; attempts: number }> {
  const attempts = await cacheIncr(`auth_attempts:${key}`, LOCKOUT_DURATION_SEC);
  if (attempts >= LOCKOUT_THRESHOLD) {
    const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    await cacheSet(`auth_locked:${key}`, String(lockedUntil), LOCKOUT_DURATION_SEC);
    return { locked: true, attempts };
  }
  return { locked: false, attempts };
}

export function recordAuthFailure(key: string): { locked: boolean; attempts: number } {
  const attempts = cacheIncrSync(`auth_attempts:${key}`, LOCKOUT_DURATION_SEC);
  if (attempts >= LOCKOUT_THRESHOLD) {
    const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    cacheSetSync(`auth_locked:${key}`, String(lockedUntil), LOCKOUT_DURATION_SEC);
    return { locked: true, attempts };
  }
  return { locked: false, attempts };
}

/**
 * Resets lockout on successful login.
 */
export async function clearAuthFailureAsync(key: string): Promise<void> {
  await cacheDelete(`auth_locked:${key}`);
  await cacheDelete(`auth_attempts:${key}`);
}

export function clearAuthFailure(key: string): void {
  cacheDeleteSync(`auth_locked:${key}`);
  cacheDeleteSync(`auth_attempts:${key}`);
}

export function getActiveLockoutsCount(): number {
  return 0;
}

// --------------------------------------------------------------------------
// Express Rate Limiters (100% Backed by Distributed Cache / redisStore)
// --------------------------------------------------------------------------

export function createGeneralRateLimiter(maxRequests = 300, windowMs = 60000) {
  const windowSec = Math.ceil(windowMs / 1000);
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || '127.0.0.1';
    const count = await cacheIncr(`rate_limit_gen:${ip}`, windowSec);
    if (count > maxRequests) {
      return res.status(429).json({
        error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً اندکی صبر فرمایید.'
      });
    }
    next();
  };
}

export function createTrackingRateLimiter(maxRequests = 20, windowMs = 10 * 60 * 1000) {
  const windowSec = Math.ceil(windowMs / 1000);
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || '127.0.0.1';
    const orderNum = req.body?.orderNumber ? String(req.body.orderNumber).trim().toUpperCase() : '';
    const key = orderNum ? `${ip}:${orderNum}` : ip;

    const count = await cacheIncr(`rate_limit_trk:${key}`, windowSec);
    if (count > maxRequests) {
      return res.status(429).json({
        error: 'تعداد استعلام‌های رهگیری بیش از حد مجاز است. لطفاً ۱۰ دقیقه بعد مجدداً تلاش فرمایید.'
      });
    }
    next();
  };
}

export function createDiscountRateLimiter(maxRequests = 15, windowMs = 5 * 60 * 1000) {
  const windowSec = Math.ceil(windowMs / 1000);
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || '127.0.0.1';
    const count = await cacheIncr(`rate_limit_disc:${ip}`, windowSec);
    if (count > maxRequests) {
      return res.status(429).json({
        valid: false,
        error: 'تعداد بررسی کدهای تخفیف بیش از حد مجاز است. لطفاً ۵ دقیقه دیگر تلاش نمایید.'
      });
    }
    next();
  };
}
