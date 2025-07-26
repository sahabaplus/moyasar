export * from "./requests";
import type {
  BaseListOptions,
  CurrencyType,
  HasAmount,
  HasMetadata,
  ListResponse,
  Metadata,
} from "@types";
import type {
  CardScheme,
  CardType,
  PaymentSource,
  PaymentStatus,
} from "@payment";

export interface BasePaymentSource {
  type: PaymentSource;
  /**
   * ### Card Schemes
   * - `visa`
   * - `mastercard`
   * - `amex`
   * - `mada`
   *
   * ### Important
   * - `company` is null for wallet payments when token is malformed.
   * - It is guaranteed to be present for successful payments.
   */
  company: CardScheme | null;
  name: string | null; // Always null for Apple Pay
  number: string;
  gateway_id: string;
  message: string | null;
  reference_number: string | null;
  token?: string | null | undefined;
  response_code?: string | undefined;
  authorization_code?: string | undefined;
  issuer_name?: string | undefined;
  /**
   * @description Origin country of the card issuer. A two-letter ISO 3166 code.
   */
  issuer_country?: string | undefined;
  issuer_card_type?: CardType | undefined;
  /**
   * @description Indicates the card category or product type, e.g., Platinum, Signature, etc.
   * This field is a human readable text and does not have a defined set of values.
   */
  issuer_card_category?: string | undefined;
}

export interface CreditCardSource extends BasePaymentSource {
  type: typeof PaymentSource.CREDITCARD;
  transaction_url: string | null;
}

export interface WalletPaymentSource extends BasePaymentSource {
  type:
    | typeof PaymentSource.APPLEPAY
    | typeof PaymentSource.GOOGLEPAY
    | typeof PaymentSource.SAMSUNGPAY;

  /**
   * @description Masked card number showing first six and last four digits.
   */
  dpan?: string | undefined;
}

export interface StcPaySource {
  type: typeof PaymentSource.STCPAY;
  mobile: string;
  reference_number?: string | undefined;
  cashier_id?: string | undefined;
  branch?: string | undefined;
  transaction_url: string | null;
  message: string;
}

export type PaymentSourceUnion =
  | CreditCardSource
  | WalletPaymentSource
  | StcPaySource;

export interface Payment<T extends object = Metadata>
  extends HasAmount,
    HasMetadata<T> {
  /**
   * @description uuid
   * @note if you have set the given_id when creating the payment, it will be returned here.
   * @see https://docs.moyasar.com/api/idempotency
   */
  id: string;
  status: PaymentStatus;
  /**
   * @description Estimated payment fee (including VAT).
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   */
  fee: number;
  currency: CurrencyType;
  /**
   * @description Refunded amount. Less than or equal to the payment amount.
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   */
  refunded: number;
  refunded_at: Date | null;
  captured: number;
  captured_at: Date | null;
  voided_at: Date | null;
  description: string;
  /**
   * @description Formatted payment amount with currency.
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   * @example `1.00 SAR` `100.00 KWD` `100 JPY`
   */
  amount_format: string;
  fee_format: string;
  refunded_format: string;
  captured_format: string;
  /**
   * @description Invoice ID that this payment is used to pay.
   * @see https://docs.moyasar.com/category/invoices-api
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   */
  invoice_id: string | null;
  /**
   * @description Payer IPv4 address. This information is collected from the connection that has created the payment. You must ensure that the payment is created from the client device directly to ensure correct collection of the IP address.
   * @note is null when the payment is created from a token by the system.
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   */
  ip: string | null;
  callback_url?: string | null;
  created_at: Date;
  updated_at: Date;
  source: PaymentSourceUnion;
}

export interface PaymentListOptions<T extends object = Metadata>
  extends BaseListOptions,
    HasMetadata<T> {
  id?: string | undefined;
  status?: PaymentStatus | undefined;
  "created[gt]"?: Date | undefined;
  "created[lt]"?: Date | undefined;
  "updated[gt]"?: Date | undefined;
  "updated[lt]"?: Date | undefined;
  last_4?: string; // Filter by card last 4 digit | undefineds
  rrn?: string; // Filter by RR | undefinedN
}

export interface ListPaymentsResponse<T extends object = Metadata>
  extends ListResponse<Payment<T>> {
  payments: Payment<T>[];
}
