import type { AxiosRequestConfig } from "axios";

export interface RequestConfig extends AxiosRequestConfig {
  //
}

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ApiClient {
  request<T = any>(config: RequestConfig): Promise<T>;
}
