import {
  InvoiceError,
  InvoiceService,
  InvoiceStatus,
  type CreateInvoiceRequest,
  type BulkCreateInvoiceRequest,
  type UpdateInvoiceRequest,
  type InvoiceListOptions,
  type Invoice,
  type BulkCreateInvoicesResponse,
  type DetailedInvoice,
  type ListInvoicesResponse,
} from "@invoice";
import type { ApiClient, RequestConfig } from "@types";
import { describe, expect, beforeEach, mock, it, jest } from "bun:test";
import { API_ENDPOINTS } from "@constants";

const mockValidation = {
  success: true,
  data: {},
  errors: [] as string[],
};

const validateCreateInvoiceRequest = mock().mockReturnValue(mockValidation);
const validateBulkCreateRequest = mock().mockReturnValue(mockValidation);
const buildMetadataQuery = mock().mockReturnValue({});

mock.module("@invoice", () => ({
  InvoiceUtils: {
    validateCreateInvoiceRequest,
    validateBulkCreateRequest,
    buildMetadataQuery,
  },
}));

const mockApiClient: ApiClient = {
  request: mock().mockResolvedValue({}),
};

const createMockInvoice = (
  overrides: Partial<DetailedInvoice> = {}
): DetailedInvoice => ({
  id: `inv_${Date.now()}`,
  amount: 1000,
  currency: "USD",
  description: "Test invoice",
  status: InvoiceStatus.INITIATED,
  amount_format: "1000 USD",
  url: `https://${Date.now()}`,
  metadata: {},
  created_at: new Date(),
  updated_at: new Date(),
  payments: [],
  ...overrides,
});

const createMockInvoiceListResponse = (
  invoices: Invoice[] = [],
  total = invoices.length
): ListInvoicesResponse => ({
  invoices,
  meta: {
    total_count: total,
    current_page: 1,
    next_page: 2,
    prev_page: 0,
    total_pages: Math.ceil(total / 20),
  },
});

