import { describe, it, expect } from 'vitest';
import { computeBackoff } from '../src/backoff';

describe('backoff', () => {
  it('grows exponentially with jitter', () => {
    const b1 = computeBackoff(2, 1, 0);
    const b2 = computeBackoff(2, 2, 0);
    const b3 = computeBackoff(2, 3, 0);
    expect(b1).toBe(2000);
    expect(b2).toBe(4000);
    expect(b3).toBe(8000);
  });
});


