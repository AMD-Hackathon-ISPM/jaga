import type { AxiosRequestConfig } from "axios";

export type ApiMode = "fixture" | "live";

export interface ApiClient {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<{ data: T }>;
}

export interface ServiceFactoryOptions {
  mode: ApiMode;
  client: ApiClient;
}
