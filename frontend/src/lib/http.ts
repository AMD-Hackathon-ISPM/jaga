import axios from "axios";
import { config } from "./config";

export const http = axios.create({
  baseURL: config.apiBaseUrl || undefined,
  timeout: 30_000,
  headers: { Accept: "application/json" },
});
