import {
  constantTimeEqual,
  createCsrfToken,
  reuseOrCreateCsrfToken,
  verifyCsrfToken,
} from './csrf.ts';

const SECRET = '0123456789abcdef0123456789abcdef';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test('CSRF tokens are signed and tampering is rejected', async () => {
  const token = await createCsrfToken(SECRET);
  assert(await verifyCsrfToken(token, SECRET), 'new token should verify');
  assert(
    !await verifyCsrfToken(`${token.slice(0, -1)}x`, SECRET),
    'tampered token should fail',
  );
  assert(
    !await verifyCsrfToken(token, `${SECRET}different`),
    'wrong secret should fail',
  );
});

Deno.test('valid CSRF tokens retain identity across session reads', async () => {
  const token = await createCsrfToken(SECRET);
  const result = await reuseOrCreateCsrfToken(token, SECRET);
  assert(!result.created, 'valid token should be reused');
  assert(result.token === token, 'reused token should preserve identity');
});

Deno.test('constant-time comparison handles equal and unequal lengths', () => {
  assert(constantTimeEqual('same', 'same'), 'equal strings should match');
  assert(!constantTimeEqual('same', 'different'), 'different strings should fail');
});