describe("InvoiceService", () => {
  let invoiceService: InvoiceService;

  beforeEach(() => {
    jest.clearAllMocks();

    invoiceService = new InvoiceService({
      apiClient: mockApiClient,
    });

    mockValidation.success = true;
    mockValidation.errors = [];
  });

  describe("create", () => {
    const validCreateRequest: CreateInvoiceRequest = {
      amount: 1000,
      currency: "USD",
      description: "Test invoice",
      callback_url: "https://example.com/callback",
      metadata: { orderId: "12345" },
    };

    beforeEach(() => {
      const mockInvoice = createMockInvoice({
        amount: validCreateRequest.amount,
        currency: validCreateRequest.currency,
        description: validCreateRequest.description,
      });
      (mockApiClient.request as any).mockResolvedValue(mockInvoice);
    });

    it("should create an invoice successfully", async () => {
      const createdInvoice = await invoiceService.create(validCreateRequest);

      expect(createdInvoice).toBeDefined();
      expect(createdInvoice.id).toMatch(/^inv_\d+$/);
      expect(createdInvoice.amount).toBe(1000);
      expect(createdInvoice.currency).toBe("USD");
      expect(createdInvoice.description).toBe("Test invoice");
      expect(createdInvoice.status).toBe(InvoiceStatus.INITIATED);
      expect(createdInvoice.payments).toEqual([]);

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "POST",
        url: `${API_ENDPOINTS.invoices}`,
        data: validCreateRequest,
      });
    });

    it("should throw validation error for invalid request", async () => {
      mockValidation.success = false;
      mockValidation.errors = [
        "amount: amount is required",
        "currency: invalid currency",
      ];

      expect(invoiceService.create(validCreateRequest)).rejects.toThrow(
        InvoiceError
      );
      expect(invoiceService.create(validCreateRequest)).rejects.toThrow(
        "Validation failed: amount: amount is required, currency: invalid currency"
      );
    });

    it("should handle API errors", async () => {
      (mockApiClient.request as any).mockRejectedValue(
        new Error("API connection failed")
      );

      expect(invoiceService.create(validCreateRequest)).rejects.toThrow(
        InvoiceError
      );
      expect(invoiceService.create(validCreateRequest)).rejects.toThrow(
        "Failed to create invoice"
      );
    });

    it("should handle API errors that are already InvoiceError instances", async () => {
      const originalError = new InvoiceError("Original invoice error");
      (mockApiClient.request as any).mockRejectedValue(originalError);

      expect(invoiceService.create(validCreateRequest)).rejects.toBe(
        originalError
      );
    });
  });

  describe("createBulk", () => {
    const validBulkRequest: BulkCreateInvoiceRequest = {
      invoices: [
        {
          amount: 1000,
          currency: "USD",
          description: "Bulk invoice 1",
        },
        {
          amount: 2000,
          currency: "EUR",
          description: "Bulk invoice 2",
        },
      ],
    };

    beforeEach(() => {
      const mockResponse: BulkCreateInvoicesResponse = {
        invoices: [
          createMockInvoice({
            amount: 1000,
            currency: "USD",
            description: "Bulk invoice 1",
          }),
          createMockInvoice({
            amount: 2000,
            currency: "EUR",
            description: "Bulk invoice 2",
          }),
        ],
      };
      (mockApiClient.request as any).mockResolvedValue(mockResponse);
    });

    it("should create multiple invoices in bulk", async () => {
      const response = await invoiceService.createBulk(validBulkRequest);

      expect(response.invoices).toHaveLength(2);
      expect(response.invoices[0]!.amount).toBe(1000);
      expect(response.invoices[1]!.amount).toBe(2000);

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "POST",
        url: "/v1/invoices/bulk",
        data: validBulkRequest,
      });
    });

    it("should throw validation error for invalid bulk request", async () => {
      mockValidation.success = false;
      mockValidation.errors = ["invoices: at least one invoice is required"];

      expect(invoiceService.createBulk(validBulkRequest)).rejects.toThrow(
        InvoiceError
      );
      expect(invoiceService.createBulk(validBulkRequest)).rejects.toThrow(
        "Validation failed"
      );
    });

    it("should handle bulk creation API errors", async () => {
      (mockApiClient.request as any).mockRejectedValue(
        new Error("Bulk creation failed")
      );

      expect(invoiceService.createBulk(validBulkRequest)).rejects.toThrow(
        "Failed to create bulk invoices"
      );
    });
  });

  describe("list", () => {
    beforeEach(() => {
      const mockResponse = createMockInvoiceListResponse([
        createMockInvoice({ id: "inv_1" }),
        createMockInvoice({ id: "inv_2" }),
      ]);
      (mockApiClient.request as any).mockResolvedValue(mockResponse);
    });

    it("should list invoices without filters", async () => {
      const response = await invoiceService.list();

      expect(response.invoices).toBeDefined();
      expect(Array.isArray(response.invoices)).toBe(true);
      expect(response.meta).toBeDefined();

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}`,
        params: {},
      });
    });

    it("should list invoices with status filter", async () => {
      const options: InvoiceListOptions = { status: InvoiceStatus.PAID };
      await invoiceService.list(options);

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}`,
        params: expect.objectContaining({ status: "paid" }),
      });
    });

    it("should list invoices with date filters", async () => {
      const createdAfter = new Date("2023-01-01");
      const createdBefore = new Date("2023-12-31");

      const options: InvoiceListOptions = {
        "created[gt]": createdAfter,
        "created[lt]": createdBefore,
      };

      await invoiceService.list(options);

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}`,
        params: expect.objectContaining({
          "created[gt]": createdAfter.toISOString(),
          "created[lt]": createdBefore.toISOString(),
        }),
      });
    });

    it("should handle list API errors", async () => {
      (mockApiClient.request as any).mockRejectedValue(
        new Error("List failed")
      );

      expect(invoiceService.list()).rejects.toThrow("Failed to list invoices");
    });
  });

  describe("retrieve", () => {
    const invoiceId = "inv_existing_1";

    beforeEach(() => {
      const mockInvoice = createMockInvoice({ id: invoiceId });
      (mockApiClient.request as any).mockResolvedValue(mockInvoice);
    });

    it("should retrieve an existing invoice", async () => {
      const invoice = await invoiceService.retrieve(invoiceId);

      expect(invoice).toBeDefined();
      expect(invoice.id).toBe(invoiceId);
      expect(invoice.payments).toBeDefined();

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}/${invoiceId}`,
      });
    });

    it("should throw error for empty invoice ID", async () => {
      expect(invoiceService.retrieve("")).rejects.toThrow(
        "Invoice ID is required"
      );
    });

    it("should handle invoice not found", async () => {
      (mockApiClient.request as any).mockRejectedValue(
        new Error("Invoice not found")
      );

      expect(invoiceService.retrieve(invoiceId)).rejects.toThrow(
        `Failed to retrieve invoice ${invoiceId}`
      );
    });
  });

  describe("update", () => {
    const invoiceId = "inv_existing_1";
    const updateRequest: UpdateInvoiceRequest = {
      metadata: { updatedField: "newValue" },
    };

    beforeEach(() => {
      const mockInvoice = createMockInvoice({
        id: invoiceId,
        metadata: { updatedField: "newValue" },
      });
      (mockApiClient.request as any).mockResolvedValue(mockInvoice);
    });

    it("should update an existing invoice", async () => {
      const updatedInvoice = await invoiceService.update(
        invoiceId,
        updateRequest
      );

      expect(updatedInvoice.metadata).toEqual(
        expect.objectContaining({ updatedField: "newValue" })
      );

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "PUT",
        url: `${API_ENDPOINTS.invoices}/${invoiceId}`,
        data: updateRequest,
      });
    });

    it("should throw error for empty invoice ID", async () => {
      expect(invoiceService.update("", updateRequest)).rejects.toThrow(
        "Invoice ID is required"
      );
    });

    it("should handle update API errors", async () => {
      (mockApiClient.request as any).mockRejectedValue(
        new Error("Update failed")
      );

      expect(invoiceService.update(invoiceId, updateRequest)).rejects.toThrow(
        `Failed to update invoice ${invoiceId}`
      );
    });
  });

  describe("cancel", () => {
    const invoiceId = "inv_existing_1";

    beforeEach(() => {
      const mockInvoice = createMockInvoice({
        id: invoiceId,
        status: InvoiceStatus.CANCELED,
      });
      (mockApiClient.request as any).mockResolvedValue(mockInvoice);
    });

    it("should cancel an existing invoice", async () => {
      const canceledInvoice = await invoiceService.cancel(invoiceId);

      expect(canceledInvoice.status).toBe(InvoiceStatus.CANCELED);

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "PUT",
        url: `${API_ENDPOINTS.invoices}/${invoiceId}/cancel`,
      });
    });

    it("should throw error for empty invoice ID", async () => {
      expect(invoiceService.cancel("")).rejects.toThrow(
        "Invoice ID is required"
      );
    });

    it("should handle cancel API errors", async () => {
      (mockApiClient.request as any).mockRejectedValue(
        new Error("Cancel failed")
      );

      expect(invoiceService.cancel(invoiceId)).rejects.toThrow(
        `Failed to cancel invoice ${invoiceId}`
      );
    });
  });

  describe("searchByMetadata", () => {
    beforeEach(() => {
      const mockResponse = createMockInvoiceListResponse([
        createMockInvoice({ metadata: { orderId: "ORDER_001" } }),
      ]);
      (mockApiClient.request as any).mockResolvedValue(mockResponse);
    });

    it("should search invoices by metadata", async () => {
      const metadata = { orderId: "ORDER_001", customerType: "premium" };
      buildMetadataQuery.mockReturnValue({
        "metadata[orderId]": "ORDER_001",
        "metadata[customerType]": "premium",
      });

      const response = await invoiceService.searchByMetadata(metadata);

      expect(response.invoices).toBeDefined();

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}`,
        params: expect.objectContaining({
          "metadata[orderId]": "ORDER_001",
          "metadata[customerType]": "premium",
        }),
      });
    });

    it("should combine metadata search with other options", async () => {
      const metadata = { orderId: "ORDER_001" };
      const options = { status: InvoiceStatus.PAID, limit: 40 } as const;
      buildMetadataQuery.mockReturnValue({
        "metadata[orderId]": "ORDER_001",
        status: "paid",
        limit: 40,
      });

      await invoiceService.searchByMetadata(metadata, options);

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}`,
        params: expect.objectContaining({
          "metadata[orderId]": "ORDER_001",
          status: "paid",
          limit: 40,
        }),
      });
    });
  });

  describe("getByStatus", () => {
    beforeEach(() => {
      const mockResponse = createMockInvoiceListResponse([
        createMockInvoice({ status: InvoiceStatus.PAID }),
      ]);
      (mockApiClient.request as any).mockResolvedValue(mockResponse);
    });

    it("should get invoices by status", async () => {
      const response = await invoiceService.getByStatus(InvoiceStatus.PAID);

      expect(response.invoices).toBeDefined();

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}`,
        params: expect.objectContaining({ status: "paid" }),
      });
    });

    it("should combine status filter with other options", async () => {
      await invoiceService.getByStatus(InvoiceStatus.EXPIRED, {
        limit: 40,
        page: 10,
      });

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}`,
        params: expect.objectContaining({
          status: "expired",
          limit: 40,
          page: 10,
        }),
      });
    });
  });

  describe("getExpired", () => {
    beforeEach(() => {
      const mockResponse = createMockInvoiceListResponse([
        createMockInvoice({ status: InvoiceStatus.EXPIRED }),
      ]);
      (mockApiClient.request as any).mockResolvedValue(mockResponse);
    });

    it("should get expired invoices", async () => {
      const response = await invoiceService.getExpired();

      expect(response.invoices).toBeDefined();

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}`,
        params: expect.objectContaining({ status: "expired" }),
      });
    });
  });

  describe("getPaid", () => {
    beforeEach(() => {
      const mockResponse = createMockInvoiceListResponse([
        createMockInvoice({ status: InvoiceStatus.PAID }),
      ]);
      (mockApiClient.request as any).mockResolvedValue(mockResponse);
    });

    it("should get paid invoices", async () => {
      const response = await invoiceService.getPaid();

      expect(response.invoices).toBeDefined();

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}`,
        params: expect.objectContaining({ status: "paid" }),
      });
    });

    it("should get paid invoices with additional options", async () => {
      await invoiceService.getPaid({ limit: 40 });

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}`,
        params: expect.objectContaining({
          status: "paid",
          limit: 40,
        }),
      });
    });
  });

  describe("Private Methods", () => {
    it("parseBody should convert Date objects to ISO strings", () => {
      const testDate = new Date("2023-01-01T00:00:00.000Z");
      const input = {
        status: InvoiceStatus.PAID,
        "created[gt]": testDate,
        amount: 1000,
        metadata: { test: "value" },
      };

      const result = (invoiceService as any).parseBody(input);

      expect(result).toEqual({
        status: "paid",
        "created[gt]": "2023-01-01T00:00:00.000Z",
        amount: 1000,
        metadata: { test: "value" },
      });
    });

    it("parseBody should handle objects without dates", () => {
      const input = {
        status: InvoiceStatus.PAID,
        amount: 1000,
        limit: 20,
      };

      const result = (invoiceService as any).parseBody(input);

      expect(result).toEqual(input);
    });

    it("parseBody should not modify the original object", () => {
      const testDate = new Date("2023-01-01T00:00:00.000Z");
      const input = {
        "created[gt]": testDate,
        amount: 1000,
      };

      const result = (invoiceService as any).parseBody(input);

      expect(result).not.toBe(input);
      expect(input["created[gt]"]).toBeInstanceOf(Date);
      expect(result["created[gt]"]).toBe("2023-01-01T00:00:00.000Z");
    });

    it("handleError should return InvoiceError as-is", () => {
      const originalError = new InvoiceError("Original error");
      const result = (invoiceService as any).handleError(
        originalError,
        "Context message"
      );

      expect(result).toBe(originalError);
    });

    it("handleError should wrap non-InvoiceError with context", () => {
      const originalError = new Error("Network error");
      const result = (invoiceService as any).handleError(
        originalError,
        "Failed to process"
      );

      expect(result).toBeInstanceOf(InvoiceError);
      expect(result.message).toBe("Failed to process: Network error");
    });

    it("handleError should handle errors without message", () => {
      const originalError = { toString: () => "Custom error object" };
      const result = (invoiceService as any).handleError(
        originalError,
        "Context"
      );

      expect(result).toBeInstanceOf(InvoiceError);
      expect(result.message).toBe("Context: Custom error object");
    });

    it("handleError should handle null/undefined errors", () => {
      const result1 = (invoiceService as any).handleError(null, "Context");
      const result2 = (invoiceService as any).handleError(undefined, "Context");

      expect(result1).toBeInstanceOf(InvoiceError);
      expect(result1.message).toBe("Context: Unknown error");

      expect(result2).toBeInstanceOf(InvoiceError);
      expect(result2.message).toBe("Context: Unknown error");
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle network timeouts", async () => {
      (mockApiClient.request as any).mockRejectedValue(
        new Error("Request timeout")
      );

      const createRequest: CreateInvoiceRequest = {
        amount: 1000,
        currency: "USD",
        description: "Test invoice",
      };

      expect(invoiceService.create(createRequest)).rejects.toThrow(
        "Failed to create invoice"
      );
    });

    it("should handle API rate limiting errors", async () => {
      (mockApiClient.request as any).mockRejectedValue(
        new Error("Rate limit exceeded")
      );

      expect(invoiceService.list()).rejects.toThrow("Failed to list invoices");
    });

    it("should handle invalid JSON responses", async () => {
      (mockApiClient.request as any).mockRejectedValue(
        new Error("Unexpected token in JSON")
      );

      expect(invoiceService.list()).rejects.toThrow("Failed to list invoices");
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle rapid successive API calls", async () => {
      (mockApiClient.request as any).mockImplementation(
        async (config: RequestConfig) => {
          if (
            config.method === "POST" &&
            config.url === `${API_ENDPOINTS.invoices}`
          ) {
            const data = config.data as CreateInvoiceRequest;
            return createMockInvoice({
              amount: data.amount,
              description: data.description,
            });
          }
          throw new Error("Unexpected request");
        }
      );

      const promises = Array.from({ length: 10 }, (_, i) =>
        invoiceService.create({
          amount: 1000 + i,
          currency: "USD",
          description: `Rapid invoice ${i}`,
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.amount).toBe(1000 + index);
        expect(result.description).toBe(`Rapid invoice ${index}`);
      });

      expect(mockApiClient.request as any).toHaveBeenCalledTimes(10);
    });

    it("should handle empty search results", async () => {
      const emptyResponse = createMockInvoiceListResponse([], 0);
      (mockApiClient.request as any).mockResolvedValue(emptyResponse);

      buildMetadataQuery.mockReturnValue({
        "metadata[nonExistentKey]": "nonExistentValue",
      });

      const response = await invoiceService.searchByMetadata({
        nonExistentKey: "nonExistentValue",
      });

      expect(response.invoices).toHaveLength(0);
      expect(response.meta.total_count).toBe(0);
    });

    it("should handle large metadata objects", async () => {
      const largeMetadata = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`key${i}`, `value${i}`])
      );

      const mockInvoice = createMockInvoice({ metadata: largeMetadata });
      (mockApiClient.request as any).mockResolvedValue(mockInvoice);

      const createRequest: CreateInvoiceRequest = {
        amount: 1000,
        currency: "USD",
        description: "Invoice with large metadata",
        metadata: largeMetadata,
      };

      const invoice = await invoiceService.create(createRequest);

      expect(invoice.metadata).toEqual(largeMetadata);

      expect(mockApiClient.request as any).toHaveBeenCalledWith({
        method: "POST",
        url: `${API_ENDPOINTS.invoices}`,
        data: createRequest,
      });
    });

    it("should handle special characters in descriptions and metadata", async () => {
      const createRequest: CreateInvoiceRequest = {
        amount: 1000,
        currency: "USD",
        description: "Invoice with émojis 🎉 and spëcial chars & symbols!",
        metadata: {
          "special-key": "value with spaces & symbols!",
          "unicode-key": "🎯 Unicode value",
        },
      };

      const mockInvoice = createMockInvoice({
        description: createRequest.description,
        metadata: createRequest.metadata!,
      });
      (mockApiClient.request as any).mockResolvedValue(mockInvoice);

      const invoice = await invoiceService.create(createRequest);

      expect(invoice.description).toBe(createRequest.description);
      expect(invoice.metadata).toEqual(createRequest.metadata!);
    });
  });
});
