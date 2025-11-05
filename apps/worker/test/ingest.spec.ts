import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server';

describe('ingestion', () => {
  const app = createServer();

  it('health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /api/v1/events without auth is 401', async () => {
    const res = await request(app).post('/api/v1/events').send({ type: 't', payload: {} });
    expect(res.status).toBe(401);
  });
});


