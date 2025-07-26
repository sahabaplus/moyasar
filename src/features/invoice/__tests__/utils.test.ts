import {
  type CreateInvoiceRequest,
  type BulkCreateInvoiceRequest,
  type Invoice,
  type DetailedInvoice,
  InvoiceStatus,
  BulkInvoiceLimit,
  InvoiceUtils,
} from "@invoice";

import {
  CardScheme,
  PaymentSource,
  PaymentStatus,
  type Payment,
  type CreditCardSource,
} from "@payment";

const invoiceTemplate: Invoice = {
  id: "1",
  status: InvoiceStatus.INITIATED,
  amount: 1000,
  currency: "USD",
  amount_format: "10.00 USD",
  metadata: {},
  updated_at: new Date(),
  url: "https://example.com",
  description: "Test",
  created_at: new Date(),
};

const paymentTemplate: Payment = {
  id: "pay_1234567890abcdef",
  status: PaymentStatus.PAID,
  amount: 1000,
  fee: 35,
  currency: "USD",
  refunded: 0,
  refunded_at: null,
  captured: 1000,
  captured_at: new Date(),
  voided_at: null,
  description: "Payment for invoice #INV-001",
  amount_format: "10.00 USD",
  fee_format: "0.35 USD",
  refunded_format: "0.00 USD",
  captured_format: "10.00 USD",
  invoice_id: "inv_abcdef1234567890",
  ip: "192.168.1.100",
  callback_url: "https://example.com/webhook/payment",
  created_at: new Date(),
  updated_at: new Date(),
  metadata: {
    order_id: "ORD-12345",
    customer_id: "CUST-98765",
    source: "web",
  },
  source: {
    type: PaymentSource.CREDITCARD,
    name: "John Doe",
    company: CardScheme.AMEX,
    token: "tok_visa_001",
    number: "4111",
    gateway_id: "gw_visa_001",
    reference_number: "REF123456789",
    message: "Approved",
    transaction_url: "https://gateway.com/transaction/txn_123",
    authorization_code: "AUTH123",
    response_code: "00",
  } satisfies CreditCardSource,
};

