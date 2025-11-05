import { createHmac, timingSafeEqual } from 'node:crypto';

export function signHmacSHA256(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function verifySignature(secret: string, rawBody: string, signature: string): boolean {
  const expected = Buffer.from(signHmacSHA256(secret, rawBody));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}


