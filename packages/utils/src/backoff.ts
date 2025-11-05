export function computeBackoff(baseSeconds: number, attempt: number, jitterMs: number): number {
  const exp = Math.pow(2, Math.max(0, attempt - 1));
  const baseMs = baseSeconds * 1000 * exp;
  const jitter = Math.floor(Math.random() * jitterMs) - Math.floor(jitterMs / 2);
  return Math.max(0, baseMs + jitter);
}


