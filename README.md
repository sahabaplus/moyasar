# Moyasar SDK

A comprehensive TypeScript SDK for integrating with the Moyasar payment gateway. This SDK provides type-safe access to Moyasar's APIs for payments, invoices, and webhook management.

## Features

- 🔒 **Type-safe**: Full TypeScript support with comprehensive type definitions
- 🎯 **Event-driven**: Advanced event system for webhook handling
- 🏗️ **Modular**: Clean architecture with separation of concerns
- 📱 **Multi-platform**: Support for web, mobile wallets (Apple Pay, Google Pay, Samsung Pay), and STC Pay
- 💳 **Payment Methods**: Credit cards, tokenized payments, and digital wallets
- 🧾 **Invoice Management**: Create, update, and manage invoices
- 🔗 **Webhook Support**: Real-time event notifications with built-in validation
- 🧪 **Well-tested**: Comprehensive test suite with high coverage

## Installation

```bash
npm install @sahabaplus/moyasar
```

## Quick Start

```typescript
import { MoyasarClient } from "@sahabaplus/moyasar";

const moyasar = new MoyasarClient({
  apiKey: "sk_your_api_key"
});

// Create a payment
const payment = await moyasar.payment.create({
  amount: 1000, // Amount in smallest currency unit (e.g., halalas for SAR)
  currency: "SAR",
  description: "Test payment",
  callback_url: "https://your-app.com/callback",
  source: {
    type: "creditcard",
    name: "John Doe",
    number: "4111111111111111",
    month: 12,
    year: 2025,
    cvc: "123"
  }
});

console.log("Payment created:", payment.id);
```

## API Reference

### MoyasarClient

The main client class that provides access to all Moyasar services.

```typescript
const moyasar = new MoyasarClient({
  apiKey: "sk_your_api_key",
  baseUrl: "https://api.moyasar.com", // Optional, defaults to production
  timeout: 30000 // Optional, defaults to 30 seconds
});
```

#### Client Methods

- `ping()` - Test API connectivity
- `getClientInfo()` - Get client version and configuration info

### Payment Service

Handle payment operations including creation, capture, refund, and more.

#### Create Payment

```typescript
// Credit Card Payment
const payment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "Order #12345",
  callback_url: "https://your-app.com/callback",
  source: {
    type: "creditcard",
    name: "Ahmed Mohammed",
    number: "4111111111111111",
    month: 12,
    year: 2025,
    cvc: "123",
    "3ds": true, // Enable 3D Secure
    manual: false // Auto-capture
  },
  metadata: {
    order_id: "12345",
    customer_id: "cust_123"
  }
});

// Apple Pay Payment
const applePayPayment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "Apple Pay Purchase",
  callback_url: "https://your-app.com/callback",
  source: {
    type: "applepay",
    token: "apple_pay_token_here"
  }
});

// STC Pay Payment
const stcPayPayment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "STC Pay Purchase",
  callback_url: "https://your-app.com/callback",
  source: {
    type: "stcpay",
    mobile: "966501234567"
  }
});
```

#### Payment Operations

```typescript
// Get payment details
const payment = await moyasar.payment.get("pay_123");

// List payments
const payments = await moyasar.payment.list({
  limit: 10,
  offset: 0,
  status: "paid"
});

// Capture authorized payment
const captured = await moyasar.payment.capture("pay_123", {
  amount: 1000 // Optional, captures full amount if not specified
});

// Refund payment
const refunded = await moyasar.payment.refund("pay_123", {
  amount: 500, // Partial refund
  reason: "Customer requested refund"
});

// Void payment
const voided = await moyasar.payment.void("pay_123");
```

### Invoice Service

Manage invoices and billing.

#### Create Invoice

```typescript
const invoice = await moyasar.invoice.create({
  amount: 1000,
  currency: "SAR",
  description: "Monthly subscription",
  callback_url: "https://your-app.com/callback",
  metadata: {
    subscription_id: "sub_123"
  }
});

// Bulk create invoices
const invoices = await moyasar.invoice.bulkCreate([
  {
    amount: 1000,
    currency: "SAR",
    description: "Invoice 1",
    callback_url: "https://your-app.com/callback"
  },
  {
    amount: 2000,
    currency: "SAR", 
    description: "Invoice 2",
    callback_url: "https://your-app.com/callback"
  }
]);
```

#### Invoice Operations

```typescript
// Get invoice details
const invoice = await moyasar.invoice.get("inv_123");

// List invoices
const invoices = await moyasar.invoice.list({
  limit: 10,
  offset: 0,
  status: "paid"
});

// Update invoice
const updated = await moyasar.invoice.update("inv_123", {
  description: "Updated description"
});

// Delete invoice
await moyasar.invoice.delete("inv_123");
```

### Webhook Service

Handle real-time event notifications from Moyasar.

#### Webhook Management

```typescript
// Create webhook
const webhook = await moyasar.webhook.create({
  url: "https://your-app.com/webhooks/moyasar",
  http_method: "post",
  events: ["payment_paid", "payment_failed", "payment_refunded"]
});

// List webhooks
const webhooks = await moyasar.webhook.list();

// Get webhook details
const webhook = await moyasar.webhook.get("webhook_123");

// Update webhook
const updated = await moyasar.webhook.update("webhook_123", {
  events: ["payment_paid", "payment_failed"]
});

// Delete webhook
await moyasar.webhook.delete("webhook_123");
```

