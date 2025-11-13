# Cerberix

Managed webhook delivery platform (HookShot-style) — monorepo with Next.js app and Worker.

## Stack

- Web: Next.js 14 (App Router), Tailwind
- Worker: Express 4, BullMQ (Redis)
- DB: PostgreSQL via Drizzle ORM
- Queue: Redis (non-default port)

## Prereqs

- Node 20+
- pnpm 9+
- Docker

## Dev setup

1. Start infra:

```bash
docker compose up -d
```

2. Env:

- Copy `.env.example` to `.env` and set values (DATABASE_URL, REDIS_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL, SESSION_COOKIE_NAME)

3. Generate/migrate DB (Drizzle):

```bash
pnpm drizzle:generate && pnpm migrate
```

4. Run apps:

```bash
pnpm dev
```

- Web: <http://localhost:3000>
- Worker: <http://localhost:4001/health>

## Scripts

- dev: run web and worker
- drizzle:generate: generate SQL from schema
- migrate: apply migrations

## Event ingestion

POST /api/v1/events

- Headers: X-Project-Key, Authorization: Bearer <secret>
- Body: { type, payload, idempotencyKey?, metadata? }
- Returns: { eventId, queuedDeliveriesCount }

## Webhook delivery

- Signed with HMAC SHA256 (hex) using subscription secret
- Headers: X-Webhook-Signature, X-Webhook-Id, X-Webhook-Event-Id, X-Webhook-Event-Type, X-Webhook-Retry-Count, X-Webhook-Source

## Ports

- Postgres: host 55432
- Redis: host 36379

Cerberix is an API gateway controller and proxy re-router
