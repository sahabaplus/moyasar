import { z } from "zod";
import { type CurrencyType } from "@types";
import { PaymentSource, CardScheme, CardType, PaymentStatus } from "../enums";
import {
  type CapturePaymentRequest,
  type CreateGooglePayPaymentSource,
  type CreateApplePayPaymentSource,
  type CreateSamsungPayPaymentSource,
  type CreatePaymentRequest,
  type CreateStcPayPaymentSource,
  type CreateTokenPaymentSource,
  type UpdatePaymentRequest,
  type RefundPaymentRequest,
  type WalletPaymentSource,
  type StcPaySource,
  type Payment,
  type CreateCreditCardPaymentSource,
  type BasePaymentSource,
  type CreditCardSource,
  type ListPaymentsResponse,
} from "../types";
import type { AllKeys } from "@types";

import {
  amountSchema,
  currencySchema,
  paginationMetaSchema,
} from "@validation";
import { PaymentValidation } from "../constants";

const BasePaymentSourceSchema = z.object({
  type: z.enum(PaymentSource),
  company: z.enum(CardScheme).nullable(),
  name: z.string().nullable(),
  number: z.string(),
  gateway_id: z.string(),
  message: z.string().nullable(),
  reference_number: z.string().nullable(),
  token: z.string().nullable().optional(),
  response_code: z.string().optional(),
  authorization_code: z
    .string()
    .regex(PaymentValidation.AUTH_CODE_REGEX)
    .optional(),
  issuer_name: z.string().optional(),
  issuer_country: z.string().optional(),
  issuer_card_type: z.enum(CardType).optional(),
  issuer_card_category: z.string().optional(),
} satisfies AllKeys<BasePaymentSource>);

// Zod schemas for validation and parsing
const CreditCardSourceResponseSchema = z.object({
  ...BasePaymentSourceSchema.shape,
  type: z.literal(PaymentSource.CREDITCARD),
  transaction_url: z.url().nullable(),
} satisfies AllKeys<CreditCardSource>);

const WalletPaymentSourceResponseSchema = z.object({
  ...BasePaymentSourceSchema.shape,
  type: z.enum([
    PaymentSource.APPLEPAY,
    PaymentSource.GOOGLEPAY,
    PaymentSource.SAMSUNGPAY,
  ]),
  dpan: z.string().optional(),
} satisfies AllKeys<WalletPaymentSource>);

const StcPaySourceResponseSchema = z.object({
  type: z.literal(PaymentSource.STCPAY),
  mobile: z.string().regex(PaymentValidation.SAUDI_MOBILE_REGEX),
  reference_number: z.string().optional(),
  cashier_id: z.string().optional(),
  branch: z.string().optional(),
  transaction_url: z.url().nullable(),
  message: z.string(),
} satisfies AllKeys<StcPaySource>);

const PaymentSourceResponseSchema = z.discriminatedUnion("type", [
  CreditCardSourceResponseSchema,
  WalletPaymentSourceResponseSchema,
  StcPaySourceResponseSchema,
]);
// z.discriminatedUnion("type", [
//   CreditCardSourceResponseSchema,
//   WalletPaymentSourceResponseSchema,
//   StcPaySourceResponseSchema,
// ]);

export const PaymentSchema = z.object({
  id: z.string(),
  status: z.enum(PaymentStatus),
  amount: amountSchema,
  fee: z.number().int().min(0),
  currency: currencySchema,
  refunded: z.number().int().min(0),
  refunded_at: z.coerce.date().nullable(),
  captured: z.number().int().min(0),
  captured_at: z.coerce.date().nullable(),
  voided_at: z.coerce.date().nullable(),
  description: z.string(),
  amount_format: z
    .string()
    .transform(val => val as `${number} ${CurrencyType}`),
  fee_format: z.string().transform(val => val as `${number} ${CurrencyType}`),
  refunded_format: z
    .string()
    .transform(val => val as `${number} ${CurrencyType}`),
  captured_format: z
    .string()
    .transform(val => val as `${number} ${CurrencyType}`),
  invoice_id: z.string().nullable(),
  ip: z.ipv4().nullable(),
  callback_url: z.url().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  metadata: z.record(z.string(), z.string()).nullable(),
  source: PaymentSourceResponseSchema,
} satisfies AllKeys<Payment>);