describe("invoiceUtils", () => {
  const invoiceUtils = new InvoiceUtils({
    metadataValidator: {
      parse: payload => payload,
    },
  });

  describe("validateCreateInvoiceRequest", () => {
    test("should validate a valid create invoice request", () => {
      const validRequest: CreateInvoiceRequest = {
        amount: 1000,
        currency: "USD",
        description: "Test invoice",
        callback_url: "https://example.com/callback",
        success_url: "https://example.com/success",
        back_url: "https://example.com/back",
        expired_at: new Date(Date.now() + 86400000), // 24 hours from now
        metadata: { orderId: "12345" },
      };

      const result = invoiceUtils.validateCreateInvoiceRequest(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(result.data?.currency).toBe("USD");
      expect(result.data?.description).toBe("Test invoice");
    });

    test("should validate request with only required fields", () => {
      const minimalRequest: CreateInvoiceRequest = {
        amount: 100,
        currency: "eur" as any,
        description: "Minimal test",
      };

      const result = invoiceUtils.validateCreateInvoiceRequest(minimalRequest);
      expect(result.success).toBe(true);
      expect(result.data?.currency).toBe("EUR"); // Should be transformed to uppercase
      expect(result.data?.description).toBe("Minimal test");
    });

    test("should fail validation for invalid amount", () => {
      const invalidRequest = {
        amount: 0, // Below minimum
        currency: "USD",
        description: "Test",
      } as CreateInvoiceRequest;

      const result = invoiceUtils.validateCreateInvoiceRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        `amount: Too small: expected number to be >0`
      );
    });

    test("should fail validation for non-integer amount", () => {
      const invalidRequest = {
        amount: 10.5,
        currency: "USD",
        description: "Test",
      } as CreateInvoiceRequest;

      const result = invoiceUtils.validateCreateInvoiceRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "amount: Invalid input: expected int, received number"
      );
    });

    test("should fail validation for invalid currency", () => {
      const invalidRequest = {
        amount: 1000,
        currency: "INVALID" as any,
        description: "Test",
      } as CreateInvoiceRequest;

      const result = invoiceUtils.validateCreateInvoiceRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("currency: Invalid currency");
    });

    test("should fail validation for empty description", () => {
      const invalidRequest = {
        amount: 1000,
        currency: "USD",
        description: "",
      } as CreateInvoiceRequest;

      const result = invoiceUtils.validateCreateInvoiceRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("description: description is required");
    });

    test("should fail validation for too long description", () => {
      const invalidRequest = {
        amount: 1000,
        currency: "USD",
        description: "a".repeat(256),
      } as CreateInvoiceRequest;

      const result = invoiceUtils.validateCreateInvoiceRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "description: description must be less than 255 characters"
      );
    });

    test("should trim description whitespace", () => {
      const request: CreateInvoiceRequest = {
        amount: 1000,
        currency: "USD",
        description: "  Test with spaces  ",
      };

      const result = invoiceUtils.validateCreateInvoiceRequest(request);

      expect(result.success).toBe(true);
      expect(result.data?.description).toBe("Test with spaces");
    });

    test("should fail validation for invalid URLs", () => {
      const invalidRequest = {
        amount: 1000,
        currency: "USD",
        description: "Test",
        callback_url: "not-a-url" as any,
      } as CreateInvoiceRequest;

      const result = invoiceUtils.validateCreateInvoiceRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "callback_url: callback_url must be a valid URL"
      );
    });

    test("should fail validation for past expiry date", () => {
      const invalidRequest = {
        amount: 1000,
        currency: "USD",
        description: "Test",
        expired_at: new Date(Date.now() - 86400000), // 24 hours ago
      } as CreateInvoiceRequest;

      const result = invoiceUtils.validateCreateInvoiceRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "expired_at: expired_at must be in the future"
      );
    });

    test("should fail validation for invalid datetime format", () => {
      const invalidRequest = {
        amount: 1000,
        currency: "USD",
        description: "Test",
        expired_at: new Date("invalid-date"),
      } as CreateInvoiceRequest;

      const result = invoiceUtils.validateCreateInvoiceRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "expired_at: Invalid input: expected date, received Date"
      );
    });
  });

  describe("validateBulkCreateRequest", () => {
    test("should validate a valid bulk create request", () => {
      const validRequest: BulkCreateInvoiceRequest = {
        invoices: [
          {
            amount: 1000,
            currency: "USD",
            description: "Invoice 1",
          },
          {
            amount: 2000,
            currency: "EUR",
            description: "Invoice 2",
          },
        ],
      };

      const result = invoiceUtils.validateBulkCreateRequest(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.invoices).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    test("should fail validation for empty invoices array", () => {
      const invalidRequest: BulkCreateInvoiceRequest = {
        invoices: [],
      };

      const result = invoiceUtils.validateBulkCreateRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "invoices: at least one invoice is required"
      );
    });

    test("should fail validation for too many invoices", () => {
      const invalidRequest: BulkCreateInvoiceRequest = {
        invoices: Array(101).fill({
          amount: 1000,
          currency: "USD",
          description: "Test",
        }),
      };

      const result = invoiceUtils.validateBulkCreateRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        `invoices: maximum of ${BulkInvoiceLimit.MAX_BULK_INVOICES} invoices allowed per bulk request`
      );
    });

    test("should provide detailed error messages for invalid invoices", () => {
      const invalidRequest: BulkCreateInvoiceRequest = {
        invoices: [
          {
            amount: 1000,
            currency: "USD",
            description: "Valid invoice",
          },
          {
            amount: 0, // Invalid
            currency: "INVALID" as any, // Invalid
            description: "", // Invalid
          },
        ],
      };

      const result = invoiceUtils.validateBulkCreateRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual([
        "Invoice 2: amount: Too small: expected number to be >0",
        "Invoice 2: amount: Too small: expected number to be >=1",
        "Invoice 2: currency: Invalid currency",
        "Invoice 2: description: description is required",
      ]);
    });
  });

  describe("formatAmount", () => {
    test("should format USD amount correctly", () => {
      const formatted = invoiceUtils.formatAmount(1000, "USD");
      expect(formatted).toBe("10.00 USD");
    });

    test("should format JPY amount correctly", () => {
      const formatted = invoiceUtils.formatAmount(1000, "JPY");
      expect(formatted).toBe("1000 JPY");
    });

    test("should format KWD amount correctly", () => {
      const formatted = invoiceUtils.formatAmount(1000, "KWD");
      expect(formatted).toBe("1.00 KWD");
    });

    test("should format SAR amount correctly", () => {
      const formatted = invoiceUtils.formatAmount(1000, "SAR");
      expect(formatted).toBe("10.00 SAR");
    });

    test("should handle lowercase currency", () => {
      const formatted = invoiceUtils.formatAmount(1000, "USD");
      expect(formatted).toBe("10.00 USD");
    });

    test("should use default divisor for unknown currency", () => {
      const formatted = invoiceUtils.formatAmount(1000, "XYZ" as any);
      expect(formatted).toBe("10.00 XYZ");
    });
  });

  describe("parseAmount", () => {
    test("should parse USD amount correctly", () => {
      const amount = invoiceUtils.parseAmount("10.00", "USD");
      expect(amount).toBe(1000);
    });

    test("should parse JPY amount correctly", () => {
      const amount = invoiceUtils.parseAmount("1000", "JPY");
      expect(amount).toBe(1000);
    });

    test("should parse KWD amount correctly", () => {
      const amount = invoiceUtils.parseAmount("1.00", "KWD");
      expect(amount).toBe(1000);
    });

    test("should handle formatted strings with currency symbols", () => {
      const amount = invoiceUtils.parseAmount("$10.50", "USD");
      expect(amount).toBe(1050);
    });

    test("should round to nearest integer", () => {
      const amount = invoiceUtils.parseAmount("10.555", "USD");
      expect(amount).toBe(1056);
    });
  });

  describe("isInvoiceFinal", () => {
    test("should return true for final statuses", () => {
      const finalStatuses: InvoiceStatus[] = [
        InvoiceStatus.PAID,
        InvoiceStatus.CANCELED,
        InvoiceStatus.EXPIRED,
        InvoiceStatus.VOIDED,
      ];

      finalStatuses.forEach(status => {
        expect(invoiceUtils.isInvoiceFinal(status)).toBe(true);
      });
    });

    test("should return false for non-final statuses", () => {
      const nonFinalStatuses: InvoiceStatus[] = [
        InvoiceStatus.INITIATED,
        InvoiceStatus.FAILED,
      ];

      nonFinalStatuses.forEach(status => {
        expect(invoiceUtils.isInvoiceFinal(status)).toBe(false);
      });
    });
  });

  describe("canCancelInvoice", () => {
    test("should return true for cancelable statuses", () => {
      const cancelableInvoice: Invoice = {
        ...invoiceTemplate,
      };

      expect(invoiceUtils.canCancelInvoice(cancelableInvoice)).toBe(true);

      cancelableInvoice.status = InvoiceStatus.FAILED;
      expect(invoiceUtils.canCancelInvoice(cancelableInvoice)).toBe(true);
    });

    test("should return false for non-cancelable statuses", () => {
      const nonCancelableInvoice: Invoice = {
        ...invoiceTemplate,
        status: InvoiceStatus.PAID,
      };

      expect(invoiceUtils.canCancelInvoice(nonCancelableInvoice)).toBe(false);
    });
  });

  describe("isInvoiceExpired", () => {
    test("should return false when no expiry date", () => {
      const invoice: Invoice = {
        ...invoiceTemplate,
      };

      expect(invoiceUtils.isInvoiceExpired(invoice)).toBe(false);
    });

    test("should return true when expired", () => {
      const invoice: Invoice = {
        ...invoiceTemplate,
        expired_at: new Date(Date.now() - 86400000), // 24 hours ago
      };

      expect(invoiceUtils.isInvoiceExpired(invoice)).toBe(true);
    });

    test("should return false when not expired", () => {
      const invoice: Invoice = {
        ...invoiceTemplate,
        expired_at: new Date(Date.now() + 86400000), // 24 hours from now
      };

      expect(invoiceUtils.isInvoiceExpired(invoice)).toBe(false);
    });
  });

  describe("getTimeUntilExpiry", () => {
    test("should return null when no expiry date", () => {
      const invoice: Invoice = {
        ...invoiceTemplate,
      };

      expect(invoiceUtils.getTimeUntilExpiry(invoice)).toBeNull();
    });

    test("should return 0 when expired", () => {
      const invoice: Invoice = {
        ...invoiceTemplate,
        expired_at: new Date(Date.now() - 86400000),
      };

      expect(invoiceUtils.getTimeUntilExpiry(invoice)).toBe(0);
    });

    test("should return positive number when not expired", () => {
      const futureTime = Date.now() + 86400000;
      const invoice: Invoice = {
        ...invoiceTemplate,
        expired_at: new Date(futureTime),
      };

      const timeUntilExpiry = invoiceUtils.getTimeUntilExpiry(invoice);
      expect(timeUntilExpiry).toBeGreaterThan(0);
      expect(timeUntilExpiry).toBeLessThanOrEqual(86400000);
    });
  });

  describe("getPaymentSummary", () => {
    test("should calculate payment summary correctly", () => {
      const detailedInvoice: DetailedInvoice = {
        ...invoiceTemplate,
        status: InvoiceStatus.PAID,
        amount: 3000,
        currency: "USD",
        amount_format: "30.00 USD",
        payments: [
          {
            ...paymentTemplate,
            id: "p1",
            status: PaymentStatus.PAID,
            amount: 1000,
            refunded: 100,
            created_at: new Date(),
          },
          {
            ...paymentTemplate,
            id: "p2",
            status: PaymentStatus.PAID,
            amount: 2000,
            refunded: 0,
            created_at: new Date(),
          },
          {
            ...paymentTemplate,
            id: "p3",
            status: PaymentStatus.FAILED,
            amount: 500,
            refunded: 0,
            created_at: new Date(),
          },
          {
            ...paymentTemplate,
            id: "p4",
            status: PaymentStatus.INITIATED,
            amount: 300,
            refunded: 0,
            created_at: new Date(),
          },
        ],
      };

      const summary = invoiceUtils.getPaymentSummary(detailedInvoice);

      expect(summary.total).toBe(4);
      expect(summary.paid).toBe(2);
      expect(summary.failed).toBe(1);
      expect(summary.pending).toBe(1);
      expect(summary.totalAmount).toBe(3800);
      expect(summary.paidAmount).toBe(3000);
      expect(summary.refundedAmount).toBe(100);
    });

    test("should handle empty payments array", () => {
      const detailedInvoice: DetailedInvoice = {
        ...invoiceTemplate,
        payments: [],
      };

      const summary = invoiceUtils.getPaymentSummary(detailedInvoice);

      expect(summary.total).toBe(0);
      expect(summary.paid).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.pending).toBe(0);
      expect(summary.totalAmount).toBe(0);
      expect(summary.paidAmount).toBe(0);
      expect(summary.refundedAmount).toBe(0);
    });
  });

  describe("buildMetadataQuery", () => {
    test("should build metadata query parameters", () => {
      const metadata = {
        orderId: "12345",
        userId: "user123",
        campaign: "summer2023",
      };

      const query = invoiceUtils.buildMetadataQuery(metadata);

      expect(query).toEqual({
        "metadata[orderId]": "12345",
        "metadata[userId]": "user123",
        "metadata[campaign]": "summer2023",
      });
    });

    test("should handle empty metadata", () => {
      const query = invoiceUtils.buildMetadataQuery({});
      expect(query).toEqual({});
    });
  });

  describe("sanitizeDescription", () => {
    test("should trim whitespace", () => {
      const description = "  Test description  ";
      const sanitized = invoiceUtils.sanitizeDescription(description);
      expect(sanitized).toBe("Test description");
    });

    test("should truncate to 255 characters", () => {
      const longDescription = "a".repeat(300);
      const sanitized = invoiceUtils.sanitizeDescription(longDescription);
      expect(sanitized).toHaveLength(255);
      expect(sanitized).toBe("a".repeat(255));
    });

    test("should handle normal length description", () => {
      const description = "Normal description";
      const sanitized = invoiceUtils.sanitizeDescription(description);
      expect(sanitized).toBe("Normal description");
    });
  });

  describe("generateReference", () => {
    test("should generate reference with default prefix", () => {
      const reference = invoiceUtils.generateReference();
      expect(reference).toMatch(/^INV-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    test("should generate reference with custom prefix", () => {
      const reference = invoiceUtils.generateReference("ORDER");
      expect(reference).toMatch(/^ORDER-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    test("should generate unique references", () => {
      const ref1 = invoiceUtils.generateReference();
      const ref2 = invoiceUtils.generateReference();
      expect(ref1).not.toBe(ref2);
    });
  });

  describe("parseCreateInvoiceRequest", () => {
    test("should parse and validate unknown input", () => {
      const unknownInput = {
        amount: 1000,
        currency: "USD",
        description: "Test",
      };

      const result = invoiceUtils.parseCreateInvoiceRequest(unknownInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test("should handle invalid unknown input", () => {
      const unknownInput = {
        amount: "invalid",
        currency: "USD",
        description: "Test",
      };

      const result = invoiceUtils.parseCreateInvoiceRequest(unknownInput);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("parseBulkCreateRequest", () => {
    test("should parse and validate unknown bulk input", () => {
      const unknownInput = {
        invoices: [
          {
            amount: 1000,
            currency: "USD",
            description: "Test 1",
          },
          {
            amount: 2000,
            currency: "EUR",
            description: "Test 2",
          },
        ],
      };

      const result = invoiceUtils.parseBulkCreateRequest(unknownInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test("should handle invalid unknown bulk input", () => {
      const unknownInput = {
        invoices: "not an array",
      };

      const result = invoiceUtils.parseBulkCreateRequest(unknownInput);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Edge cases and error handling", () => {
    test("should handle null/undefined inputs gracefully", () => {
      expect(() => {
        invoiceUtils.validateCreateInvoiceRequest(null as any);
      }).not.toThrow();

      expect(() => {
        invoiceUtils.validateBulkCreateRequest(undefined as any);
      }).not.toThrow();
    });

    test("should handle malformed objects", () => {
      const malformedRequest = {
        amount: "1000",
        currency: 123,
        description: null,
      };

      const result = invoiceUtils.validateCreateInvoiceRequest(
        malformedRequest as any
      );
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("should handle extremely large numbers", () => {
      const request = {
        amount: Number.MAX_SAFE_INTEGER,
        currency: "USD",
        description: "Large amount test",
      };

      const result = invoiceUtils.validateCreateInvoiceRequest(request as any);
      expect(result.success).toBe(true);
    });

    test("should handle special characters in description", () => {
      const request = {
        amount: 1000,
        currency: "USD",
        description: "Test with émojis 🎉 and spëcial chars & symbols!",
      };

      const result = invoiceUtils.validateCreateInvoiceRequest(request as any);
      expect(result.success).toBe(true);
      expect(result.data?.description).toBe(
        "Test with émojis 🎉 and spëcial chars & symbols!"
      );
    });
  });
});
