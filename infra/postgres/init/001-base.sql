-- Jaga PostgreSQL bootstrap.
--
-- PRD-08 / architecture §7 INVARIANT — READ BEFORE ADDING ANY TABLE:
--   Patient inputs are transient and MUST NEVER be persisted. It is forbidden
--   to store, in this database, any of the following:
--     - clinical intake field values (age, sex, symptoms, vitals, etc.)
--     - request/response bodies or payloads of any endpoint
--     - cough audio, CXR images, embeddings, or their derivatives
--     - triage/CXR probabilities, bands, or any derived estimate/analytics
--   Only NON-PATIENT operational telemetry is allowed here.
--   (product-requirements.md PRD-08 lines 27/185/192/254; project-architecture.md §7)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Operational request metrics — NON-PATIENT telemetry only.
-- One row per HTTP request recording *how the service behaved*, never *what the
-- patient submitted*. There is deliberately no column that can hold a payload,
-- a clinical value, or a derived estimate. request_id is a server-generated
-- random correlation id (see internal/idgen); it is not derived from any
-- patient input.
CREATE TABLE IF NOT EXISTS request_metrics (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id  TEXT,
    endpoint    TEXT        NOT NULL,
    method      TEXT        NOT NULL,
    status_code INTEGER     NOT NULL,
    latency_ms  INTEGER     NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_metrics_occurred_at ON request_metrics (occurred_at);
CREATE INDEX IF NOT EXISTS idx_request_metrics_endpoint ON request_metrics (endpoint);
