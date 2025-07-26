import type { BaseListOptions, ListResponse, Metadata } from "@types";
import { WebhookEvent, WebhookHttpMethod } from "./enums";

export interface WebhookPayload<T extends object = Metadata> {
  id: string;
  type: WebhookEvent;
  created_at: string;
  secret_token: string;
  account_name: string;
  live: boolean;
  /**
   * The Payment payload associated with the event.
   * @see https://docs.moyasar.com/api/other/webhooks/webhook-reference#the-webhook-object
   */
  data: T;
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

export type WebhookEventMap<T extends object = Metadata> = {
  // Payment events
  [K in WebhookEvent]: (payload: WebhookPayload<T>) => void | Promise<void>;
};
