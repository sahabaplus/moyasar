/**
 * @description Indicates the payment status. If the payment is in the initiated status, then an action must be taken (e.g. 3DS challenge) in order to complete the payment. The status authorized is used when a scheme payment is made with manual: true option which will cause the system to authorize the payment only without capturing it. The merchant must capture the payment within time it will be voided automatically by the issuer.
 * @note Please note that when an issuer voids the payment, the status will be kept authorized and WILL NOT BE updated by the system.
 * @values `initiated`, `paid`, `authorized`, `failed`, `refunded`, `captured`, `voided`, `verified`
 * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
 */
export const PaymentStatus = {
  /**
   * @description If the payment is initiated then you need to complete the payment transaction by completing the payment challenge found in `Payment.source.transaction_url` depending on the payment source type.
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   */
  INITIATED: "initiated",
  PAID: "paid",
  /**
   * @description The status authorized is used when a scheme payment is made with manual: true option which will cause the system to authorize the payment only without capturing it. The merchant must capture the payment within time it will be voided automatically by the issuer. Please note that when an issuer voids the payment, the status will be kept authorized and WILL NOT BE updated by the system.
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   */
  AUTHORIZED: "authorized",
  FAILED: "failed",
  REFUNDED: "refunded",
  CAPTURED: "captured",
  VOIDED: "voided",
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
