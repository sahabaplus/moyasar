import { MoyasarError } from "@errors";

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
