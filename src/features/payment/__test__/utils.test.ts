import {
  PaymentStatus,
  PaymentSource,
  CardScheme,
  PaymentUtils,
  PaymentValidation,
  type CreatePaymentRequest,
  type UpdatePaymentRequest,
  type RefundPaymentRequest,
  type CapturePaymentRequest,
  type Payment,
  type CreateCreditCardPaymentSource,
  type CreateApplePayPaymentSource,
} from "@payment";

// Helper function to create mock payment objects
const createMockPayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: "pay_123",
  status: PaymentStatus.PAID,
  amount: 5000,
  fee: 100,
  currency: "SAR",
  refunded: 0,
  refunded_at: null,
  captured: 5000,
  captured_at: new Date(),
  voided_at: null,
  description: "Test payment",
  amount_format: "50.00 SAR",
  fee_format: "1.00 SAR",
  refunded_format: "0.00 SAR",
  captured_format: "50.00 SAR",
  invoice_id: null,
  ip: "127.0.0.1",
  callback_url: "https://example.com/callback",
  created_at: new Date(),
  updated_at: new Date(),
  metadata: {},
  source: {
    type: PaymentSource.CREDITCARD,
    company: CardScheme.VISA,
    name: "Test User",
    number: "4111111111111111",
    gateway_id: "gateway_123",
    message: null,
    reference_number: null,
    transaction_url: null,
  },
  ...overrides,
});

