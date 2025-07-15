import type {
  Invoice,
  CreateInvoiceRequest,
  BulkCreateInvoiceRequest,
  DetailedInvoice,
} from "./types";
import { InvoiceStatus } from "./enums";
import {
  CreateInvoiceSchema,
  BulkCreateInvoiceSchema,
  invoiceSchema,
} from "./validation/schemas";
import { PaymentStatus } from "@payment";
import type { ValidationResult, Amount, CurrencyType } from "@types";

export class InvoiceUtils {
  /**
   * Validate single invoice creation request using Zod
   */
  static validateCreateInvoiceRequest(
    request: CreateInvoiceRequest
  ): ValidationResult<CreateInvoiceRequest> {
    const result = CreateInvoiceSchema.safeParse(request);

    if (result.success) {
      return {
        success: true,
        data: result.data as CreateInvoiceRequest,
        errors: [],
      };
    }

    const errors = result.error.issues.map(err => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    });

    return {
      success: false,
      errors,
    };
  }

  /**
   * Validate bulk invoice creation request using Zod
   */
  static validateBulkCreateRequest(
    request: BulkCreateInvoiceRequest
  ): ValidationResult<BulkCreateInvoiceRequest> {
    const result = BulkCreateInvoiceSchema.safeParse(request);

    if (result.success) {
      return {
        success: true,
        data: result.data as BulkCreateInvoiceRequest,
        errors: [],
      };
    }

    const errors = result.error.issues.map(err => {
      let message = err.message;

      // Format array index errors more clearly
      if (
        err.path.length >= 2 &&
        err.path[0] === "invoices" &&
        typeof err.path[1] === "number"
      ) {
        const invoiceIndex = err.path[1] as number;
        const fieldPath = err.path.slice(2).join(".");
        const fieldPrefix = fieldPath ? `${fieldPath}: ` : "";
        message = `Invoice ${invoiceIndex + 1}: ${fieldPrefix}${err.message}`;
      } else if (err.path.length > 0) {
        const path = err.path.join(".");
        message = `${path}: ${err.message}`;
      }

      return message;
    });

    return {
      success: false,
      errors,
    };
  }

  /**
   * Convert amount to display format
   */
  static formatAmount(
    amount: Amount,
    currency: CurrencyType
  ): `${number} ${CurrencyType}` {
    const divisors: Record<string, number> = {
      KWD: 1000,
      JPY: 1,
      SAR: 100,
      USD: 100,
      EUR: 100,
    };

    const divisor = divisors[currency] ?? 100;
    const formattedAmount = (amount / divisor).toFixed(
      divisor === 1 ? 0 : 2
    ) as `${number}`;

    return `${formattedAmount} ${currency}`;
  }

  /**
   * Parse amount from display format to smallest unit
   */
  static parseAmount(formattedAmount: string, currency: CurrencyType): number {
    const divisors: Record<string, number> = {
      KWD: 1000,
      JPY: 1,
      SAR: 100,
      USD: 100,
      EUR: 100,
    };

    const amount = parseFloat(formattedAmount.replace(/[^\d.]/g, ""));
    const divisor = divisors[currency.toUpperCase()] || 100;

    return Math.round(amount * divisor);
  }

  /**
   * Check if invoice is in a final state
   */
  static isInvoiceFinal(status: InvoiceStatus): boolean {
    const finalStatuses: InvoiceStatus[] = [
      InvoiceStatus.PAID,
      InvoiceStatus.CANCELED,
      InvoiceStatus.EXPIRED,
      InvoiceStatus.VOIDED,
    ];
    return finalStatuses.includes(status);
  }

  /**
   * Check if invoice can be canceled
   */
  static canCancelInvoice(invoice: Invoice): boolean {
    const cancelableStatuses: InvoiceStatus[] = [
      InvoiceStatus.INITIATED,
      InvoiceStatus.FAILED,
    ];
    return cancelableStatuses.includes(invoice.status);
  }

  /**
   * Check if invoice is expired
   */
  static isInvoiceExpired(invoice: Invoice): boolean {
    if (!invoice.expired_at) {
      return false;
    }

    return new Date(invoice.expired_at) <= new Date();
  }

  /**
   * Get time until expiry
   */
  static getTimeUntilExpiry(invoice: Invoice): number | null {
    if (!invoice.expired_at) {
      return null;
    }

    const expiryTime = new Date(invoice.expired_at).getTime();
    const currentTime = new Date().getTime();

    return Math.max(0, expiryTime - currentTime);
  }

  /**
   * Get payment summary for an invoice
   */
  static getPaymentSummary(invoice: DetailedInvoice) {
    const payments = invoice.payments;

    return {
      total: payments.length,
      paid: payments.filter(p => p.status === PaymentStatus.PAID).length,
      failed: payments.filter(p => p.status === PaymentStatus.FAILED).length,
      pending: payments.filter(p => p.status === PaymentStatus.INITIATED)
        .length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments
        .filter(p => p.status === PaymentStatus.PAID)
        .reduce((sum, p) => sum + p.amount, 0),
      refundedAmount: payments.reduce((sum, p) => sum + p.refunded, 0),
    };
  }

  /**
   * Build metadata query parameters for filtering
   */
  static buildMetadataQuery(
    metadata: Record<string, string>
  ): Record<string, string> {
    const query: Record<string, string> = {};

    Object.entries(metadata).forEach(([key, value]) => {
      query[`metadata[${key}]`] = value;
    });

    return query;
  }

  /**
   * Sanitize invoice description
   */
  static sanitizeDescription(description: string): string {
    return description.trim().substring(0, 255);
  }

  /**
   * Generate invoice reference number
   */
  static generateReference(prefix: string = "INV"): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Parse and validate a CreateInvoiceRequest, returning sanitized data
   */
  static parseCreateInvoiceRequest(
    request: unknown
  ): ValidationResult<CreateInvoiceRequest> {
    return this.validateCreateInvoiceRequest(request as CreateInvoiceRequest);
  }

  /**
   * Parse and validate a BulkCreateInvoiceRequest, returning sanitized data
   */
  static parseBulkCreateRequest(
    request: unknown
  ): ValidationResult<BulkCreateInvoiceRequest> {
    return this.validateBulkCreateRequest(request as BulkCreateInvoiceRequest);
  }

  static parseInvoice(invoice: unknown): Invoice {
    return invoiceSchema.parse(invoice);
  }
}
