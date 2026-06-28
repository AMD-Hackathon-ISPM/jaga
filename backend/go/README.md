# Go Service Scaffold

This module is a thin orchestration layer around the Prisma worker in `../python/PrismaServer`.

## Run

```bash
go run ./cmd/server
```

## Environment

- `JAGA_BACKEND_ADDR`
- `JAGA_PYTHON_PROJECT_ROOT`
- `COGNEE_ENABLED`
- `COGNEE_COLLECTION`
- `COGNEE_TIMEOUT`

The default Cognee path is local-internal (`http://cognee:8000`) and does not require a Cognee API key for the normal Swarm deployment. In the current stack, Cognee stays local while Featherless handles generation.
