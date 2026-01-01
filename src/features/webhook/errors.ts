import { MoyasarError } from "@errors";
import type { WebhookPayload } from "./types";

export class WebhookError extends MoyasarError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "WEBHOOK_ERROR", 500, details ?? {});
    this.name = "WebhookError";
  }
}

export class WebhookVerificationError extends WebhookError {
  constructor(message: string = "Webhook signature verification failed") {
    super(message, {});
    this.name = "WebhookVerificationError";
  }
}

export class WebhookValidationError extends WebhookError {
  public readonly unexpected_payload: unknown;
  constructor({
    message = "Webhook payload validation failed",
    unexpected_payload,
  }: {
    message?: string;
    unexpected_payload: unknown;
  }) {
    super(message, { unexpected_payload });
    this.unexpected_payload = unexpected_payload;
    this.name = "WebhookValidationError";
  }
}