describe("PaymentUtils", () => {
  const paymentUtils = new PaymentUtils({
    metadataValidator: {
      parse: payload => payload,
    },
  });

  describe("validateCreatePaymentRequest", () => {
    const validCreateRequest: CreatePaymentRequest = {
      amount: 5000,
      currency: "SAR",
      description: "Test payment",
      callback_url: "https://example.com/callback",
      source: {
        type: PaymentSource.CREDITCARD,
        name: "Test User",
        number: "4111111111111111",
        month: 12,
        year: 2030,
        cvc: "123",
      },
    };

    it("should validate a correct create payment request", () => {
      const result =
        paymentUtils.validateCreatePaymentRequest(validCreateRequest);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validCreateRequest);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject request with missing required fields", () => {
      const invalidRequest = {
        amount: 5000,
        currency: "SAR",
        // Missing description, callback_url, and source
      } as CreatePaymentRequest;

      const result = paymentUtils.validateCreatePaymentRequest(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes("description"))).toBe(
        true
      );
      expect(result.errors.some(error => error.includes("callback_url"))).toBe(
        true
      );
      expect(result.errors.some(error => error.includes("source"))).toBe(true);
    });

    it("should reject request with invalid amount", () => {
      const invalidRequest = {
        ...validCreateRequest,
        amount: -100,
      };

      const result = paymentUtils.validateCreatePaymentRequest(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes("amount"))).toBe(true);
    });

    it("should reject request with invalid currency", () => {
      const invalidRequest = {
        ...validCreateRequest,
        currency: "INVALID" as any,
      };

      const result = paymentUtils.validateCreatePaymentRequest(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes("currency"))).toBe(
        true
      );
    });
  });

  describe("validateUpdatePaymentRequest", () => {
    const validUpdateRequest: UpdatePaymentRequest = {
      description: "Updated description",
      metadata: {
        user_id: "123",
        order_id: "456",
      },
    };

    it("should validate a correct update payment request", () => {
      const result =
        paymentUtils.validateUpdatePaymentRequest(validUpdateRequest);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validUpdateRequest);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate empty update request", () => {
      const emptyRequest: UpdatePaymentRequest = {};
      const result = paymentUtils.validateUpdatePaymentRequest(emptyRequest);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(emptyRequest);
    });

    it("should reject request with invalid description length", () => {
      const invalidRequest = {
        description: "a".repeat(PaymentValidation.DESCRIPTION_MAX_LENGTH + 1),
      };

      const result = paymentUtils.validateUpdatePaymentRequest(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes("description"))).toBe(
        true
      );
    });
  });

  describe("validateRefundRequest", () => {
    const validRefundRequest: RefundPaymentRequest = {
      amount: 1000,
    };

    it("should validate a correct refund request", () => {
      const result = paymentUtils.validateRefundRequest(validRefundRequest);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validRefundRequest);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate refund request without amount (full refund)", () => {
      const fullRefundRequest: RefundPaymentRequest = {};
      const result = paymentUtils.validateRefundRequest(fullRefundRequest);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(fullRefundRequest);
    });

    it("should reject refund request with negative amount", () => {
      const invalidRequest = {
        amount: -100,
      };

      const result = paymentUtils.validateRefundRequest(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes("amount"))).toBe(true);
    });
  });

  describe("validateCaptureRequest", () => {
    const validCaptureRequest: CapturePaymentRequest = {
      amount: 1000,
    };

    it("should validate a correct capture request", () => {
      const result = paymentUtils.validateCaptureRequest(validCaptureRequest);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validCaptureRequest);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate capture request without amount (full capture)", () => {
      const result = paymentUtils.validateCaptureRequest();
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it("should reject capture request with negative amount", () => {
      const invalidRequest = {
        amount: -100,
      };

      const result = paymentUtils.validateCaptureRequest(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes("amount"))).toBe(true);
    });
  });

  describe("formatAmount", () => {
    it("should format SAR amount correctly", () => {
      const result = paymentUtils.formatAmount(5000, "SAR");
      expect(result).toBe("50.00 SAR");
    });

    it("should format KWD amount correctly", () => {
      const result = paymentUtils.formatAmount(1000, "KWD");
      expect(result).toBe("1.00 KWD");
    });

    it("should format JPY amount correctly (no decimals)", () => {
      const result = paymentUtils.formatAmount(1000, "JPY");
      expect(result).toBe("1000 JPY");
    });

    it("should format USD amount correctly", () => {
      const result = paymentUtils.formatAmount(2500, "USD");
      expect(result).toBe("25.00 USD");
    });

    it("should format EUR amount correctly", () => {
      const result = paymentUtils.formatAmount(1500, "EUR");
      expect(result).toBe("15.00 EUR");
    });
  });

  describe("parseAmount", () => {
    it("should parse SAR amount correctly", () => {
      const result = paymentUtils.parseAmount("50.00 SAR", "SAR");
      expect(result).toBe(5000);
    });

    it("should parse KWD amount correctly", () => {
      const result = paymentUtils.parseAmount("1.50 KWD", "KWD");
      expect(result).toBe(1500);
    });

    it("should parse JPY amount correctly", () => {
      const result = paymentUtils.parseAmount("1000 JPY", "JPY");
      expect(result).toBe(1000);
    });

    it("should parse USD amount correctly", () => {
      const result = paymentUtils.parseAmount("25.75 USD", "USD");
      expect(result).toBe(2575);
    });

    it("should handle amounts without currency symbols", () => {
      const result = paymentUtils.parseAmount("50.00", "SAR");
      expect(result).toBe(5000);
    });

    it("should handle decimal amounts", () => {
      const result = paymentUtils.parseAmount("50.99", "SAR");
      expect(result).toBe(5099);
    });
  });

  describe("isPaymentFinal", () => {
    it("should return true for final statuses", () => {
      expect(paymentUtils.isPaymentFinal(PaymentStatus.PAID)).toBe(true);
      expect(paymentUtils.isPaymentFinal(PaymentStatus.FAILED)).toBe(true);
      expect(paymentUtils.isPaymentFinal(PaymentStatus.REFUNDED)).toBe(true);
      expect(paymentUtils.isPaymentFinal(PaymentStatus.CAPTURED)).toBe(true);
      expect(paymentUtils.isPaymentFinal(PaymentStatus.VOIDED)).toBe(true);
      expect(paymentUtils.isPaymentFinal(PaymentStatus.VERIFIED)).toBe(true);
    });

    it("should return false for non-final statuses", () => {
      expect(paymentUtils.isPaymentFinal(PaymentStatus.INITIATED)).toBe(false);
      expect(paymentUtils.isPaymentFinal(PaymentStatus.AUTHORIZED)).toBe(false);
    });
  });

  describe("canRefundPayment", () => {
    it("should return true for refundable payment", () => {
      const payment = createMockPayment({
        status: PaymentStatus.PAID,
        captured: 5000,
        refunded: 0,
      });
      expect(paymentUtils.canRefundPayment(payment)).toBe(true);
    });

    it("should return true for captured payment", () => {
      const payment = createMockPayment({
        status: PaymentStatus.CAPTURED,
        captured: 5000,
        refunded: 0,
      });
      expect(paymentUtils.canRefundPayment(payment)).toBe(true);
    });

    it("should return false for non-refundable status", () => {
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
      });
      expect(paymentUtils.canRefundPayment(payment)).toBe(false);
    });

    it("should return false when fully refunded", () => {
      const payment = createMockPayment({
        status: PaymentStatus.PAID,
        captured: 5000,
        refunded: 5000,
      });
      expect(paymentUtils.canRefundPayment(payment)).toBe(false);
    });

    it("should return false when no refundable amount", () => {
      const payment = createMockPayment({
        status: PaymentStatus.PAID,
        captured: 0,
        refunded: 0,
      });
      expect(paymentUtils.canRefundPayment(payment)).toBe(false);
    });
  });

  describe("canCapturePayment", () => {
    it("should return true for authorized payment", () => {
      const payment = createMockPayment({ status: PaymentStatus.AUTHORIZED });
      expect(paymentUtils.canCapturePayment(payment)).toBe(true);
    });

    it("should return false for non-authorized payment", () => {
      const payment = createMockPayment({ status: PaymentStatus.PAID });
      expect(paymentUtils.canCapturePayment(payment)).toBe(false);
    });
  });

  describe("canVoidPayment", () => {
    it("should return true for authorized payment", () => {
      const payment = createMockPayment({ status: PaymentStatus.AUTHORIZED });
      expect(paymentUtils.canVoidPayment(payment)).toBe(true);
    });

    it("should return false for non-authorized payment", () => {
      const payment = createMockPayment({ status: PaymentStatus.PAID });
      expect(paymentUtils.canVoidPayment(payment)).toBe(false);
    });
  });

  describe("getMaxRefundAmount", () => {
    it("should return correct max refund amount", () => {
      const payment = createMockPayment({
        captured: 5000,
        refunded: 1000,
      });
      expect(paymentUtils.getMaxRefundAmount(payment)).toBe(4000);
    });

    it("should return 0 when fully refunded", () => {
      const payment = createMockPayment({
        captured: 5000,
        refunded: 5000,
      });
      expect(paymentUtils.getMaxRefundAmount(payment)).toBe(0);
    });

    it("should return 0 when refunded exceeds captured", () => {
      const payment = createMockPayment({
        captured: 5000,
        refunded: 6000,
      });
      expect(paymentUtils.getMaxRefundAmount(payment)).toBe(0);
    });
  });

  describe("getMaxCaptureAmount", () => {
    it("should return amount for authorized payment", () => {
      const payment = createMockPayment({ status: PaymentStatus.AUTHORIZED });
      expect(paymentUtils.getMaxCaptureAmount(payment)).toBe(5000);
    });

    it("should return 0 for non-authorized payment", () => {
      const payment = createMockPayment({ status: PaymentStatus.PAID });
      expect(paymentUtils.getMaxCaptureAmount(payment)).toBe(0);
    });
  });

  describe("validateCvcLength", () => {
    it("should validate correct CVC length for regular cards", () => {
      expect(paymentUtils.validateCvcLength("123")).toBe(true);
      expect(paymentUtils.validateCvcLength("456")).toBe(true);
    });

    it("should validate correct CVC length for AMEX cards", () => {
      expect(paymentUtils.validateCvcLength("1234", CardScheme.AMEX)).toBe(
        true
      );
      expect(paymentUtils.validateCvcLength("5678", CardScheme.AMEX)).toBe(
        true
      );
    });

    it("should reject incorrect CVC length for regular cards", () => {
      expect(paymentUtils.validateCvcLength("12")).toBe(false);
      expect(paymentUtils.validateCvcLength("1234")).toBe(false);
    });

    it("should reject incorrect CVC length for AMEX cards", () => {
      expect(paymentUtils.validateCvcLength("123", CardScheme.AMEX)).toBe(
        false
      );
      expect(paymentUtils.validateCvcLength("12345", CardScheme.AMEX)).toBe(
        false
      );
    });
  });

  describe("maskCardNumber", () => {
    it("should mask card number correctly", () => {
      expect(paymentUtils.maskCardNumber("4111111111111111")).toBe(
        "411111******1111"
      );
      expect(paymentUtils.maskCardNumber("5555555555554444")).toBe(
        "555555******4444"
      );
    });

    it("should handle short card numbers", () => {
      expect(paymentUtils.maskCardNumber("123456789")).toBe("123456789");
    });

    it("should handle very short card numbers", () => {
      expect(paymentUtils.maskCardNumber("123")).toBe("123");
    });
  });

  describe("getCardLast4", () => {
    it("should get last 4 digits correctly", () => {
      expect(paymentUtils.getCardLast4("4111111111111111")).toBe("1111");
      expect(paymentUtils.getCardLast4("5555555555554444")).toBe("4444");
    });

    it("should handle short numbers", () => {
      expect(paymentUtils.getCardLast4("1234")).toBe("1234");
      expect(paymentUtils.getCardLast4("123")).toBe("123");
    });
  });

  describe("buildMetadataQuery", () => {
    it("should build metadata query correctly", () => {
      const metadata = {
        user_id: "123",
        order_id: "456",
        customer_type: "premium",
      };

      const result = paymentUtils.buildMetadataQuery(metadata);
      expect(result).toEqual({
        "metadata[user_id]": "123",
        "metadata[order_id]": "456",
        "metadata[customer_type]": "premium",
      });
    });

    it("should handle empty metadata", () => {
      const result = paymentUtils.buildMetadataQuery({});
      expect(result).toEqual({});
    });
  });

  describe("sanitizeDescription", () => {
    it("should trim whitespace", () => {
      expect(paymentUtils.sanitizeDescription("  Test payment  ")).toBe(
        "Test payment"
      );
    });

    it("should truncate long descriptions", () => {
      const longDescription = "a".repeat(
        PaymentValidation.DESCRIPTION_MAX_LENGTH + 10
      );
      const result = paymentUtils.sanitizeDescription(longDescription);
      expect(result.length).toBe(PaymentValidation.DESCRIPTION_MAX_LENGTH);
    });

    it("should preserve short descriptions", () => {
      const shortDescription = "Test payment";
      const result = paymentUtils.sanitizeDescription(shortDescription);
      expect(result).toBe(shortDescription);
    });
  });

  describe("generateIdempotencyKey", () => {
    it("should generate key with default prefix", () => {
      const key = paymentUtils.generateIdempotencyKey();
      expect(key).toMatch(/^pay_[a-z0-9]+_[a-z0-9]+$/);
    });

    it("should generate key with custom prefix", () => {
      const key = paymentUtils.generateIdempotencyKey("invoice");
      expect(key).toMatch(/^invoice_[a-z0-9]+_[a-z0-9]+$/);
    });

    it("should generate unique keys", () => {
      const key1 = paymentUtils.generateIdempotencyKey();
      const key2 = paymentUtils.generateIdempotencyKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("requires3DS", () => {
    it("should return true for credit card without 3DS bypass", () => {
      const source: CreateCreditCardPaymentSource = {
        type: PaymentSource.CREDITCARD,
        name: "Test User",
        number: "4111111111111111",
        month: 12,
        year: 2030,
        cvc: "123",
      };

      expect(paymentUtils.requires3DS(source)).toBe(true);
    });

    it("should return false for credit card with 3DS bypass", () => {
      const source: CreateCreditCardPaymentSource = {
        type: PaymentSource.CREDITCARD,
        name: "Test User",
        number: "4111111111111111",
        month: 12,
        year: 2025,
        cvc: "123",
        "3ds": false,
      };

      expect(paymentUtils.requires3DS(source)).toBe(false);
    });

    it("should return false for wallet payments", () => {
      const source: CreateApplePayPaymentSource = {
        type: PaymentSource.APPLEPAY,
        token: "token_123",
      };

      expect(paymentUtils.requires3DS(source)).toBe(false);
    });
  });

  describe("safeParsePayment", () => {
    const validPaymentData: Payment = {
      id: "pay_123",
      status: PaymentStatus.PAID,
      amount: 5000,
      fee: 100,
      currency: "SAR",
      refunded: 0,
      refunded_at: null,
      captured: 5000,
      captured_at: new Date("2023-01-01T00:00:00Z"),
      voided_at: null,
      description: "Test payment",
      amount_format: "50.00 SAR",
      fee_format: "1.00 SAR",
      refunded_format: "0.00 SAR",
      captured_format: "50.00 SAR",
      invoice_id: null,
      ip: "127.0.0.1",
      callback_url: "https://example.com/callback",
      created_at: new Date("2023-01-01T00:00:00Z"),
      updated_at: new Date("2023-01-01T00:00:00Z"),
      metadata: null,
      source: {
        type: PaymentSource.CREDITCARD,
        company: CardScheme.VISA,
        name: "Test User",
        number: "4111111111111111",
        gateway_id: "gateway_123",
        message: null,
        reference_number: null,
        transaction_url: null,
      },
    };

    it("should successfully parse valid payment data", () => {
      const result = paymentUtils.safeParsePayment(validPaymentData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("should handle invalid payment data", () => {
      const invalidData = { invalid: "data" };
      const result = paymentUtils.safeParsePayment(invalidData);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it("should handle null/undefined data", () => {
      const result = paymentUtils.safeParsePayment(null);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
