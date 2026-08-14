const TOKEN_VERSION = 'v1';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    return null;
  }

  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  try {
    const binary = atob(
      value.replaceAll('-', '+').replaceAll('_', '/') + padding,
    );
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createCsrfToken(secret: string): Promise<string> {
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const encodedNonce = toBase64Url(nonce);
  const payload = `${TOKEN_VERSION}.${encodedNonce}`;
  const signature = await crypto.subtle.sign(
    'HMAC',
    await importSigningKey(secret),
    new TextEncoder().encode(payload),
  );

  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyCsrfToken(
  token: string,
  secret: string,
): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) {
    return false;
  }

  const nonce = fromBase64Url(parts[1]);
  const signature = fromBase64Url(parts[2]);
  if (!nonce || nonce.byteLength !== 32 || !signature) {
    return false;
  }

  const signatureBuffer = new ArrayBuffer(signature.byteLength);
  new Uint8Array(signatureBuffer).set(signature);

  return await crypto.subtle.verify(
    'HMAC',
    await importSigningKey(secret),
    signatureBuffer,
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const maximumLength = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < maximumLength; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

export async function reuseOrCreateCsrfToken(
  candidate: string | undefined,
  secret: string,
): Promise<{ token: string; created: boolean }> {
  if (candidate && await verifyCsrfToken(candidate, secret)) {
    return { token: candidate, created: false };
  }

  return { token: await createCsrfToken(secret), created: true };
}
