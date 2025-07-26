import { WebhookValidation } from "./validation";
import { WebhookError, WebhookValidationError } from "./errors";
import type { WebhookPayload } from "./types";

export class WebhookUtils {
  /**
   * Verify webhook payload signature
   */
  static async verifyWebhookSignature(
    payload: WebhookPayload,
    options: { secret_token: string }
  ): Promise<boolean> {
    const { secret_token } = options;

    return secret_token === payload.secret_token;
  }

  /**
   * Parse webhook payload safely
   */
  static parseWebhookPayload(rawPayload: string | Buffer): WebhookPayload {
    try {
      const payloadString =
        rawPayload instanceof Buffer
          ? rawPayload.toString("utf8")
          : (rawPayload as string);

      const parsed = JSON.parse(payloadString);

      // Basic validation
      if (!parsed.id || !parsed.type || !parsed.data)
        throw new WebhookValidationError({
          message: "Invalid webhook payload structure",
          unexpected_payload: parsed,
        });

      return parsed as WebhookPayload;
    } catch (error) {
      if (error instanceof WebhookError) {
        throw error;
      }
      throw new WebhookValidationError({
        message: `Failed to parse webhook payload: ${error}`,
        unexpected_payload: {},
      });
    }
  }

  /**
   * Validate webhook payload
   */
  static validateWebhookPayload(payload: WebhookPayload): string[] {
    const errors: string[] = [];

    // Check required fields
    errors.push(
      ...WebhookValidation.validateRequired(payload, [
        "id",
        "type",
        "created_at",
        "account_name",
        "data",
      ])
    );

    // Validate event type
    if (payload.type && !WebhookValidation.isValidWebhookEvent(payload.type)) {
      errors.push(`Invalid webhook event type: ${payload.type}`);
    }

    // Validate live mode
    if (typeof payload.live !== "boolean") {
      errors.push("live field must be a boolean");
    }

    return errors;
  }

  /**
   * Extract signature from headers (common patterns)
   */
  static extractSignatureFromHeaders(
    headers: Record<string, string | string[]>
  ): string | null {
    // Common signature header patterns
    const signatureHeaders = [
      "x-moyasar-signature",
      "x-signature",
      "signature",
      "authorization",
    ];

    for (const header of signatureHeaders) {
      const value = headers[header] || headers[header.toLowerCase()];
      if (value) {
        const signature = Array.isArray(value) ? value[0]! : value;
        // Remove common prefixes
        return signature.replace(/^(sha256=|hmac-sha256=|Bearer\s+)/i, "");
      }
    }

    return null;
  }

  /**
   * Create a consistent payload string for signature verification
   */
  static createSignaturePayload(
    payload: WebhookPayload,
    timestamp?: number
  ): string {
    const basePayload = JSON.stringify(payload);
    return timestamp ? `${timestamp}.${basePayload}` : basePayload;
  }

  /**
   * Get webhook event categories
   */
  static getEventCategory(event: string): "payment" | "unknown" {
    if (event.startsWith("payment_")) {
      return "payment";
    }
    return "unknown";
  }

  /**
   * Check if webhook should be retried based on response
   */
  static shouldRetryWebhook(
    statusCode: number,
    retryCount: number,
    maxRetries: number = 5
  ): boolean {
    if (retryCount >= maxRetries) {
      return false;
    }

    // Don't retry client errors (4xx) except specific ones
    if (statusCode >= 400 && statusCode < 500) {
      return [408, 429].includes(statusCode); // Timeout, Rate Limited
    }

    // Retry server errors (5xx) and network errors
    return statusCode >= 500 || statusCode === 0;
  }
}