#### Event Handling

```typescript
// Listen to specific events
moyasar.webhook.onPaymentEvent("payment_paid", (payload) => {
  console.log("Payment successful:", payload.data);
});

moyasar.webhook.onPaymentEvent("payment_failed", (payload) => {
  console.log("Payment failed:", payload.data);
});

// Listen to all payment events
moyasar.webhook.onPaymentEvent("*", (payload) => {
  console.log("Payment event:", payload.type, payload.data);
});

// Verify webhook signature
const isValid = moyasar.webhook.verifySignature({
  payload: requestBody,
  signature: request.headers["x-moyasar-signature"],
  secret: "your_webhook_secret"
});
```

#### Available Events

- `payment_paid` - Payment completed successfully
- `payment_failed` - Payment failed
- `payment_authorized` - Payment authorized (manual capture)
- `payment_captured` - Payment captured
- `payment_refunded` - Payment refunded
- `payment_voided` - Payment voided
- `payment_abandoned` - Payment abandoned
- `payment_verified` - Payment verified
- `payment_canceled` - Payment canceled
- `payment_expired` - Payment expired
- `balance_transferred` - Balance transferred
- `payout_initiated` - Payout initiated
- `payout_paid` - Payout completed
- `payout_failed` - Payout failed
- `payout_canceled` - Payout canceled
- `payout_returned` - Payout returned

## Payment Methods

### Credit Cards

Supports all major card schemes:
- Visa
- Mastercard
- American Express
- Mada (Saudi domestic cards)

```typescript
const payment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "Credit card payment",
  callback_url: "https://your-app.com/callback",
  source: {
    type: "creditcard",
    name: "Card Holder Name",
    number: "4111111111111111",
    month: 12,
    year: 2025,
    cvc: "123",
    "3ds": true, // Enable 3D Secure
    manual: false, // Auto-capture
    save_card: true // Save card for future use
  }
});
```

### Digital Wallets

#### Apple Pay

```typescript
const payment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "Apple Pay payment",
  callback_url: "https://your-app.com/callback",
  source: {
    type: "applepay",
    token: "apple_pay_token_from_client"
  }
});
```

#### Google Pay

```typescript
const payment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "Google Pay payment",
  callback_url: "https://your-app.com/callback",
  source: {
    type: "googlepay",
    token: "google_pay_token_from_client"
  }
});
```

#### Samsung Pay

```typescript
const payment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "Samsung Pay payment",
  callback_url: "https://your-app.com/callback",
  source: {
    type: "samsungpay",
    token: "samsung_pay_token_from_client"
  }
});
```

### STC Pay

Saudi Telecom's digital wallet service.

```typescript
const payment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "STC Pay payment",
  callback_url: "https://your-app.com/callback",
  source: {
    type: "stcpay",
    mobile: "966501234567",
    cashier_id: "cashier_123", // Optional
    branch: "branch_456" // Optional
  }
});
```

### Tokenized Payments

Use saved payment methods for recurring payments.

```typescript
const payment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "Token payment",
  callback_url: "https://your-app.com/callback",
  source: {
    type: "token",
    token: "token_1234567890abcdef",
    cvc: "123" // Optional for saved cards
  }
});
```

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```typescript
import { MoyasarError, PaymentError, InvoiceError, WebhookError } from "@sahabaplus/moyasar";

try {
  const payment = await moyasar.payment.create({
    // payment data
  });
} catch (error) {
  if (error instanceof PaymentError) {
    console.log("Payment error:", error.message);
    console.log("Error code:", error.code);
    console.log("HTTP status:", error.status);
  } else if (error instanceof MoyasarError) {
    console.log("API error:", error.message);
  } else {
    console.log("Unexpected error:", error);
  }
}
```

## Configuration

### Environment Options

```typescript
const moyasar = new MoyasarClient({
  apiKey: "sk_your_api_key",
  baseUrl: "https://api.moyasar.com", // Production (default)
  // baseUrl: "https://sandbox.moyasar.com", // Sandbox
  timeout: 30000, // Request timeout in milliseconds
  retries: 3, // Number of retries for failed requests
  retryDelay: 1000 // Delay between retries in milliseconds
});
```

### Supported Currencies

- SAR (Saudi Riyal)
- KWD (Kuwaiti Dinar)
- AED (UAE Dirham)
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## Examples

Check the `examples/` directory for complete implementation examples:

- Basic payment processing
- Webhook handling
- Invoice management
- Error handling
- TypeScript integration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Official Moyasar Documentation](https://docs.moyasar.com/)
- [GitHub Issues](https://github.com/sahabaplus/moyasar/issues)
- [Email Support](mailto:support@sahabaplus.com)

## Changelog

### 0.1.0-beta.1
- Initial beta release
- Payment processing support
- Invoice management
- Webhook handling
- TypeScript support
- Event-driven architecture