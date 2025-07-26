import type { ApiClient, Metadata, MoyasarClientTypes } from "@types";
import { API_ENDPOINTS } from "@constants";
import type {
  ListPaymentsResponse,
  PaymentListOptions,
  Payment,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  RefundPaymentRequest,
  CapturePaymentRequest,
} from "./types";
import { PaymentStatus } from "./enums";
import { PaymentUtils } from "./utils";
import { PaymentError } from "./errors";
import { MoyasarError } from "../../shared/errors";

type PaymentServiceParams<T extends MoyasarClientTypes> = {
  apiClient: ApiClient<T>;
};

export class PaymentService<T extends MoyasarClientTypes> {
  private apiClient: ApiClient<T>;
  private readonly paymentUtils: PaymentUtils<T["metadata"]>;

  constructor(p: PaymentServiceParams<T>) {
    this.apiClient = p.apiClient;
    this.paymentUtils = new PaymentUtils({
      metadataValidator: p.apiClient.metadataValidator,
    });
  }

  /**
   * Create a new payment
   */
  async create(
    params: CreatePaymentRequest<T["metadata"]>
  ): Promise<Payment<T["metadata"]>> {
    // Validate input
    const validation = this.paymentUtils.validateCreatePaymentRequest(params);
    if (!validation.success) {
      throw new PaymentError(
        `Validation failed: ${validation.errors.join(", ")}`,
        400
      );
    }

    try {
      const response = await this.apiClient.request<unknown>({
        method: "POST",
        url: API_ENDPOINTS.payments,
        data: params,
      });

      return this.paymentUtils.parsePayment(response);
    } catch (error) {
      const paymentError = this.handleError(error, `Failed to create payment`);
      throw paymentError;
    }
  }

  /**
   * List payments with optional filtering
   */
  async list(
    options: PaymentListOptions = {}
  ): Promise<ListPaymentsResponse<T["metadata"]>> {
    try {
      // Convert metadata filters to proper query format
      const queryParams = this.parseBody(options);
      const response = await this.apiClient.request<unknown>({
        method: "GET",
        url: API_ENDPOINTS.payments,
        params: queryParams,
      });

      const parsed = this.paymentUtils.parseListPaymentsResponse(response);
      return parsed;
    } catch (error) {
      const paymentError = this.handleError(error, "Failed to list payments");
      throw paymentError;
    }
  }

  /**
   * Retrieve a specific payment
   */
  async retrieve(paymentId: string): Promise<Payment<T["metadata"]>> {
    if (!paymentId) throw new PaymentError("Payment ID is required", 400);

    try {
      const response = await this.apiClient.request<unknown>({
        method: "GET",
        url: `${API_ENDPOINTS.payments}/${paymentId}`,
      });

      // Parse and validate the response
      const payment = this.paymentUtils.parsePayment(response);
      return payment;
    } catch (error) {
      const paymentError = this.handleError(
        error,
        `Failed to retrieve payment ${paymentId}`
      );
      throw paymentError;
    }
  }

  /**
   * Update a payment
   */
  async update({
    paymentId,
    update,
  }: {
    paymentId: string;
    update: UpdatePaymentRequest<T["metadata"]>;
  }): Promise<Payment<T["metadata"]>> {
    if (!paymentId) {
      throw new PaymentError("Payment ID is required", 400);
    }

    // Validate input
    const validation = this.paymentUtils.validateUpdatePaymentRequest(update);
    if (!validation.success) {
      throw new PaymentError(
        `Validation failed: ${validation.errors.join(", ")}`,
        400
      );
    }

    try {
      const response = await this.apiClient.request<Payment<T["metadata"]>>({
        method: "PUT",
        url: `${API_ENDPOINTS.payments}/${paymentId}`,
        data: update,
      });

      return response;
    } catch (error) {
      const paymentError = this.handleError(
        error,
        `Failed to update payment ${paymentId}`
      );
      throw paymentError;
    }
  }

  /**
   * Refund a payment (full or partial)
   */
  async refund({
    paymentId,
    refund,
  }: {
    paymentId: string;
    refund: RefundPaymentRequest;
  }): Promise<Payment<T["metadata"]>> {
    if (!paymentId) {
      throw new PaymentError("Payment ID is required", 400);
    }

    refund.amount;
    // Validate input
    const validation = this.paymentUtils.validateRefundRequest(refund);
    if (!validation.success) {
      throw new PaymentError(
        `Validation failed: ${validation.errors.join(", ")}`,
        400
      );
    }

    try {
      const response = await this.apiClient.request<unknown>({
        method: "POST",
        url: `${API_ENDPOINTS.payments}/${paymentId}/refund`,
        data: refund,
      });

      // Parse and validate the response
      const payment = this.paymentUtils.parsePayment(response);
      return payment;
    } catch (error) {
      const paymentError = this.handleError(
        error,
        `Failed to refund payment ${paymentId}`
      );
      throw paymentError;
    }
  }

