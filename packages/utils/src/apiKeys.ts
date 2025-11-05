import { randomBytes, createHash } from 'node:crypto';

export function generateApiKeyPair() {
  const pub = `cerb_pk_${randomBytes(16).toString('hex')}`;
  const secret = `cerb_sk_${randomBytes(24).toString('hex')}`;
  const hash = createHash('sha256').update(secret).digest('hex');
  return { publicKey: pub, secret, secretHash: hash };
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}


