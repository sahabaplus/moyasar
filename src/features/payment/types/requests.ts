import type { CurrencyType, HasAmount, HasMetadata, Metadata } from "@types";
import type { PaymentSource } from "@payment";

export interface SaveCard {
  /**
   * ### Generate a token for the card that can be used for future payments.
   *
   * If set to `true`, a token will be generated and returned along the payment response in `source.token`. This allows the merchant to use the token later for future payments.
   * This requires Tokenization feature to be enabled for the merchant.
   * @default false
   * @see https://docs.moyasar.com/api/payments/01-create-payment#request
   */
  save_card?: boolean | undefined;
}

export interface Manual {
  /**
   * ### Capture payment manually
   * @description Controls if the payment is authorized only **without capturing**. If the payment succeeds, the status will be set to `authorized`.
   * @default false
   * @see https://docs.moyasar.com/api/payments/01-create-payment#request
   */
  manual?: boolean | undefined;
}

export interface CreatePaymentSourceBase {
  /**
   * ### Payment source type
   * @type {PaymentSource}
   * @see https://docs.moyasar.com/api/payments/01-create-payment#request
   */
  type: PaymentSource;
}

export interface CreateCreditCardPaymentSource extends SaveCard, Manual {
  type: typeof PaymentSource.CREDITCARD;
  name: string;
  number: string;
  month: number;
  year: number;
  cvc: string;
  statement_descriptor?: string | undefined;
  "3ds"?: boolean | undefined;
}

export interface CreateTokenPaymentSource extends Manual {
  type: typeof PaymentSource.TOKEN;
  /**
   * @description Value must match regular expression ^token_
   * @see https://docs.moyasar.com/api/payments/01-create-payment#request
   */
  token: string;
  cvc?: string | undefined;
  statement_descriptor?: string | undefined;
  "3ds"?: boolean | undefined;
}

export interface WalletPaymentSource extends Manual, SaveCard {}

export interface CreateGooglePayPaymentSource extends WalletPaymentSource {
  type: typeof PaymentSource.GOOGLEPAY;
  token?: string | undefined;
  statement_descriptor?: string | undefined;
}

export interface CreateApplePayPaymentSource extends WalletPaymentSource {
  type: typeof PaymentSource.APPLEPAY;
  token: string;
  statement_descriptor?: string | undefined;
}

export interface CreateSamsungPayPaymentSource extends WalletPaymentSource {
  type: typeof PaymentSource.SAMSUNGPAY;
  token: string;
  statement_descriptor?: string | undefined;
}

export interface CreateStcPayPaymentSource {
  type: typeof PaymentSource.STCPAY;
  mobile: string;
  cashier_id?: string | undefined;
  branch?: string | undefined;
}

export type CreatePaymentSource = CreatePaymentSourceBase &
  (
    | CreateCreditCardPaymentSource
    | CreateTokenPaymentSource
    | CreateGooglePayPaymentSource
    | CreateApplePayPaymentSource
    | CreateSamsungPayPaymentSource
    | CreateStcPayPaymentSource
  );

export interface CreatePaymentRequest<T extends object = Metadata>
  extends HasAmount,
    HasMetadata<T> {
  /**
   * @description A UUID (v4 is recommended) that you generate from your side and attach it with the payment creation request to support idempotency. It is going be the ID of the created payment.
   * @see https://docs.moyasar.com/api/idempotency/
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   */
  given_id?: string | undefined;
  currency: CurrencyType;
  /**
   * @description Human readable description for the payment. This is shown to the merchant only and is not shown to the payer.
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   */
  description: string;
  callback_url: string;
  source: CreatePaymentSource;
  apply_coupon?: boolean | undefined;
}

export interface UpdatePaymentRequest<T extends object = Metadata>
  extends HasMetadata<Partial<T>> {
  description?: string | undefined;
}

export interface RefundPaymentRequest {
  /**
   * @description An optional amount for the capture process, less than or equal to the authorized amount. If this field is missing, then the full amount will be captured.
   * @see https://docs.moyasar.com/api/payments/05-refund-payment#request
   */
  amount?: number; // Optional partial refund amount | undefined
}

export interface CapturePaymentRequest {
  /**
   * @description An optional amount for the capture process, less than or equal to the authorized amount. If this field is missing, then the full amount will be captured.
   * @see https://docs.moyasar.com/api/payments/06-capture-payment#request
   */
  amount?: number; // Optional partial capture amount | undefined
}
