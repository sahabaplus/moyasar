import type { ApiClient, MoyasarClientTypes } from "@types";
import { API_ENDPOINTS } from "@constants";
import { MoyasarError } from "@errors";
import type {
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  BulkCreateInvoiceRequest,
  ListInvoicesResponse,
  BulkCreateInvoicesResponse,
  InvoiceListOptions,
  DetailedInvoice,
} from "./types";
import { InvoiceStatus } from "./enums";
import { InvoiceUtils } from "./utils";
import { InvoiceError } from "./errors";

type InvoiceServiceParams<T extends MoyasarClientTypes> = {
  apiClient: ApiClient<T>;
};

export class InvoiceService<T extends MoyasarClientTypes> {
  private readonly apiClient: ApiClient<T>;
  private readonly invoiceUtils: InvoiceUtils<T["metadata"]>;

  constructor(p: InvoiceServiceParams<T>) {
    this.apiClient = p.apiClient;
    this.invoiceUtils = new InvoiceUtils({
      metadataValidator: this.apiClient.metadataValidator,
    });
  }

  /**
   * Create a new invoice
   */
  async create(
    params: CreateInvoiceRequest<T["metadata"]>
  ): Promise<DetailedInvoice<T["metadata"]>> {
    // Validate input
    const validation = this.invoiceUtils.validateCreateInvoiceRequest(params);
    if (!validation.success) {
      throw new InvoiceError(
        `Validation failed: ${validation.errors.join(", ")}`
      );
    }

    try {
      const invoice = await this.apiClient.request<
        DetailedInvoice<T["metadata"]>
      >({
        method: "POST",
        url: API_ENDPOINTS.invoices,
        data: params,
      });

      return invoice;
    } catch (error) {
      const invoiceError = this.handleError(error, "Failed to create invoice");
      throw invoiceError;
    }
  }

  /**
   * Create multiple invoices in bulk
   */
  async createBulk(
    params: BulkCreateInvoiceRequest<T["metadata"]>
  ): Promise<BulkCreateInvoicesResponse<T["metadata"]>> {
    // Validate input
    const validation = this.invoiceUtils.validateBulkCreateRequest(params);
    if (!validation.success) {
      throw new InvoiceError(
        `Validation failed: ${validation.errors.join(", ")}`
      );
    }

    try {
      const response = await this.apiClient.request<
        BulkCreateInvoicesResponse<T["metadata"]>
      >({
        method: "POST",
        url: API_ENDPOINTS.bulkInvoices,
        data: params,
      });

      return response;
    } catch (error) {
      const invoiceError = this.handleError(
        error,
        "Failed to create bulk invoices"
      );
      throw invoiceError;
    }
  }

  /**
   * List invoices with optional filtering
   */
  async list(
    options: InvoiceListOptions<T["metadata"]> = {}
  ): Promise<ListInvoicesResponse<T["metadata"]>> {
    try {
      // Convert metadata filters to proper query format
      const queryParams = this.parseBody(options);

      return await this.apiClient.request<ListInvoicesResponse<T["metadata"]>>({
        method: "GET",
        url: API_ENDPOINTS.invoices,
        params: queryParams,
      });
    } catch (error) {
      const invoiceError = this.handleError(error, "Failed to list invoices");
      throw invoiceError;
    }
  }

  /**
   * Retrieve a specific invoice
   */
  async retrieve(invoiceId: string): Promise<DetailedInvoice<T["metadata"]>> {
    if (!invoiceId) {
      throw new InvoiceError("Invoice ID is required");
    }

    try {
      return await this.apiClient.request<DetailedInvoice<T["metadata"]>>({
        method: "GET",
        url: `${API_ENDPOINTS.invoices}/${invoiceId}`,
      });
    } catch (error) {
      const invoiceError = this.handleError(
        error,
        `Failed to retrieve invoice ${invoiceId}`
      );
      throw invoiceError;
    }
  }

  /**
   * Update an invoice
   */
  async update(
    invoiceId: string,
    params: UpdateInvoiceRequest<T["metadata"]>
  ): Promise<DetailedInvoice<T["metadata"]>> {
    if (!invoiceId) {
      throw new InvoiceError("Invoice ID is required");
    }

    try {
      const invoice = await this.apiClient.request<
        DetailedInvoice<T["metadata"]>
      >({
        method: "PUT",
        url: `${API_ENDPOINTS.invoices}/${invoiceId}`,
        data: params,
      });

      return invoice;
    } catch (error) {
      const invoiceError = this.handleError(
        error,
        `Failed to update invoice ${invoiceId}`
      );
      throw invoiceError;
    }
  }

  /**
   * Cancel an invoice
   */
  async cancel(invoiceId: string): Promise<DetailedInvoice<T["metadata"]>> {
    if (!invoiceId) {
      throw new InvoiceError("Invoice ID is required");
    }

    try {
      const invoice = await this.apiClient.request<
        DetailedInvoice<T["metadata"]>
      >({
        method: "PUT",
        url: `${API_ENDPOINTS.invoices}/${invoiceId}/cancel`,
      });

      return invoice;
    } catch (error) {
      const invoiceError = this.handleError(
        error,
        `Failed to cancel invoice ${invoiceId}`
      );
      throw invoiceError;
    }
  }

  /**
   * Search invoices by metadata
   */
  async searchByMetadata(
    metadata: Partial<T["metadata"]>,
    options: Omit<InvoiceListOptions, "metadata"> = {}
  ): Promise<ListInvoicesResponse<T["metadata"]>> {
    return this.list({
      ...options,
      metadata,
    });
  }

  /**
   * Get invoices by status
   */
  async getByStatus(
    status: InvoiceStatus,
    options: Omit<InvoiceListOptions, "status"> = {}
  ): Promise<ListInvoicesResponse<T["metadata"]>> {
    return this.list({
      ...options,
      status,
    });
  }

  /**
   * Get expired invoices
   */
  async getExpired(
    options: Omit<InvoiceListOptions, "status"> = {}
  ): Promise<ListInvoicesResponse<T["metadata"]>> {
    return this.getByStatus(InvoiceStatus.EXPIRED, options);
  }

  /**
   * Get paid invoices
   */
  async getPaid(
    options: Omit<InvoiceListOptions, "status"> = {}
  ): Promise<ListInvoicesResponse<T["metadata"]>> {
    return this.getByStatus(InvoiceStatus.PAID, options);
  }

  private handleError(error: any, message: string): InvoiceError {
    if (error instanceof InvoiceError) {
      return error;
    }

    if (error instanceof MoyasarError) {
      return new InvoiceError(`${message}: ${error.message}`, {
        ...error.details,
      });
    }

    const errorMessage = error?.message || error?.toString() || "Unknown error";
    return new InvoiceError(`${message}: ${errorMessage}`, {
      cause: errorMessage,
    });
  }

  protected parseBody(p: InvoiceListOptions<T["metadata"]>) {
    const copied = {
      ...p,
      ...this.invoiceUtils.buildMetadataQuery(p.metadata ?? {}),
    };

    delete copied.metadata;

    Object.entries(copied).forEach(([key, value]) => {
      if (typeof value === "object") {
        if (value instanceof Date) {
          // @ts-expect-error
          copied[key] = value.toISOString();
        }
      }
    });

    return copied;
  }
}
