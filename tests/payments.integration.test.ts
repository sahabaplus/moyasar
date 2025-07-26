import { MoyasarClient } from "@/index";
import { PaymentSource, PaymentError } from "@payment";
import { MoyasarError } from "@errors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import z from "zod";

dotenv.config({ path: ".env" });

describe("Payment Testing", async () => {
  const client = new MoyasarClient({
    apiKey: process.env.MOYASAR_API_KEY!,
    metadataValidator: z.object({
      app: z.enum(["ios", "android"]),
      user_id: z.string(),
      test_payment: z.string(),
      new_prop: z.string().optional(),
    }),
  });

  describe("Create/Retrieve/Update/Refund/Capture/Void a payment", async () => {
    const createPaymentReq: Parameters<typeof client.payment.create>[0] = {
      amount: 5000,
      currency: "SAR",
      description: "Test payment for integration testing",
      callback_url: "https://example.com/callback",
      source: {
        type: PaymentSource.CREDITCARD,
        name: "Test User",
        number: "4111111111111111", // Test card number
        month: 12,
        year: 2025,
        cvc: "123",
        statement_descriptor: "Test Payment",
      },
      metadata: {
        // @ts-expect-error - This should trigger a type error since this property isn't defined in the metadata schema.
        non_existing_prop: "test",
        user_id: "1234567890",
        test_payment: "true",
        app: "ios",
      },
    };

    const createdPayment = client.payment.create(createPaymentReq);

    it("Should create a payment", () => {
      expect(createdPayment).resolves.toBeDefined();
    });

    const payment = await createdPayment;

    it("Should contain the right data", () => {
      expect(payment.description).toBe(createPaymentReq.description);
      expect(payment.amount).toBe(createPaymentReq.amount);
      expect(payment.currency).toBe(createPaymentReq.currency);
      expect(payment.metadata?.["user_id"]).toBe(
        createPaymentReq.metadata?.["user_id"]
      );
      expect(payment.metadata?.["test_payment"]).toBe(
        createPaymentReq.metadata?.["test_payment"]
      );
      expect(payment.source.type).toBe(PaymentSource.CREDITCARD);
    });

    it(`Should retrieve the payment ${payment.id}`, async () => {
      const retrievedPayment = await client.payment.retrieve(payment.id);

      expect(retrievedPayment.id).toBe(payment.id);
      expect(retrievedPayment.metadata).toHaveProperty("user_id");
      expect(retrievedPayment.metadata?.["user_id"]).toBe("1234567890");
      expect(retrievedPayment.metadata?.["test_payment"]).toBe("true");
    });

    it(`Should update the payment ${payment.id}`, async () => {
      const updatedPayment = await client.payment.update({
        paymentId: payment.id,
        update: {
          description: "Updated test payment description",
          metadata: {
            new_prop: "cool",
            user_id: "ABCDEFGHIJKLMNOP",
            test_payment: "true",
          },
        },
      });

      expect(updatedPayment.description).toBe(
        "Updated test payment description"
      );
      expect(updatedPayment.metadata).toHaveProperty("user_id");
      expect(updatedPayment.metadata).toHaveProperty("new_prop");
      expect(updatedPayment.metadata?.["user_id"]).toBe("ABCDEFGHIJKLMNOP");
      expect(updatedPayment.metadata?.["new_prop"]).toBe("cool");
    });

    it(`Should fail to refund the payment ${payment.id} as it is not paid`, async () => {
      const refundedPaymentPromise = client.payment.refund({
        paymentId: payment.id,
        refund: {
          amount: 1000, // Partial refund of 1000 SAR
        },
      });

      expect(refundedPaymentPromise).rejects.toThrow(MoyasarError);
      expect(refundedPaymentPromise).rejects.toThrow(PaymentError);
      try {
        await refundedPaymentPromise;
      } catch (error) {
        expect(error).toBeInstanceOf(PaymentError);
        expect((error as PaymentError).message).toBe(
          `Failed to refund payment ${payment.id}: Only paid or captured payments can be refunded.`
        );
      }
    });
  });

  describe("Payment listing and filtering", async () => {
    it("Should list payments", async () => {
      const payments = await client.payment.list({
        limit: 40,
        page: 1,
      });

      expect(payments.payments).toBeDefined();
      expect(Array.isArray(payments.payments)).toBe(true);
      expect(payments.meta).toBeDefined();
    });

    it("Should get paid payments", async () => {
      const paidPayments = await client.payment.getPaid({
        limit: 40,
      });

      expect(paidPayments.payments).toBeDefined();
      expect(Array.isArray(paidPayments.payments)).toBe(true);
    });

    it("Should get failed payments", async () => {
      const failedPayments = await client.payment.getFailed({
        limit: 40,
      });

      expect(failedPayments.payments).toBeDefined();
      expect(Array.isArray(failedPayments.payments)).toBe(true);
    });

    it("Should get authorized payments", async () => {
      const authorizedPayments = await client.payment.getAuthorized({
        limit: 40,
      });

      expect(authorizedPayments.payments).toBeDefined();
      expect(Array.isArray(authorizedPayments.payments)).toBe(true);
    });

    it("Should get refunded payments", async () => {
      const refundedPayments = await client.payment.getRefunded({
        limit: 40,
      });

      expect(refundedPayments.payments).toBeDefined();
      expect(Array.isArray(refundedPayments.payments)).toBe(true);
    });
  });

  describe("Payment capabilities", async () => {
    const createCapabilitiesPaymentReq: Parameters<
      typeof client.payment.create
    >[0] = {
      amount: 1000,
      currency: "SAR",
      description: "Capabilities test payment",
      callback_url: "https://example.com/callback",
      source: {
        type: PaymentSource.CREDITCARD,
        name: "Capabilities Test User",
        number: "4111111111111111",
        month: 12,
        year: 2025,
        cvc: "123",
      },
      metadata: {
        user_id: "1234567890",
        test_payment: "true",
        app: "ios",
      },
    };

    const createdCapabilitiesPayment = client.payment.create(
      createCapabilitiesPaymentReq
    );

    it("Should create a payment for capabilities testing", () => {
      expect(createdCapabilitiesPayment).resolves.toBeDefined();
    });

    const capabilitiesPayment = await createdCapabilitiesPayment;

    it(`Should get payment capabilities for ${capabilitiesPayment.id}`, async () => {
      const capabilities = await client.payment.getPaymentCapabilities(
        capabilitiesPayment.id
      );

      expect(capabilities).toHaveProperty("canRefund");
      expect(capabilities).toHaveProperty("canCapture");
      expect(capabilities).toHaveProperty("canVoid");
      expect(capabilities).toHaveProperty("maxRefundAmount");
      expect(capabilities).toHaveProperty("maxCaptureAmount");
      expect(typeof capabilities.canRefund).toBe("boolean");
      expect(typeof capabilities.canCapture).toBe("boolean");
      expect(typeof capabilities.canVoid).toBe("boolean");
      expect(typeof capabilities.maxRefundAmount).toBe("number");
      expect(typeof capabilities.maxCaptureAmount).toBe("number");
    });
  });

  describe("Error handling", async () => {
    it("Should fail to retrieve non-existent payment", async () => {
      const nonExistentId = "pay_" + uuidv4();
      const retrieveReq = client.payment.retrieve(nonExistentId);

      expect(retrieveReq).rejects.toThrow();
      expect(retrieveReq).rejects.toThrow(MoyasarError);
      expect(retrieveReq).rejects.toThrow(PaymentError);
    });

    it("Should fail to update non-existent payment", async () => {
      const nonExistentId = "pay_" + uuidv4();
      const updateReq = client.payment.update({
        paymentId: nonExistentId,
        update: {
          description: "This should fail",
        },
      });

      expect(updateReq).rejects.toThrow();
      expect(updateReq).rejects.toThrow(MoyasarError);
      expect(updateReq).rejects.toThrow(PaymentError);
    });

    it("Should fail to refund non-existent payment", async () => {
      const nonExistentId = "pay_" + uuidv4();
      const refundReq = client.payment.refund({
        paymentId: nonExistentId,
        refund: {
          amount: 100,
        },
      });

      expect(refundReq).rejects.toThrow();
      expect(refundReq).rejects.toThrow(MoyasarError);
      expect(refundReq).rejects.toThrow(PaymentError);
    });
  });
});
