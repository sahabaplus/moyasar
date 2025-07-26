export const WebhookEvent = {
  /**
   * ## Initiated
   * First status of a payment. It indicates that the payment has been created but the cardholder did not pay yet.
   * @hint If the payment is initiated then you need to complete the payment transaction by completing the payment challenge found in `Payment.source.transaction_url` depending on the payment source type.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=initiated
   */
  PAYOUT_INITIATED: "payout_initiated",
  /**
   * ## Payment Paid
   * Payment reaches this status when the cardholder pays successfully.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=paid
   */
  PAYMENT_PAID: "payment_paid",
  /**
   * ## Payment Failed
   * Payment reaches this status when the cardholder or merchant has a certain error that caused the payment to fail (errors are attached to the `message` attribute).
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=failed
   */
  PAYMENT_FAILED: "payment_failed",
  /**
   * ## Payment Authorized
   * Payment reaches this status when the merchant authorizes it to be manually captured anytime later —the cardholder is not charged yet.
   * @note The status authorized is used when a scheme payment is made with `manual: true` option which will cause the system to authorize the payment only without capturing it. The merchant must capture the payment within time it will be voided automatically by the issuer.
   * @note Please note that when an issuer voids the payment, the status will be kept authorized and **WILL NOT BE updated by the system**.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=authorized
   * @see https://docs.moyasar.com/api/payments/01-create-payment#responses
   */
  PAYMENT_AUTHORIZED: "payment_authorized",
  /**
   * ## Payment Captured
   * Payment reaches this status when the cardholder of an authorized payment is charged successfully.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=captured
   */
  PAYMENT_CAPTURED: "payment_captured",
  /**
   * ## Payment Refunded
   * Payment reaches this status when the merchant refunds a paid or captured payment successfully.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=refunded
   */
  PAYMENT_REFUNDED: "payment_refunded",
  /**
   * ## Payment Voided
   * Payment reaches this status when the merchant cancels a paid, authorized, or captured payment. It works only if the amount is not settled yet in the merchant’s bank account.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=voided
   */
  PAYMENT_VOIDED: "payment_voided",
  /**
   * ## Payment Verified
   * Payment reaches this status when the cardholder verifies his card in the tokenization process.
   * @see https://docs.moyasar.com/api/payments/payment-status-reference?_highlight=verified
   */
  PAYMENT_VERIFIED: "payment_verified",
  PAYMENT_ABANDONED: "payment_abandoned",
  PAYMENT_CANCELED: "payment_canceled",
  PAYMENT_EXPIRED: "payment_expired",
  /**
   * ## Balance Transferred
   * When a settlement is created and sent to the merchant bank account, Moyasar will send a webhook notification to the merchant
   * @see https://docs.moyasar.com/guides/settlements/settlement-notification/#:~:text=Make%20sure%20to%20selected%20the%20balance_transferred%20event
   */
  BALANCE_TRANSFERRED: "balance_transferred",
  PAYOUT_PAID: "payout_paid",
  PAYOUT_FAILED: "payout_failed",
  PAYOUT_CANCELED: "payout_canceled",
  PAYOUT_RETURNED: "payout_returned",
} as const;

export type WebhookEvent = (typeof WebhookEvent)[keyof typeof WebhookEvent];

export const ALL_WEBHOOK_EVENTS = Object.values(WebhookEvent);

export const WebhookHttpMethod = {
  POST: "post",
  PUT: "put",
  PATCH: "patch",
} as const;

export type WebhookHttpMethod =
  (typeof WebhookHttpMethod)[keyof typeof WebhookHttpMethod];