const CreditCardSourceSchema = z.object({
  type: z.literal(PaymentSource.CREDITCARD),
  name: z
    .string()
    .min(1, "Name is required")
    .max(PaymentValidation.DESCRIPTION_MAX_LENGTH)
    .refine(val => val.trim().split(" ").length >= 2, {
      message: "Card holder name must be at least two words",
    })
    .transform(val => val.trim()),
  number: z.string().regex(/^\d{16,19}$/, "Card number must be 16-19 digits"),
  month: z
    .number()
    .int("Month must be an integer")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  year: z
    .number()
    .int("Year must be an integer")
    .min(new Date().getFullYear(), "Year cannot be in the past"),
  cvc: z.string().regex(/^\d{3,4}$/, "CVC must be 3-4 digits"),
  statement_descriptor: z
    .string()
    .max(PaymentValidation.STATEMENT_DESCRIPTOR_MAX_LENGTH)
    .optional(),
  "3ds": z.boolean().optional(),
  manual: z.boolean().optional(),
  save_card: z.boolean().optional(),
} satisfies AllKeys<CreateCreditCardPaymentSource>);

const TokenSourceSchema = z.object({
  type: z.literal(PaymentSource.TOKEN),
  token: z.string().regex(/^token_/, "Token must start with 'token_'"),
  cvc: z
    .string()
    .regex(/^\d{3,4}$/, "CVC must be 3-4 digits")
    .optional(),
  statement_descriptor: z
    .string()
    .max(PaymentValidation.STATEMENT_DESCRIPTOR_MAX_LENGTH)
    .optional(),
  "3ds": z.boolean().optional(),
  manual: z.boolean().optional(),
} satisfies AllKeys<CreateTokenPaymentSource>);

const GooglePaySourceSchema = z.object({
  type: z.literal(PaymentSource.GOOGLEPAY),
  token: z.string().optional(),
  manual: z.boolean().optional(),
  save_card: z.boolean().optional(),
  statement_descriptor: z
    .string()
    .max(PaymentValidation.STATEMENT_DESCRIPTOR_MAX_LENGTH)
    .optional(),
} satisfies AllKeys<CreateGooglePayPaymentSource>);

const ApplePaySourceSchema = z.object({
  type: z.literal(PaymentSource.APPLEPAY),
  token: z.string(),
  manual: z.boolean().optional(),
  save_card: z.boolean().optional(),
  statement_descriptor: z
    .string()
    .max(PaymentValidation.STATEMENT_DESCRIPTOR_MAX_LENGTH)
    .optional(),
} satisfies AllKeys<CreateApplePayPaymentSource>);

const SamsungPaySourceSchema = z.object({
  type: z.literal(PaymentSource.SAMSUNGPAY),
  token: z.string(),
  manual: z.boolean().optional(),
  save_card: z.boolean().optional(),
  statement_descriptor: z
    .string()
    .max(PaymentValidation.STATEMENT_DESCRIPTOR_MAX_LENGTH)
    .optional(),
} satisfies AllKeys<CreateSamsungPayPaymentSource>);

const StcPaySourceSchema = z.object({
  type: z.literal(PaymentSource.STCPAY),
  mobile: z
    .string()
    .regex(
      PaymentValidation.SAUDI_MOBILE_REGEX,
      "Invalid Saudi mobile number format"
    ),
  cashier_id: z.string().optional(),
  branch: z.string().optional(),
} satisfies AllKeys<CreateStcPayPaymentSource>);

const CreatePaymentSourceSchema = z.discriminatedUnion("type", [
  CreditCardSourceSchema,
  TokenSourceSchema,
  GooglePaySourceSchema,
  ApplePaySourceSchema,
  SamsungPaySourceSchema,
  StcPaySourceSchema,
]);

export const CreatePaymentSchema = z.object({
  given_id: z.uuid("ID must be a valid UUID").optional(),
  amount: amountSchema,
  currency: currencySchema,
  description: z
    .string()
    .min(1, "Description is required")
    .max(
      PaymentValidation.DESCRIPTION_MAX_LENGTH,
      `Description must be less than ${PaymentValidation.DESCRIPTION_MAX_LENGTH} characters`
    )
    .transform(val => val.trim()),
  callback_url: z.url("Callback URL must be a valid URL"),
  source: CreatePaymentSourceSchema,
  metadata: z.record(z.string(), z.string()).optional(),
  apply_coupon: z.boolean().optional(),
} satisfies AllKeys<CreatePaymentRequest>);

export const UpdatePaymentSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(PaymentValidation.DESCRIPTION_MAX_LENGTH)
    .transform(val => val.trim())
    .optional(),
  metadata: z.record(z.string(), z.string()).optional(),
} satisfies AllKeys<UpdatePaymentRequest>);

export const RefundPaymentSchema = z.object({
  amount: amountSchema.optional(),
} satisfies AllKeys<RefundPaymentRequest>);

export const CapturePaymentSchema = z
  .object({
    amount: amountSchema.optional(),
  } satisfies AllKeys<CapturePaymentRequest>)
  .optional();

export const listPaymentResponseSchema = z.object({
  payments: z.array(z.unknown()),
  meta: paginationMetaSchema,
} satisfies AllKeys<ListPaymentsResponse>);
