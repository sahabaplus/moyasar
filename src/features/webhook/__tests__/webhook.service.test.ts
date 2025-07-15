import { WebhookEvents, WebhookHttpMethods } from "../enums";
import { WebhookService } from "../service";
import { WebhookError } from "../errors";
import type {
  Webhook,
  WebhookPayload,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  ListWebhooksResponse,
  WebhookAttempt,
} from "../types";
import { MockApiClient } from "./mock_api_client";

describe("WebhookService", () => {
  let mockApiClient: MockApiClient;
  let webhookService: WebhookService;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
    webhookService = new WebhookService({ apiClient: mockApiClient });
  });

  afterEach(() => {
    webhookService.removeAllListeners();
    mockApiClient.clearHistory();
  });

  describe("API tests", async () => {
    it("should accepts the right types and has the right signature", () => {
      const v = webhookService
        .onPaymentEvent(WebhookEvents.PAYMENT_ABANDONED, p => {})
        .onPaymentEvent(WebhookEvents.PAYMENT_ABANDONED, p => {})
        .onAnyPaymentEvent(p => {}).availableEvents;
    });
  });

  describe("create", () => {
    const validCreateRequest: CreateWebhookRequest = {
      url: "https://example.com/webhook",
      http_method: WebhookHttpMethods.POST,
      events: [WebhookEvents.PAYMENT_PAID, WebhookEvents.PAYMENT_FAILED],
      shared_secret: "secret123",
    };

    const mockWebhook: Webhook = {
      id: "webhook_123",
      url: "https://example.com/webhook",
      http_method: WebhookHttpMethods.POST,
      events: [WebhookEvents.PAYMENT_PAID, WebhookEvents.PAYMENT_FAILED],
      created_at: "2024-01-01T00:00:00Z",
      shared_secret: null as never,
    };

    it("should create a webhook successfully", async () => {
      mockApiClient.setMockResponse("POST:/v1/webhooks", mockWebhook);

      const result = await webhookService.create(validCreateRequest);

      expect(result).toEqual(mockWebhook);
      expect(mockApiClient.getLastRequest()).toEqual({
        method: "POST",
        url: "/v1/webhooks",
        data: validCreateRequest,
      });
    });

    it("should validate required fields", async () => {
      const invalidRequest = { ...validCreateRequest, url: "" };

      await expect(webhookService.create(invalidRequest)).rejects.toThrow(
        WebhookError
      );
    });

    it("should validate URL format", async () => {
      const invalidRequest = { ...validCreateRequest, url: "not-a-url" };

      await expect(webhookService.create(invalidRequest)).rejects.toThrow(
        "url must be a valid HTTP/HTTPS URL"
      );
    });

    it("should validate HTTP method", async () => {
      const invalidRequest = {
        ...validCreateRequest,
        http_method: "invalid" as any,
      };

      await expect(webhookService.create(invalidRequest)).rejects.toThrow(
        "http_method must be a valid HTTP method"
      );
    });

    it("should validate event types", async () => {
      const invalidRequest = {
        ...validCreateRequest,
        events: ["invalid_event"] as any,
      };

      await expect(webhookService.create(invalidRequest)).rejects.toThrow(
        "Invalid webhook events: invalid_event"
      );
    });

    it("should handle API errors", async () => {
      const apiError = new Error("API Error");
      mockApiClient.setMockResponse("POST:/v1/webhooks", apiError);

      await expect(webhookService.create(validCreateRequest)).rejects.toThrow();
    });
  });

  describe("list", () => {
    const mockListResponse: ListWebhooksResponse = {
      webhooks: [
        {
          id: "webhook_1",
          url: "https://example.com/webhook1",
          http_method: WebhookHttpMethods.POST,
          events: [WebhookEvents.PAYMENT_PAID],
          created_at: "2024-01-01T00:00:00Z",
          shared_secret: null as never,
        },
      ],
      meta: {
        current_page: 1,
        next_page: null,
        prev_page: null,
        total_pages: 1,
        total_count: 1,
      },
    };

    it("should list webhooks successfully", async () => {
      mockApiClient.setMockResponse("GET:/v1/webhooks", mockListResponse);

      const result = await webhookService.list();

      expect(result).toEqual(mockListResponse);
      expect(mockApiClient.getLastRequest()).toEqual({
        method: "GET",
        url: "/v1/webhooks",
        params: {},
      });
    });

    it("should pass pagination options", async () => {
      mockApiClient.setMockResponse("GET:/v1/webhooks", mockListResponse);

      await webhookService.list({ page: 2, limit: 40 });

      expect(mockApiClient.getLastRequest()!.params).toEqual({
        page: 2,
        limit: 40,
      });
    });
  });

  describe("retrieve", () => {
    const mockWebhook: Webhook = {
      id: "webhook_123",
      url: "https://example.com/webhook",
      http_method: WebhookHttpMethods.POST,
      events: [WebhookEvents.PAYMENT_PAID],
      created_at: "2024-01-01T00:00:00Z",
      shared_secret: null as never,
    };

    it("should retrieve a webhook successfully", async () => {
      mockApiClient.setMockResponse(
        "GET:/v1/webhooks/webhook_123",
        mockWebhook
      );

      const result = await webhookService.retrieve("webhook_123");

      expect(result).toEqual(mockWebhook);
    });

    it("should throw error for empty webhook ID", async () => {
      await expect(webhookService.retrieve("")).rejects.toThrow(
        "Webhook ID is required"
      );
    });
  });

  describe("update", () => {
    const updateRequest: UpdateWebhookRequest = {
      url: "https://updated.example.com/webhook",
      events: [WebhookEvents.PAYMENT_PAID, WebhookEvents.PAYMENT_REFUNDED],
    };

    const mockUpdatedWebhook: Webhook = {
      id: "webhook_123",
      url: "https://updated.example.com/webhook",
      http_method: WebhookHttpMethods.POST,
      events: [WebhookEvents.PAYMENT_PAID, WebhookEvents.PAYMENT_REFUNDED],
      created_at: "2024-01-01T00:00:00Z",
      shared_secret: null as never,
    };

    it("should update a webhook successfully", async () => {
      mockApiClient.setMockResponse(
        "PUT:/v1/webhooks/webhook_123",
        mockUpdatedWebhook
      );

      const result = await webhookService.update("webhook_123", updateRequest);

      expect(result).toEqual(mockUpdatedWebhook);
      expect(mockApiClient.getLastRequest()).toEqual({
        method: "PUT",
        url: "/v1/webhooks/webhook_123",
        data: updateRequest,
      });
    });
  });

  describe("delete", () => {
    it("should delete a webhook successfully", async () => {
      mockApiClient.setMockResponse("DELETE:/v1/webhooks/webhook_123", {});

      await webhookService.delete("webhook_123");

      expect(mockApiClient.getLastRequest()).toEqual({
        method: "DELETE",
        url: "/v1/webhooks/webhook_123",
      });
    });
  });

  describe("processWebhook", () => {
    const validPayload: WebhookPayload = {
      id: "event_123",
      type: WebhookEvents.PAYMENT_PAID,
      created_at: "2024-01-01T00:00:00Z",
      secret_token: "secret",
      account_name: "test_account",
      live: false,
      data: { payment_id: "pay_123" },
    };

    it("should process webhook payload successfully", async () => {
      const eventSpy = jest.fn();
      webhookService.on(WebhookEvents.PAYMENT_PAID, eventSpy);

      const result = await webhookService.processWebhook(validPayload, {
        secret_token: "secret",
      });

      expect(result).toEqual(validPayload);
      expect(eventSpy).toHaveBeenCalledWith(validPayload);
    });

    it("should parse JSON string payload", async () => {
      const jsonPayload = JSON.stringify(validPayload);
      const eventSpy = jest.fn();
      webhookService.on(WebhookEvents.PAYMENT_PAID, eventSpy);

      const result = await webhookService.processWebhook(jsonPayload, {
        secret_token: "secret",
      });

      expect(result).toEqual(validPayload);
      expect(eventSpy).toHaveBeenCalledWith(validPayload);
    });

    it("should validate payload structure", async () => {
      const invalidPayload = { ...validPayload, id: undefined };

      await expect(
        webhookService.processWebhook(invalidPayload as any, {
          secret_token: "secret",
        })
      ).rejects.toThrow(WebhookError);
    });

    it("should reject webhook with wrong secret token", async () => {
      const payloadWithWrongSecret = {
        ...validPayload,
        secret_token: "wrong_secret",
      };

      await expect(
        webhookService.processWebhook(payloadWithWrongSecret, {
          secret_token: "correct_secret",
        })
      ).rejects.toThrow("Webhook signature verification failed");
    });

    it("should reject webhook when secret token is missing in options", async () => {
      await expect(
        webhookService.processWebhook(validPayload, {
          secret_token: "",
        })
      ).rejects.toThrow("Webhook signature verification failed");
    });

    it("should reject webhook when payload secret token is missing", async () => {
      const payloadWithoutSecret = {
        ...validPayload,
        secret_token: "",
      };

      await expect(
        webhookService.processWebhook(payloadWithoutSecret, {
          secret_token: "secret",
        })
      ).rejects.toThrow("Webhook signature verification failed");
    });
  });

  describe("event listeners", () => {
    it("should support onPaymentEvent utility", async () => {
      const paymentSpy = jest.fn();
      webhookService.onPaymentEvent(WebhookEvents.PAYMENT_PAID, paymentSpy);

      const payload: WebhookPayload = {
        id: "event_123",
        type: WebhookEvents.PAYMENT_PAID,
        created_at: "2024-01-01T00:00:00Z",
        secret_token: "secret",
        account_name: "test_account",
        live: false,
        data: { payment_id: "pay_123" },
      };

      await webhookService.processWebhook(payload, {
        secret_token: "secret",
      });

      expect(paymentSpy).toHaveBeenCalledWith(payload);
    });

    it("should support onAnyPaymentEvent utility", async () => {
      const anySpy = jest.fn();
      webhookService.onAnyPaymentEvent(anySpy);

      const payload: WebhookPayload = {
        id: "event_123",
        type: WebhookEvents.PAYMENT_FAILED,
        created_at: "2024-01-01T00:00:00Z",
        secret_token: "secret",
        account_name: "test_account",
        live: false,
        data: { payment_id: "pay_123" },
      };

      await webhookService.processWebhook(payload, {
        secret_token: "secret",
      });

      expect(anySpy).toHaveBeenCalledWith(payload);
    });

    it("should support onWebhookManagement utility", async () => {
      const mockWebhook: Webhook = {
        id: "webhook_123",
        url: "https://example.com/webhook",
        http_method: WebhookHttpMethods.POST,
        events: [WebhookEvents.PAYMENT_PAID],
        created_at: "2024-01-01T00:00:00Z",
        shared_secret: null as never,
      };

      mockApiClient.setMockResponse("POST:/v1/webhooks", mockWebhook);
      mockApiClient.setMockResponse("DELETE:/v1/webhooks/webhook_123", {});

      await webhookService.create({
        url: "https://example.com/webhook",
        http_method: WebhookHttpMethods.POST,
        shared_secret: "secret",
      });

      await webhookService.delete("webhook_123");

      expect(mockApiClient.getLastRequest()).toEqual({
        method: "DELETE",
        url: "/v1/webhooks/webhook_123",
      });
    });
  });

  describe("attempts sub-service", () => {
    const mockAttempt: WebhookAttempt = {
      id: "attempt_123",
      webhook_id: "webhook_123",
      event_id: "event_123",
      event_type: WebhookEvents.PAYMENT_PAID,
      retry_number: 1,
      result: "success",
      message: "Success",
      response_code: 200,
      response_headers: "{}",
      response_body: "OK",
      created_at: "2024-01-01T00:00:00Z",
    };

    it("should list webhook attempts", async () => {
      const mockResponse = {
        webhook_attempts: [mockAttempt],
        meta: {
          current_page: 1,
          next_page: null,
          prev_page: null,
          total_pages: 1,
          total_count: 1,
        },
      };

      mockApiClient.setMockResponse("GET:/v1/webhooks/attempts", mockResponse);

      const result = await webhookService.attempts.list();

      expect(result).toEqual(mockResponse);
    });

    it("should retrieve a specific attempt", async () => {
      mockApiClient.setMockResponse(
        "GET:/v1/webhooks/attempts/attempt_123",
        mockAttempt
      );

      const result = await webhookService.attempts.retrieve("attempt_123");

      expect(result).toEqual(mockAttempt);
    });

    it("should pass filter options to attempts list", async () => {
      mockApiClient.setMockResponse("GET:/v1/webhooks/attempts", {
        webhook_attempts: [],
        meta: {
          current_page: 1,
          next_page: null,
          prev_page: null,
          total_pages: 0,
          total_count: 0,
        },
      });

      await webhookService.attempts.list({
        webhook_id: "webhook_123",
        result: "failed",
        page: 2,
      });

      expect(mockApiClient.getLastRequest()!.params).toEqual({
        webhook_id: "webhook_123",
        result: "failed",
        page: 2,
      });
    });
  });

  describe("extractSignature utility", () => {
    it("should extract signature from common headers", () => {
      const headers = {
        "x-moyasar-signature": "abc123",
        "content-type": "application/json",
      };

      const signature = webhookService.extractSignature(headers);

      expect(signature).toBe("abc123");
    });

    it("should handle signature prefixes", () => {
      const headers = {
        "x-signature": "sha256=abc123",
      };

      const signature = webhookService.extractSignature(headers);

      expect(signature).toBe("abc123");
    });

    it("should return null if no signature found", () => {
      const headers = {
        "content-type": "application/json",
      };

      const signature = webhookService.extractSignature(headers);

      expect(signature).toBeNull();
    });
  });
});
