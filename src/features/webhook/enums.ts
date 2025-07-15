export const WebhookEvents = {
  PAYMENT_PAID: "payment_paid",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_VOIDED: "payment_voided",
  PAYMENT_AUTHORIZED: "payment_authorized",
  PAYMENT_CAPTURED: "payment_captured",
  PAYMENT_REFUNDED: "payment_refunded",
  PAYMENT_ABANDONED: "payment_abandoned",
  PAYMENT_VERIFIED: "payment_verified",
  PAYMENT_CANCELED: "payment_canceled",
  PAYMENT_EXPIRED: "payment_expired",
  BALANCE_TRANSFERRED: "balance_transferred",
  PAYOUT_INITIATED: "payout_initiated",
  PAYOUT_PAID: "payout_paid",
  PAYOUT_FAILED: "payout_failed",
  PAYOUT_CANCELED: "payout_canceled",
  PAYOUT_RETURNED: "payout_returned",
} as const;

export type WebhookEvents = (typeof WebhookEvents)[keyof typeof WebhookEvents];

export const ALL_WEBHOOK_EVENTS = Object.values(WebhookEvents);

export const WebhookHttpMethods = {
  POST: "post",
  PUT: "put",
  PATCH: "patch",
} as const;
