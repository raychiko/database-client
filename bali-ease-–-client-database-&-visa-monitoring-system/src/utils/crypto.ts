/**
 * Cryptographic utility for secure password hashing and verification
 * Uses standard Web Crypto API (SHA-256 with salt) - no plain text passwords!
 */

const DEFAULT_SALT = 'baliease_secure_pepper_2026';

export async function hashPassword(password: string, userSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = userSalt || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:${DEFAULT_SALT}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return { hash, salt };
}

export async function verifyPassword(password: string, storedHash: string, userSalt: string): Promise<boolean> {
  const enc = new TextEncoder();
  const data = enc.encode(`${userSalt}:${password}:${DEFAULT_SALT}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const calculated = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return calculated === storedHash;
}
