/**
 * Multi-Factor Authentication Engine (RFC 6238 TOTP & RFC 4226 HOTP)
 * Complies with OWASP ASVS V2.8.1, V2.8.4, V2.8.7 (Multi-Factor Authentication for Admin & Privileged Operations).
 * Built with zero external dependencies using Node.js crypto primitives.
 */

import crypto from 'crypto';

/**
 * Decodes a Base32 string to Buffer.
 */
export function base32ToBuffer(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

/**
 * Encodes a Buffer into Base32 string.
 */
export function bufferToBase32(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Generates high-entropy Base32 secret for TOTP (160-bit key recommended by RFC 4226).
 */
export function generateTotpSecret(): string {
  return bufferToBase32(crypto.randomBytes(20));
}

/**
 * Computes 6-digit TOTP code for a given timestamp step.
 */
export function computeTotpCode(secretBase32: string, timeStep: number): string {
  const key = base32ToBuffer(secretBase32);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(timeStep), 0);

  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binary % 1000000).toString().padStart(6, '0');
}

/**
 * Verifies 6-digit TOTP code with time-step tolerance (±1 step = ±30 seconds clock drift).
 * Uses constant-time comparison to prevent timing side-channel attacks (ASVS V2.8.4).
 */
export function verifyTotpCode(secretBase32: string, token: string, window = 1): boolean {
  if (!secretBase32 || !token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return false;
  }

  const epoch = Math.floor(Date.now() / 1000);
  const currentStep = Math.floor(epoch / 30);

  for (let delta = -window; delta <= window; delta++) {
    const step = currentStep + delta;
    const expectedOtp = computeTotpCode(secretBase32, step);

    if (crypto.timingSafeEqual(Buffer.from(expectedOtp), Buffer.from(token))) {
      return true;
    }
  }
  return false;
}

/**
 * Generates an otpauth:// URL for QR code generation in authenticator apps.
 */
export function generateOtpAuthUrl(accountName: string, secretBase32: string, issuer = 'MORICO STYLE'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates 8 single-use cryptographically random backup recovery codes.
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(3).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}
