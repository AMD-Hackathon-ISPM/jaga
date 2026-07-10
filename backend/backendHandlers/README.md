# Demographics API

This small Go service validates the demographics step only. It does not persist,
log, or forward submitted values.

## Run

```bash
go run ./cmd/server
```

## Endpoint

`POST /api/v1/demographics`

```json
{
  "ageYears": 35,
  "sexAtBirth": "female",
  "heightCm": 165.5,
  "weightKg": 60
}
```

Responses use the same camelCase field names. The service accepts adults aged
18 to 120, height 40 to 260 cm, and weight 1 to 350 kg.

## Environment

- `JAGA_BACKEND_ADDR`
