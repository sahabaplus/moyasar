/**
 * @description Indicates the payment status. If the payment is in the initiated status, then an action must be taken (e.g. 3DS challenge) in order to complete the payment. The status authorized is used when a scheme payment is made with manual: true option which will cause the system to authorize the payment only without capturing it. The merchant must capture the payment within time it will be voided automatically by the issuer.
 * @note Please note that when an issuer voids the payment, the status will be kept authorized and WILL NOT BE updated by the system.
 * @values `initiated`, `paid`, `authorized`, `failed`, `refunded`, `captured`, `voided`, `verified`
 * @see https://docs.moyasar.com/api/payments/payment-status-reference
 */
export const PaymentStatus = {
  /**
   * ## Initiated
   * First status of a payment. It indicates that the payment has been created but the cardholder did not pay yet.
   * @hint If the payment is initiated then you need to complete the payment transaction by completing the payment challenge found in `Payment.source.transaction_url` depending on the payment source type.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=initiated
   */
  INITIATED: "initiated",
  /**
   * ## Paid
   * Payment reaches this status when the cardholder pays successfully.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=paid
   */
  PAID: "paid",
  /**
   * ## Failed
   * Payment reaches this status when the cardholder or merchant has a certain error that caused the payment to fail (errors are attached to the `message` attribute).
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=failed
   */
  FAILED: "failed",
  /**
   * ## Authorized
   * Payment reaches this status when the merchant authorizes it to be manually captured anytime later —the cardholder is not charged yet.
   * @note The status authorized is used when a scheme payment is made with `manual: true` option which will cause the system to authorize the payment only without capturing it. The merchant must capture the payment within time it will be voided automatically by the issuer.
   * @note Please note that when an issuer voids the payment, the status will be kept authorized and **WILL NOT BE updated by the system**.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=authorized
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   */
  AUTHORIZED: "authorized",
  /**
   * ## Captured
   * Payment reaches this status when the cardholder of an authorized payment is charged successfully.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=captured
   */
  CAPTURED: "captured",
  /**
   * ## Refunded
   * Payment reaches this status when the merchant refunds a paid or captured payment successfully.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=refunded
   */
  REFUNDED: "refunded",
  /**
   * ## Voided
   * Payment reaches this status when the merchant cancels a paid, authorized, or captured payment. It works only if the amount is not settled yet in the merchant’s bank account.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=voided
   */
  VOIDED: "voided",
  /**
   * ## Verified
   * Payment reaches this status when the cardholder verifies his card in the tokenization process.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=verified
   */
  VERIFIED: "verified",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentSource = {
  CREDITCARD: "creditcard",
  APPLEPAY: "applepay",
  GOOGLEPAY: "googlepay",
  SAMSUNGPAY: "samsungpay",
  STCPAY: "stcpay",
  TOKEN: "token",
} as const;

export type PaymentSource = (typeof PaymentSource)[keyof typeof PaymentSource];

export const CardScheme = {
  MADA: "mada",
  VISA: "visa",
  MASTER: "master",
  AMEX: "amex",
} as const;

export type CardScheme = (typeof CardScheme)[keyof typeof CardScheme];

export const CardType = {
  DEBIT: "debit",
  CREDIT: "credit",
  CHARGE_CARD: "charge_card",
  UNSPECIFIED: "unspecified",
} as const;

export type CardType = (typeof CardType)[keyof typeof CardType];
