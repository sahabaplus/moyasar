export const API_ENDPOINTS = {
  webhooks: "/v1/webhooks",
  webhookAttempts: "/v1/webhooks/attempts",
  availableEvents: "/v1/webhooks/available_events",
  invoices: "/v1/invoices",
  bulkInvoices: "/v1/invoices/bulk",
  payments: "/v1/payments",
  bulkPayments: "/v1/payments/bulk",
} as const;

export const DEFAULT_API_CONFIG = {
  BASE_URL: "https://api.moyasar.com",
  TIMEOUT: 30000,
} as const;
