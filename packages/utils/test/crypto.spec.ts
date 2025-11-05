import { describe, it, expect } from 'vitest';
import { signHmacSHA256, verifySignature } from '../src/crypto';

describe('crypto', () => {
  it('signs and verifies', () => {
    const secret = 'test_secret';
    const body = JSON.stringify({ a: 1 });
    const sig = signHmacSHA256(secret, body);
    expect(verifySignature(secret, body, sig)).toBe(true);
    expect(verifySignature(secret, body, 'bad')).toBe(false);
  });
});


