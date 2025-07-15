import type { ListPaymentsResponse, Payment } from "./types";
import type {
  CreatePaymentRequest,
  UpdatePaymentRequest,
  RefundPaymentRequest,
  CapturePaymentRequest,
} from "./types";
import { PaymentValidation } from "./constants";
import { PaymentStatus, PaymentSource, CardScheme } from "./enums";
import { type Amount, type CurrencyType } from "@types";
import {
  CreatePaymentSchema,
  UpdatePaymentSchema,
  RefundPaymentSchema,
  CapturePaymentSchema,
  PaymentSchema,
  listPaymentResponseSchema,
} from "./validation/schemas";
import type { ValidationResult } from "@types";

export class PaymentUtils {
  /**
   * Validate payment creation request using Zod
   */
  static validateCreatePaymentRequest(
    request: CreatePaymentRequest
  ): ValidationResult<CreatePaymentRequest> {
    const result = CreatePaymentSchema.safeParse(request);

    if (result.success) {
      return {
        success: true,
        data: result.data as CreatePaymentRequest,
        errors: [],
      };
    }

    const errors = result.error.issues.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    });

    return {
      success: false,
      errors,
    };
  }

  /**
   * Validate payment update request using Zod
   */
  static validateUpdatePaymentRequest(
    request: UpdatePaymentRequest
  ): ValidationResult<UpdatePaymentRequest> {
    const result = UpdatePaymentSchema.safeParse(request);

    if (result.success) {
      return {
        success: true,
        data: result.data as UpdatePaymentRequest,
        errors: [],
      };
    }

    const errors = result.error.issues.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    });

    return {
      success: false,
      errors,
    };
  }

  /**
   * Validate refund request using Zod
   */
  static validateRefundRequest(
    request: RefundPaymentRequest
  ): ValidationResult<RefundPaymentRequest> {
    const result = RefundPaymentSchema.safeParse(request);

    if (result.success) {
      return {
        success: true,
        data: result.data as RefundPaymentRequest,
        errors: [],
      };
    }

    const errors = result.error.issues.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    });

    return {
      success: false,
      errors,
    };
  }

  /**
   * Validate capture request using Zod
   */
  static validateCaptureRequest(
    request?: CapturePaymentRequest
  ): ValidationResult<CapturePaymentRequest> {
    const result = CapturePaymentSchema.safeParse(request);

    if (result.success) {
      return {
        success: true,
        data: result.data as CapturePaymentRequest,
        errors: [],
      };
    }

    const errors = result.error.issues.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    });

    return {
      success: false,
      errors,
    };
  }

  /**
   * Format amount for display
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
   * Check if payment is in a final state
   */
  static isPaymentFinal(status: PaymentStatus): boolean {
    const finalStatuses: PaymentStatus[] = [
      PaymentStatus.PAID,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
      PaymentStatus.CAPTURED,
      PaymentStatus.VOIDED,
      PaymentStatus.VERIFIED,
    ];
    return finalStatuses.includes(status);
  }

  /**
   * Check if payment can be refunded
   */
  static canRefundPayment(payment: Payment): boolean {
    const refundableStatuses: PaymentStatus[] = [
      PaymentStatus.PAID,
      PaymentStatus.CAPTURED,
    ];

    // Check if status allows refund and if there's refundable amount
    const statusAllowed = refundableStatuses.includes(payment.status);
    const hasRefundableAmount = payment.captured - payment.refunded > 0;

    // Check if within refund timeout (if refunded_at exists, can't refund again)
    const notFullyRefunded = payment.refunded < payment.captured;

    return statusAllowed && hasRefundableAmount && notFullyRefunded;
  }

  /**
   * Check if payment can be captured
   */
  static canCapturePayment(payment: Payment): boolean {
    return payment.status === PaymentStatus.AUTHORIZED;
  }

  /**
   * Check if payment can be voided
   */
  static canVoidPayment(payment: Payment): boolean {
    return payment.status === PaymentStatus.AUTHORIZED;
  }

  /**
   * Get maximum refund amount for a payment
   */
  static getMaxRefundAmount(payment: Payment): number {
    return Math.max(0, payment.captured - payment.refunded);
  }

  /**
   * Get maximum capture amount for an authorized payment
   */
  static getMaxCaptureAmount(payment: Payment): number {
    if (payment.status !== PaymentStatus.AUTHORIZED) {
      return 0;
    }
    return payment.amount;
  }

  /**
   * Check if card scheme matches expected CVV length
   */
  static validateCvcLength(cvc: string, scheme?: CardScheme): boolean {
    if (scheme === CardScheme.AMEX) {
      return cvc.length === PaymentValidation.AMEX_CVV_LENGTH;
    }
    return cvc.length === PaymentValidation.CVV_LENGTH;
  }

  /**
   * Mask card number for display (show first 6 and last 4 digits)
   */
  static maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 10) {
      return cardNumber;
    }
    const first6 = cardNumber.substring(0, 6);
    const last4 = cardNumber.substring(cardNumber.length - 4);
    const middle = "*".repeat(cardNumber.length - 10);
    return `${first6}${middle}${last4}`;
  }

  /**
   * Get last 4 digits of card number
   */
  static getCardLast4(cardNumber: string): string {
    return cardNumber.substring(cardNumber.length - 4);
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
   * Sanitize payment description
   */
  static sanitizeDescription(description: string): string {
    return description
      .trim()
      .substring(0, PaymentValidation.DESCRIPTION_MAX_LENGTH);
  }

  /**
   * Generate idempotency key for payment
   */
  static generateIdempotencyKey(prefix: string = "pay"): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Check if payment method requires 3DS by default
   */
  static requires3DS(source: CreatePaymentRequest["source"]): boolean {
    // Credit cards typically require 3DS unless explicitly bypassed
    if (source.type === PaymentSource.CREDITCARD)
      return source["3ds"] !== false; // Undefined maps to true by default

    // Wallet payments usually handle their own authentication
    return false;
  }

  /**
   * Parse and validate a Payment response, ensuring all data types are correct
   */
  static parsePayment(payment: unknown): Payment {
    return PaymentSchema.parse(payment);
  }

  static parseListPaymentsResponse(response: unknown): ListPaymentsResponse {
    return listPaymentResponseSchema.parse(response);
  }

  /**
   * Parse and validate an array of Payment responses
   */
  static parsePayments(payments: unknown): Payment[] {
    if (!Array.isArray(payments)) {
      throw new Error("Expected payments to be an array");
    }
    return payments.map((payment) => this.parsePayment(payment));
  }

  /**
   * Safely parse a Payment response with error handling
   */
  static safeParsePayment(payment: unknown): {
    success: boolean;
    data?: Payment;
    error?: string;
  } {
    try {
      const parsedPayment = this.parsePayment(payment);
      return {
        success: true,
        data: parsedPayment,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown parsing error",
      };
    }
  }
  static parseCreatePaymentRequest(
    request: unknown
  ): ValidationResult<CreatePaymentRequest> {
    return this.validateCreatePaymentRequest(request as CreatePaymentRequest);
  }

  /**
   * Parse and validate an UpdatePaymentRequest, returning sanitized data
   */
  static parseUpdatePaymentRequest(
    request: unknown
  ): ValidationResult<UpdatePaymentRequest> {
    return this.validateUpdatePaymentRequest(request as UpdatePaymentRequest);
  }
}

export * as PaymentSchemas from "./validation/schemas";
