# Cerberix Worker

Express service for event ingestion and delivery processing.

## Dev
```bash
pnpm --filter @cerberix/worker dev
```

## Endpoints
- GET /health
- POST /api/v1/events
- POST /api/v1/deliveries/{id}/replay

OpenAPI: see `/openapi/worker.yaml` in docs app or `openapi/worker.yaml` at repo root.


