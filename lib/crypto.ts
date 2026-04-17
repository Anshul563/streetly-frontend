/**
 * End-to-End Encryption utilities using the native Web Crypto API.
 * Uses ECDH for key exchange and AES-GCM for symmetric encryption.
 * Keys are stored in localStorage. The private key is never sent to the server.
 */

// ─── Conversation ID Obfuscation ───────────────────────────────────────────────

const CONV_SALT = "strtly";

/**
 * Encodes a raw integer conversation ID into a URL-safe opaque token.
 * e.g. encodeConvId(1) → "Y2lkOjE6c3RydGx5"
 */
export function encodeConvId(id: number): string {
  if (typeof window === "undefined") return String(id);
  return btoa(`cid:${id}:${CONV_SALT}`).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Decodes a URL-safe opaque token back to a raw integer conversation ID.
 * Returns null if the token is invalid.
 */
export function decodeConvId(token: string): number | null {
  try {
    const padded = token.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(padded);
    const match = decoded.match(/^cid:(\d+):/);
    if (!match) return null;
    return parseInt(match[1], 10);
  } catch {
    return null;
  }
}

const LOCAL_PRIVATE_KEY = "streetly_e2ee_private";
const LOCAL_PUBLIC_KEY  = "streetly_e2ee_public";
const KEY_PREFIX = "E2EE:";

// ─── Key Generation ────────────────────────────────────────────────────────────

/** Generate a new ECDH key pair and persist it to localStorage. */
export async function generateAndStoreKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  // Export and persist both keys
  const [exportedPrivate, exportedPublic] = await Promise.all([
    crypto.subtle.exportKey("jwk", keyPair.privateKey),
    crypto.subtle.exportKey("jwk", keyPair.publicKey),
  ]);

  localStorage.setItem(LOCAL_PRIVATE_KEY, JSON.stringify(exportedPrivate));
  localStorage.setItem(LOCAL_PUBLIC_KEY, JSON.stringify(exportedPublic));

  return keyPair;
}

/** Load the persisted public key in JWK format (as a JSON string to send to server). */
export function getStoredPublicKeyJwk(): string | null {
  return localStorage.getItem(LOCAL_PUBLIC_KEY);
}

/** Check if a key pair exists locally. */
export function hasLocalKeyPair(): boolean {
  return (
    !!localStorage.getItem(LOCAL_PRIVATE_KEY) &&
    !!localStorage.getItem(LOCAL_PUBLIC_KEY)
  );
}

/** Import the stored private key from localStorage as a CryptoKey. */
async function loadPrivateKey(): Promise<CryptoKey | null> {
  const raw = localStorage.getItem(LOCAL_PRIVATE_KEY);
  if (!raw) return null;
  try {
    const jwk = JSON.parse(raw);
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveKey"]
    );
  } catch {
    return null;
  }
}

/** Import a raw JWK string (from server) as a public ECDH CryptoKey. */
async function importPublicKey(jwkString: string): Promise<CryptoKey | null> {
  try {
    const jwk = JSON.parse(jwkString);
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );
  } catch {
    return null;
  }
}

// ─── Shared Secret Derivation ──────────────────────────────────────────────────

/** Derive a shared AES-GCM key from our private key and the recipient's public key. */
async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── Encrypt / Decrypt ─────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext message for a recipient.
 * @param plaintext The message string to encrypt.
 * @param recipientPublicKeyJwk The recipient's public key in JWK JSON string format.
 * @returns A base64-encoded string prefixed with "E2EE:" (IV + ciphertext).
 *          Returns `null` if encryption fails or keys are unavailable.
 */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKeyJwk: string
): Promise<string | null> {
  try {
    const [myPrivateKey, theirPublicKey] = await Promise.all([
      loadPrivateKey(),
      importPublicKey(recipientPublicKeyJwk),
    ]);

    if (!myPrivateKey || !theirPublicKey) return null;

    const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      encoded
    );

    // Concatenate iv (12 bytes) + ciphertext and encode as base64
    const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.byteLength);

    return KEY_PREFIX + btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.error("[E2EE] Encryption failed:", err);
    return null;
  }
}

/**
 * Decrypt a received encrypted message.
 * @param encryptedPayload The "E2EE:" prefixed base64 string.
 * @param senderPublicKeyJwk The sender's public key in JWK JSON string format.
 * @returns The decrypted plaintext, or "[Encrypted Message]" if decryption fails.
 */
export async function decryptMessage(
  encryptedPayload: string,
  senderPublicKeyJwk: string
): Promise<string> {
  try {
    if (!encryptedPayload.startsWith(KEY_PREFIX)) return encryptedPayload;

    const base64 = encryptedPayload.slice(KEY_PREFIX.length);
    const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const [myPrivateKey, theirPublicKey] = await Promise.all([
      loadPrivateKey(),
      importPublicKey(senderPublicKeyJwk),
    ]);

    if (!myPrivateKey || !theirPublicKey) return "[Encrypted Message]";

    const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKey);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return "[Encrypted Message]";
  }
}

/** Check if a message payload is encrypted. */
export function isEncrypted(content: string): boolean {
  return content.startsWith(KEY_PREFIX);
}
