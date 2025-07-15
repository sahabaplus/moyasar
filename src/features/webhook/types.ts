import type { BaseListOptions, ListResponse } from "@types";
import { WebhookEvents, WebhookHttpMethods } from "./enums";

export type WebhookEvent = (typeof WebhookEvents)[keyof typeof WebhookEvents];
export type WebhookHttpMethod =
  (typeof WebhookHttpMethods)[keyof typeof WebhookHttpMethods];

export interface WebhookPayload {
  id: string;
  type: WebhookEvent;
  created_at: string;
  secret_token: string;
  account_name: string;
  live: boolean;
  data: any; // Payment object - this would be more specific in a full implementation
}

export interface Webhook {
  id: string;
  http_method: WebhookHttpMethod;
  url: string;
  created_at: string;
  events: WebhookEvent[];
  shared_secret: never;
}

export interface CreateWebhookRequest {
  http_method: WebhookHttpMethod;
  url: string;
  shared_secret: string;
  events?: WebhookEvent[];
}

export interface UpdateWebhookRequest {
  http_method?: WebhookHttpMethod;
  url?: string;
  shared_secret?: string;
  events?: WebhookEvent[];
}

export interface WebhookAttempt {
  id: string;
  webhook_id: string;
  event_id: string;
  event_type: WebhookEvent;
  retry_number: number;
  result: "success" | "failed";
  message: string;
  response_code: number;
  response_headers: string;
  response_body: string;
  created_at: string;
}

export interface ListWebhooksResponse extends ListResponse<Webhook> {
  webhooks: Webhook[];
}

export interface ListWebhookAttemptsResponse
  extends ListResponse<WebhookAttempt> {
  webhook_attempts: WebhookAttempt[];
}

export interface AvailableEventsResponse {
  events: WebhookEvent[];
}

export interface WebhookListOptions extends BaseListOptions {}

export interface WebhookAttemptListOptions extends BaseListOptions {
  webhook_id?: string;
  event_type?: WebhookEvent;
  result?: "success" | "failed";
}

export interface WebhookVerificationOptions {
  secret_token: string;
}

export type WebhookEventMap = {
  // Payment events
  [K in WebhookEvent]: (payload: WebhookPayload) => void | Promise<void>;
};
