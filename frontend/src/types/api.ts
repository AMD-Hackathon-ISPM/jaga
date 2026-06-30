/**
 * Generic API envelope + error helpers. No endpoint URLs live here.
 * Health/status shapes mirror the live Go handlers (internal/http/handlers.go).
 */

export interface HealthResponse {
  status: "ok";
  timestamp: string;
}

export interface ServiceStatusResponse {
  service: string;
  python_project_root: string;
  ready: boolean;
}

/** Normalized client-side error. Services throw until the API is connected. */
export class ApiNotConnectedError extends Error {
  constructor(operation: string) {
    super(`API not connected yet: ${operation}`);
    this.name = "ApiNotConnectedError";
  }
}
