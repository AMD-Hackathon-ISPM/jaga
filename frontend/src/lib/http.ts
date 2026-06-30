import axios from "axios";
import { config } from "./config";

/**
 * Axios instance — CONFIGURED BUT UNUSED.
 *
 * No baseURL is set to a real host and no interceptors call any endpoint. This
 * exists so that, once Daffa signs ARCH-1, services can switch from throwing to
 * real calls in one place. Do NOT add endpoint paths here until then.
 */
export const http = axios.create({
  baseURL: config.apiBaseUrl || undefined,
  timeout: 30_000,
  headers: { Accept: "application/json" },
});

// Placeholder for a future schema/version header + error normalization.
// http.interceptors.request.use(...)
// http.interceptors.response.use(...)
