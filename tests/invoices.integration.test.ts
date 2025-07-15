import {
  InvoiceError,
  MoyasarClient,
  type CreateInvoiceRequest,
} from "@/index";
import { MoyasarError } from "../src/shared/errors";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

describe("Invoice Testing", async () => {
  const client = new MoyasarClient({
    apiKey: process.env.MOYASAR_API_KEY!,
  });
  describe("Create/Retrieve/Update/Cancel an invoice", async () => {
    const createInvoiceReq: CreateInvoiceRequest = {
      amount: 3000,
      currency: "SAR",
      description: "the payment",
      metadata: {
        user_id: "1234567890",
      },
    };
    const createdInvoice = client.invoice.create(createInvoiceReq);
    it("Should create an invoice", () => {
      expect(createdInvoice).resolves.toBeDefined();
    });

    const invoice = await createdInvoice;
    it("Should contain the right data", () => {
      expect(invoice.description).toBe(createInvoiceReq.description);
      expect(invoice.amount).toBe(createInvoiceReq.amount);
      expect(invoice.currency).toBe(createInvoiceReq.currency);
      expect(invoice.metadata?.["user_id"]).toBe(
        createInvoiceReq.metadata?.["user_id"]
      );
      expect(invoice.payments).toHaveLength(0);
    });

    it(`Should retrieve the invoice ${invoice.id}`, async () => {
      const retrievedInvoice = await client.invoice.retrieve(invoice.id);

      expect(retrievedInvoice.metadata).toHaveProperty("user_id");
      expect(retrievedInvoice.metadata?.["user_id"]).toBe("1234567890");
    });
    it(`Should update the invoice ${invoice.id}`, async () => {
      const updatedInvoice = await client.invoice.update(invoice.id, {
        metadata: {
          new_prop: "cool",
          user_id: "ABCDEFGHIJKLMNOP",
        },
      });

      expect(updatedInvoice.metadata).toHaveProperty("user_id");
      expect(updatedInvoice.metadata).toHaveProperty("new_prop");
      expect(updatedInvoice.metadata?.["user_id"]).toBe("ABCDEFGHIJKLMNOP");
      expect(updatedInvoice.metadata?.["new_prop"]).toBe("cool");
    });

    it(`Should cancel the invoice ${invoice.id}`, async () => {
      const canceledInvoice = await client.invoice.cancel(invoice.id);

      expect(canceledInvoice.status === "canceled").toBe(true);
    });

    it(`Should fail canceling already canceled invoice ${invoice.id}`, async () => {
      const cancelingReq = client.invoice.cancel(invoice.id);
      expect(cancelingReq).rejects.toThrow();
      expect(cancelingReq).rejects.toThrow(MoyasarError);
      expect(cancelingReq).rejects.toThrow(InvoiceError);
    });
  });
});
