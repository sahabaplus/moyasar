export const PaymentLimits = {
  MIN_AMOUNT: 50, // Minimum payment amount in smallest currency unit
  MAX_AMOUNT: 100000000, // Maximum payment amount (100M in smallest unit)
  REFUND_TIMEOUT_DAYS: 30, // Days after which refunds are not allowed
  CAPTURE_TIMEOUT_DAYS: 7, // Days after which authorized payments are auto-voided
} as const;

export const PaymentValidation = {
  DESCRIPTION_MAX_LENGTH: 255,
  STATEMENT_DESCRIPTOR_MAX_LENGTH: 255,
  CARD_NUMBER_MIN_LENGTH: 16,
  CARD_NUMBER_MAX_LENGTH: 19,
  CVV_LENGTH: 3,
  AMEX_CVV_LENGTH: 4,
  SAUDI_MOBILE_REGEX: /^(0|(00|\+)?966)?(5\d{8})$/,
  RRN_REGEX: /^\d{12}$/,
  AUTH_CODE_REGEX: /^\d{6}$/,
  CARD_LAST_DIGITS_REGEX: /^\d{4}$/,
} as const;