  /**
   * Capture an authorized payment (full or partial)
   */
  async capture({
    paymentId,
    capture,
  }: {
    paymentId: string;
    capture?: CapturePaymentRequest;
  }): Promise<Payment<T["metadata"]>> {
    if (!paymentId) throw new PaymentError("Payment ID is required", 400);

    // Validate input
    const validation = this.paymentUtils.validateCaptureRequest(capture);
    if (!validation.success) {
      throw new PaymentError(`Validation failed: ${validation.errors}`, 400, {
        errors: validation.errors,
      });
    }

    try {
      const response = await this.apiClient.request<unknown>({
        method: "POST",
        url: `${API_ENDPOINTS.payments}/${paymentId}/capture`,
        data: capture,
      });

      // Parse and validate the response
      const payment = this.paymentUtils.parsePayment(response);
      return payment;
    } catch (error) {
      const paymentError = this.handleError(
        error,
        `Failed to capture payment ${paymentId}`
      );
      throw paymentError;
    }
  }

  /**
   * Void an authorized payment
   */
  async void(paymentId: string): Promise<Payment<T["metadata"]>> {
    if (!paymentId) throw new PaymentError("Payment ID is required", 400);

    try {
      const response = await this.apiClient.request<unknown>({
        method: "POST",
        url: `${API_ENDPOINTS.payments}/${paymentId}/void`,
      });

      // Parse and validate the response
      const payment = this.paymentUtils.parsePayment(response);
      return payment;
    } catch (error) {
      const paymentError = this.handleError(
        error,
        `Failed to void payment ${paymentId}`
      );
      throw paymentError;
    }
  }

  /**
   * Search payments by metadata
   */
  async searchByMetadata({
    metadata,
    options,
  }: {
    metadata: Metadata;
    options: Omit<PaymentListOptions, "metadata">;
  }): Promise<ListPaymentsResponse<T["metadata"]>> {
    const metadataQuery = this.paymentUtils.buildMetadataQuery(metadata);

    return this.list({
      ...options,
      ...metadataQuery,
    } as PaymentListOptions);
  }

  /**
   * Get payments by status
   */
  async getByStatus(
    status: PaymentStatus,
    options: Omit<PaymentListOptions, "status"> = {}
  ): Promise<ListPaymentsResponse<T["metadata"]>> {
    return this.list({
      ...options,
      status,
    });
  }

  /**
   * Get paid payments
   */
  async getPaid(
    options: Omit<PaymentListOptions, "status"> = {}
  ): Promise<ListPaymentsResponse<T["metadata"]>> {
    return this.getByStatus(PaymentStatus.PAID, options);
  }

  /**
   * Get failed payments
   */
  async getFailed(
    options: Omit<PaymentListOptions, "status"> = {}
  ): Promise<ListPaymentsResponse<T["metadata"]>> {
    return this.getByStatus(PaymentStatus.FAILED, options);
  }

  /**
   * Get authorized payments
   */
  async getAuthorized(
    options: Omit<PaymentListOptions, "status"> = {}
  ): Promise<ListPaymentsResponse<T["metadata"]>> {
    return this.getByStatus(PaymentStatus.AUTHORIZED, options);
  }

  /**
   * Get refunded payments
   */
  async getRefunded(
    options: Omit<PaymentListOptions, "status"> = {}
  ): Promise<ListPaymentsResponse<T["metadata"]>> {
    return this.getByStatus(PaymentStatus.REFUNDED, options);
  }

  /**
   * Get payments by card last 4 digits
   */
  async getByCardLast4({
    last4,
    options,
  }: {
    last4: string;
    options: Omit<PaymentListOptions, "last_4">;
  }): Promise<ListPaymentsResponse<T["metadata"]>> {
    if (!/^\d{4}$/.test(last4)) {
      throw new PaymentError("Last 4 digits must be exactly 4 digits", 400);
    }

    return this.list({
      ...options,
      last_4: last4,
    });
  }

  /**
   * Get payments by RRN (Retrieval Reference Number)
   */
  async getByRRN({
    rrn,
    options,
  }: {
    rrn: string;
    options: Omit<PaymentListOptions, "rrn">;
  }): Promise<ListPaymentsResponse<T["metadata"]>> {
    if (!/^\d{12}$/.test(rrn)) {
      throw new PaymentError("RRN must be exactly 12 digits", 400);
    }

    return this.list({
      ...options,
      rrn,
    });
  }

  /**
   * Check payment capabilities (what actions can be performed)
   */
  async getPaymentCapabilities(paymentId: string): Promise<{
    canRefund: boolean;
    canCapture: boolean;
    canVoid: boolean;
    maxRefundAmount: number;
    maxCaptureAmount: number;
  }> {
    const payment = await this.retrieve(paymentId);

    return {
      canRefund: this.paymentUtils.canRefundPayment(payment),
      canCapture: this.paymentUtils.canCapturePayment(payment),
      canVoid: this.paymentUtils.canVoidPayment(payment),
      maxRefundAmount: this.paymentUtils.getMaxRefundAmount(payment),
      maxCaptureAmount: this.paymentUtils.getMaxCaptureAmount(payment),
    };
  }

  private handleError(error: any, message: string): PaymentError {
    if (error instanceof PaymentError) return error;

    if (error instanceof MoyasarError) {
      return new PaymentError(
        `${message}: ${error.message}`,
        error.statusCode,
        { ...error.details }
      );
    }

    const errorMessage = error?.message || error?.toString() || "Unknown error";
    return new PaymentError(`${message}: ${errorMessage}`, 500, {
      cause: errorMessage,
    });
  }

  protected parseBody(p: object): Record<string, string> {
    const copied = { ...p };
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
