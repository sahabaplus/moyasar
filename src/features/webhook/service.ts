import type { ApiClient, Metadata, MoyasarClientTypes } from "@types";
import { API_ENDPOINTS } from "@constants";
import { WebhookUtils } from "./utils";
import { WebhookError, WebhookValidationError } from "./errors";
import { WebhookValidation } from "./validation";
import { WebhookEvent } from "./enums";
import type {
  Webhook,
  WebhookPayload,
  WebhookAttempt,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  ListWebhooksResponse,
  ListWebhookAttemptsResponse,
  AvailableEventsResponse,
  WebhookListOptions,
  WebhookAttemptListOptions,
  WebhookVerificationOptions,
  WebhookEventMap,
} from "./types";
import { TypedEmitter } from "tiny-typed-emitter";

type WebhookServiceParams<T extends MoyasarClientTypes> = {
  apiClient: ApiClient<T>;
};

export class WebhookService<T extends MoyasarClientTypes> extends TypedEmitter<
  WebhookEventMap<T["metadata"]>
> {
  private readonly apiClient: ApiClient<T>;
  private readonly events = Object.values(WebhookEvent) as WebhookEvent[];
  constructor(params: WebhookServiceParams<T>) {
    super();
    this.apiClient = params.apiClient;
  }

  /**
   * Create a new webhook
   */
  async create(params: CreateWebhookRequest): Promise<Webhook> {
    // Validate input
    this.validateCreateRequest(params);

    try {
      const webhook = await this.apiClient.request<Webhook>({
        method: "POST",
        url: API_ENDPOINTS.webhooks,
        data: params,
      });

      return webhook;
    } catch (error) {
      const webhookError = this.handleError(error, "Failed to create webhook");
      throw webhookError;
    }
  }

  /**
   * List all webhooks
   */
  async list(options: WebhookListOptions = {}): Promise<ListWebhooksResponse> {
    try {
      return await this.apiClient.request<ListWebhooksResponse>({
        method: "GET",
        url: API_ENDPOINTS.webhooks,
        params: options,
      });
    } catch (error) {
      const webhookError = this.handleError(error, "Failed to list webhooks");
      throw webhookError;
    }
  }

  /**
   * Retrieve a specific webhook
   */
  async retrieve(webhookId: string): Promise<Webhook> {
    if (!webhookId) {
      throw new WebhookError("Webhook ID is required");
    }

    try {
      return await this.apiClient.request<Webhook>({
        method: "GET",
        url: `${API_ENDPOINTS.webhooks}/${webhookId}`,
      });
    } catch (error) {
      const webhookError = this.handleError(
        error,
        `Failed to retrieve webhook ${webhookId}`
      );
      throw webhookError;
    }
  }

  /**
   * Update a webhook
   */
  async update(
    webhookId: string,
    params: UpdateWebhookRequest
  ): Promise<Webhook> {
    if (!webhookId) {
      throw new WebhookError("Webhook ID is required");
    }

    // Validate input
    this.validateUpdateRequest(params);

    try {
      const webhook = await this.apiClient.request<Webhook>({
        method: "PUT",
        url: `${API_ENDPOINTS.webhooks}/${webhookId}`,
        data: params,
      });

      return webhook;
    } catch (error) {
      const webhookError = this.handleError(
        error,
        `Failed to update webhook ${webhookId}`
      );
      throw webhookError;
    }
  }

  /**
   * Delete a webhook
   */
  async delete(webhookId: string): Promise<void> {
    if (!webhookId) {
      throw new WebhookError("Webhook ID is required");
    }

    try {
      await this.apiClient.request({
        method: "DELETE",
        url: `${API_ENDPOINTS.webhooks}/${webhookId}`,
      });
    } catch (error) {
      const webhookError = this.handleError(
        error,
        `Failed to delete webhook ${webhookId}`
      );
      throw webhookError;
    }
  }

  /**
   * Get available webhook events
   */
  async availableEvents(): Promise<AvailableEventsResponse> {
    try {
      return await this.apiClient.request<AvailableEventsResponse>({
        method: "GET",
        url: API_ENDPOINTS.availableEvents,
      });
    } catch (error) {
      const webhookError = this.handleError(
        error,
        "Failed to fetch available events"
      );
      throw webhookError;
    }
  }

  /**
   * Webhook Attempts Sub-service
   */
  get attempts() {
    return {
      /**
       * List all webhook attempts
       */
      list: async (
        options: WebhookAttemptListOptions = {}
      ): Promise<ListWebhookAttemptsResponse> => {
        try {
          return await this.apiClient.request<ListWebhookAttemptsResponse>({
            method: "GET",
            url: API_ENDPOINTS.webhookAttempts,
            params: options,
          });
        } catch (error) {
          const webhookError = this.handleError(
            error,
            "Failed to list webhook attempts"
          );
          throw webhookError;
        }
      },

      /**
       * Retrieve a specific webhook attempt
       */
      retrieve: async (attemptId: string): Promise<WebhookAttempt> => {
        if (!attemptId) {
          throw new WebhookError("Attempt ID is required");
        }

        try {
          return await this.apiClient.request<WebhookAttempt>({
            method: "GET",
            url: `${API_ENDPOINTS.webhookAttempts}/${attemptId}`,
          });
        } catch (error) {
          const webhookError = this.handleError(
            error,
            `Failed to retrieve webhook attempt ${attemptId}`
          );
          throw webhookError;
        }
      },
    };
  }

  /**
   * Process incoming webhook payload
   * This method should be called from your webhook endpoint
   */
  async processWebhook(
    rawPayload: string | Buffer | WebhookPayload<Metadata>,
    options: WebhookVerificationOptions
  ): Promise<WebhookPayload<T["metadata"]>> {
    try {
      // Parse payload if it's raw
      const payload =
        typeof rawPayload === "object" && "id" in rawPayload
          ? rawPayload
          : WebhookUtils.parseWebhookPayload(rawPayload as string | Buffer);

      // Validate payload structure
      const validationErrors = WebhookUtils.validateWebhookPayload(payload);
      if (validationErrors.length > 0) {
        throw new WebhookValidationError({
          message: `Invalid webhook payload: ${validationErrors.join(", ")}`,
          unexpected_payload: payload,
        });
      }

      // Verify signature if provided

      const isValidSignature = await WebhookUtils.verifyWebhookSignature(
        payload,
        options
      );
      if (!isValidSignature)
        throw new WebhookError("Webhook signature verification failed");

      try {
        const parsedPayloadData = this.apiClient.metadataValidator.parse(
          payload.data
        );
        const parsedPayload = {
          ...payload,
          data: parsedPayloadData,
        };

        this.emit(payload.type, parsedPayload);
        return parsedPayload;
      } catch (error) {
        throw new WebhookValidationError({
          message:
            error instanceof Error && "message" in error
              ? error.message
              : "Unknown error",
          unexpected_payload: payload,
        });
      }
    } catch (error) {
      const webhookError =
        error instanceof WebhookError
          ? error
          : this.handleError(error, "Failed to process webhook");

      throw webhookError;
    }
  }

  /**
   * Utility method to create type-safe event listeners for payment events
   */
  onPaymentEvent(
    event: WebhookEvent,
    listener: (payload: WebhookPayload<T["metadata"]>) => void | Promise<void>
  ): this {
    return this.on(event, listener);
  }

  /**
   * Utility method to listen to all payment events
   */
  onAnyPaymentEvent(
    listener: (payload: WebhookPayload<T["metadata"]>) => void | Promise<void>
  ): this {
    this.events.forEach(event => {
      this.on(event, listener);
    });

    return this;
  }

  /**
   * Helper method to extract webhook signature from common header patterns
   */
  extractSignature(headers: Record<string, string | string[]>): string | null {
    return WebhookUtils.extractSignatureFromHeaders(headers);
  }

  // Private helper methods

  private validateCreateRequest(params: CreateWebhookRequest): void {
    const errors: string[] = [];

    // Required fields
    if (!params.url) {
      errors.push("url is required");
    } else if (!WebhookValidation.isValidUrl(params.url)) {
      errors.push("url must be a valid HTTP/HTTPS URL");
    }

    if (!params.http_method) {
      errors.push("http_method is required");
    } else if (!WebhookValidation.isValidHttpMethod(params.http_method)) {
      errors.push("http_method must be a valid HTTP method");
    }

    // Validate events if provided
    if (params.events) {
      const invalidEvents = params.events.filter(
        event => !WebhookValidation.isValidWebhookEvent(event)
      );
      if (invalidEvents.length > 0) {
        errors.push(`Invalid webhook events: ${invalidEvents.join(", ")}`);
      }
    }

    if (errors.length > 0) {
      throw new WebhookError(`Validation failed: ${errors.join(", ")}`);
    }
  }

  private validateUpdateRequest(params: UpdateWebhookRequest): void {
    const errors: string[] = [];

    // Validate URL if provided
    if (params.url && !WebhookValidation.isValidUrl(params.url)) {
      errors.push("url must be a valid HTTP/HTTPS URL");
    }

    // Validate HTTP method if provided
    if (
      params.http_method &&
      !WebhookValidation.isValidHttpMethod(params.http_method)
    ) {
      errors.push("http_method must be a valid HTTP method");
    }

    // Validate events if provided
    if (params.events) {
      const invalidEvents = params.events.filter(
        event => !WebhookValidation.isValidWebhookEvent(event)
      );
      if (invalidEvents.length > 0) {
        errors.push(`Invalid webhook events: ${invalidEvents.join(", ")}`);
      }
    }

    if (errors.length > 0) {
      throw new WebhookError(`Validation failed: ${errors.join(", ")}`);
    }
  }

  private handleError(error: any, message: string): WebhookError {
    if (error instanceof WebhookError) {
      return error;
    }

    const errorMessage = error?.message || error?.toString() || "Unknown error";
    return new WebhookError(`${message}: ${errorMessage}`, {
      statusCode: error?.statusCode || error?.status,
      message: errorMessage,
    });
  }
}
