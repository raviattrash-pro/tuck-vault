// ============================================================================
// Tuck App — Client-side Encryption Utilities
// Uses AES-256 via Web Crypto API for sensitive vault data
// ============================================================================

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Derive an AES-256 key from a passphrase (user's Google ID + salt)
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string value. Returns a base64 string containing IV + ciphertext.
 */
export async function encrypt(plaintext: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );

  // Pack: salt (16) + iv (12) + ciphertext
  const packed = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...packed));
}

/**
 * Decrypt a base64-encoded encrypted string.
 */
export async function decrypt(encrypted: string, passphrase: string): Promise<string> {
  const packed = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 16 + IV_LENGTH);
  const ciphertext = packed.slice(16 + IV_LENGTH);

  const key = await deriveKey(passphrase, salt);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plainBuffer);
}

/**
 * Mask a document number for display: show last 4 chars only
 * e.g. "ABCDE1234F" → "••••••234F"
 */
export function maskDocumentNumber(num: string): string {
  if (!num || num.length <= 4) return num;
  const visible = num.slice(-4);
  const masked = '•'.repeat(num.length - 4);
  return masked + visible;
}

/**
 * Generate a random encryption salt
 */
export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes));
}
