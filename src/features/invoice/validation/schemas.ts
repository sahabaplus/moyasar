import { z } from "zod";
import { type AllKeys, type CurrencyType, Currency } from "@types";
import { InvoiceStatus } from "../enums";
import type {
  BulkCreateInvoiceRequest,
  CreateInvoiceRequest,
  Invoice,
} from "../types";
import { BulkInvoiceLimit } from "../constants";
import { amountSchema } from "@validation";

export const CreateInvoiceSchema = z.object({
  amount: amountSchema,

  currency: z
    .string()
    .transform(val => val.toUpperCase() as CurrencyType)
    .refine(val => Object.values(Currency).includes(val as CurrencyType), {
      message: "Invalid currency",
    }),

  description: z
    .string()
    .min(1, "description is required")
    .max(255, "description must be less than 255 characters")
    .transform(val => val.trim()),

  callback_url: z.url("callback_url must be a valid URL").optional(),
  success_url: z.url("success_url must be a valid URL").optional(),
  back_url: z.url("back_url must be a valid URL").optional(),
  expired_at: z.coerce
    .date()
    .refine(
      date => new Date(date) > new Date(),
      "expired_at must be in the future"
    )
    .optional(),

  metadata: z.record(z.string(), z.string()).optional(),
} satisfies AllKeys<CreateInvoiceRequest>);

export const BulkCreateInvoiceSchema = z.object({
  invoices: z
    .array(CreateInvoiceSchema)
    .min(1, "at least one invoice is required")
    .max(
      BulkInvoiceLimit.MAX_BULK_INVOICES,
      `maximum of ${BulkInvoiceLimit.MAX_BULK_INVOICES} invoices allowed per bulk request`
    ),
} satisfies AllKeys<BulkCreateInvoiceRequest>);

export const invoiceSchema = z.object({
  id: z.string(),
  status: z.enum(InvoiceStatus),
  amount: amountSchema,
  currency: z.enum(Currency),
  description: z.string(),
  logo_url: z
    .url("logo_url must be a valid URL")
    .transform(val => val as `https://${string}`),
  callback_url: z
    .url("callback_url must be a valid URL")
    .transform(val => val as `https://${string}`)
    .optional(),
  success_url: z
    .url("success_url must be a valid URL")
    .transform(val => val as `https://${string}`)
    .optional(),
  back_url: z
    .url("back_url must be a valid URL")
    .transform(val => val as `https://${string}`)
    .optional(),
  expired_at: z.coerce.date().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  metadata: z.record(z.string(), z.string()).optional(),
  amount_format: z
    .string()
    .transform(val => val as `${number} ${CurrencyType}`),
  url: z
    .url("url must be a valid URL")
    .transform(val => val as `https://${string}`),
} satisfies AllKeys<Invoice>);
