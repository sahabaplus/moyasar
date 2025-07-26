import type { AxiosRequestConfig } from "axios";
import type { MetadataValidator } from "./metadata_parser";
import type { Metadata } from "./metadata";

export interface RequestConfig extends AxiosRequestConfig {
  //
}

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export type MoyasarClientTypes<T extends object = object> = {
  metadata: T;
};

export type DefaultMoyasarClientTypes = {
  metadata: Metadata;
};

export interface ApiClient<
  T extends MoyasarClientTypes = DefaultMoyasarClientTypes,
> {
  request<T = any>(config: RequestConfig): Promise<T>;
  metadataValidator: MetadataValidator<T["metadata"]>;
}
