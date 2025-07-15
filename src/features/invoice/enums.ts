export const InvoiceStatus = {
  INITIATED: "initiated",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELED: "canceled",
  ON_HOLD: "on_hold",
  EXPIRED: "expired",
  VOIDED: "voided",
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const ALL_INVOICE_STATUSES = Object.values(InvoiceStatus);
