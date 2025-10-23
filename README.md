# Moyasar SDK

A comprehensive TypeScript SDK for integrating with the Moyasar payment gateway. This SDK provides type-safe access to Moyasar's APIs for payments, invoices, and webhook management.

## Features

- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Event-driven**: Advanced event system for webhook handling
- **Modular**: Clean architecture with separation of concerns
- **Multi-platform**: Support for web, mobile wallets (Apple Pay, Google Pay, Samsung Pay), and STC Pay
- **Payment Methods**: Credit cards, tokenized payments, and digital wallets
- **Invoice Management**: Create, update, and manage invoices
- **Webhook Support**: Real-time event notifications with built-in validation
- **Well-tested**: Comprehensive test suite with high coverage

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
// Retrieve payment details
const payment = await moyasar.payment.retrieve("pay_123");

// List payments
const payments = await moyasar.payment.list({
  limit: 10,
  offset: 0,
  status: "paid"
});

// Update payment
const updated = await moyasar.payment.update({
  paymentId: "pay_123",
  update: {
    description: "Updated description",
    metadata: { updated: true }
  }
});

// Capture authorized payment
const captured = await moyasar.payment.capture({
  paymentId: "pay_123",
  capture: {
    amount: 1000 // Optional, captures full amount if not specified
  }
});

// Refund payment
const refunded = await moyasar.payment.refund({
  paymentId: "pay_123",
  refund: {
    amount: 500, // Partial refund
    reason: "Customer requested refund"
  }
});

// Void payment
const voided = await moyasar.payment.void("pay_123");
```

#### Advanced Payment Queries

```typescript
// Get payments by status
const paidPayments = await moyasar.payment.getPaid({ limit: 10 });
const failedPayments = await moyasar.payment.getFailed({ limit: 10 });
const authorizedPayments = await moyasar.payment.getAuthorized({ limit: 10 });

// Search by metadata
const payments = await moyasar.payment.searchByMetadata({
  metadata: { order_id: "12345" },
  options: { limit: 10 }
});

// Get by card last 4 digits
const cardPayments = await moyasar.payment.getByCardLast4({
  last4: "1111",
  options: { limit: 10 }
});

// Get by RRN (Retrieval Reference Number)
const rrnPayments = await moyasar.payment.getByRRN({
  rrn: "123456789012",
  options: { limit: 10 }
});

// Check payment capabilities
const capabilities = await moyasar.payment.getPaymentCapabilities("pay_123");
console.log("Can refund:", capabilities.canRefund);
console.log("Max refund amount:", capabilities.maxRefundAmount);
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
const invoices = await moyasar.invoice.createBulk({
  invoices: [
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
  ]
});
```

#### Invoice Operations

```typescript
// Retrieve invoice details
const invoice = await moyasar.invoice.retrieve("inv_123");

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

// Cancel invoice
await moyasar.invoice.cancel("inv_123");
```

#### Advanced Invoice Queries

```typescript
// Get invoices by status
const paidInvoices = await moyasar.invoice.getPaid({ limit: 10 });
const expiredInvoices = await moyasar.invoice.getExpired({ limit: 10 });

// Search by metadata
const invoices = await moyasar.invoice.searchByMetadata(
  { subscription_id: "sub_123" },
  { limit: 10 }
);
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

// Retrieve webhook details
const webhook = await moyasar.webhook.retrieve("webhook_123");

// Update webhook
const updated = await moyasar.webhook.update("webhook_123", {
  events: ["payment_paid", "payment_failed"]
});

// Delete webhook
await moyasar.webhook.delete("webhook_123");

// Get available webhook events
const events = await moyasar.webhook.availableEvents();
console.log("Available events:", events);
```

#### Webhook Attempts

```typescript
// List webhook attempts
const attempts = await moyasar.webhook.attempts.list({
  limit: 10,
  offset: 0
});

// Retrieve specific attempt
const attempt = await moyasar.webhook.attempts.retrieve("attempt_123");
```

#### Processing Webhooks

The SDK provides a robust `processWebhook()` method that handles parsing, validation, and signature verification:

```typescript
import { MoyasarClient } from "@sahabaplus/moyasar";

const moyasar = new MoyasarClient({
  apiKey: "sk_your_api_key"
});

// In your webhook endpoint (e.g., Express.js)
app.post("/webhooks/moyasar", async (req, res) => {
  try {
    // Process and verify webhook
    const payload = await moyasar.webhook.processWebhook(
      req.body, // Can be string, Buffer, or parsed object
      {
        signature: req.headers["x-moyasar-signature"],
        secret: "your_webhook_secret"
      }
    ); // If succeeded, all `moyasar.webhook.on*` events will be triggered when matched with the webhook event.


    console.log("Webhook event:", payload.type);
    console.log("Webhook data:", payload.data);

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook processing failed:", error);
    res.status(400).send("Invalid webhook");
  }
});
```

#### Event Handling

The SDK provides a type-safe event emitter for handling webhook events:

```typescript
// Listen to specific events
moyasar.webhook.onPaymentEvent("payment_paid", (payload) => {
  console.log("Payment successful:", payload.data);
});

moyasar.webhook.onPaymentEvent("payment_failed", (payload) => {
  console.log("Payment failed:", payload.data);
});

// Listen to all payment events
moyasar.webhook.onAnyPaymentEvent((payload) => {
  console.log("Payment event:", payload.type, payload.data);
});

// Using standard event emitter syntax
moyasar.webhook.on("payment_paid", (payload) => {
  console.log("Payment received:", payload);
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
import {
  MoyasarError,
  PaymentError,
  InvoiceError,
  WebhookError,
  WebhookValidationError
} from "@sahabaplus/moyasar";

try {
  const payment = await moyasar.payment.create({
    // payment data
  });
} catch (error) {
  if (error instanceof PaymentError) {
    console.log("Payment error:", error.message);
    console.log("HTTP status:", error.statusCode);
  } else if (error instanceof InvoiceError) {
    console.log("Invoice error:", error.message);
  } else if (error instanceof WebhookError) {
    console.log("Webhook error:", error.message);
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

### TypeSafe Metadata

You can safely define your metadata type to guarantee type safety during development. Furthermore, your can pass a custom metadata validator to ensure runtime safety for your metadata.

```typescript
import { MoyasarClient } from "@sahabaplus/moyasar";

type MyMetadata = {
  order_id: string;
  customer_id: string;
  internal_ref: number;
};

const moyasar = new MoyasarClient<MyMetadata>({
  apiKey: "sk_your_api_key"
});

const payment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "Order payment",
  callback_url: "https://your-app.com/callback",
  source: { type: "creditcard", /* ... */ },
  metadata: { order_id: "12345", customer_id: "cust_123" } // <- Type error, missing `internal_ref` property
});
```

You can also use a custom metadata validator to ensure runtime safety for your metadata.

```typescript
import { MoyasarClient } from "@sahabaplus/moyasar";
import { z } from "zod";

// Define your metadata schema
const MyMetadataSchema = z.object({
  order_id: z.string(),
  customer_id: z.string(),
  internal_ref: z.number().optional()
});

type MyMetadata = z.infer<typeof MyMetadataSchema>;

const moyasar = new MoyasarClient<MyMetadata>({
  apiKey: "sk_your_api_key",
  metadataValidator: {
    parse: (data) => MyMetadataSchema.parse(data)
  }
});


// Now all metadata is type-safe
const payment = await moyasar.payment.create({
  amount: 1000,
  currency: "SAR",
  description: "Order payment",
  callback_url: "https://your-app.com/callback",
  source: { type: "creditcard", /* ... */ },
  metadata: {
    order_id: "12345",
    customer_id: "cust_123",
    internal_ref: 999
  }
});
```

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

### Complete Payment Flow with Error Handling

```typescript
import { MoyasarClient, PaymentError } from "@sahabaplus/moyasar";

const moyasar = new MoyasarClient({
  apiKey: "sk_your_api_key"
});

async function processPayment() {
  try {
    // Create payment
    const payment = await moyasar.payment.create({
      amount: 10000, // 100.00 SAR
      currency: "SAR",
      description: "Order #12345",
      callback_url: "https://myapp.com/callback",
      source: {
        type: "creditcard",
        name: "Ahmed Mohammed",
        number: "4111111111111111",
        month: 12,
        year: 2025,
        cvc: "123",
        "3ds": true
      }
    });

    console.log("Payment created:", payment.id);

    // Check capabilities
    const capabilities = await moyasar.payment.getPaymentCapabilities(payment.id);

    if (capabilities.canRefund) {
      // Perform partial refund
      const refunded = await moyasar.payment.refund({
        paymentId: payment.id,
        refund: {
          amount: 2000, // Refund 20.00 SAR
          reason: "Partial order cancellation"
        }
      });
      console.log("Refund successful:", refunded.refunded_amount);
    }

  } catch (error) {
    if (error instanceof PaymentError) {
      console.error("Payment failed:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

processPayment();
```

### Webhook Server Example (Express.js)

```typescript
import express from "express";
import { MoyasarClient, WebhookError } from "@sahabaplus/moyasar";

const app = express();
app.use(express.json());

const moyasar = new MoyasarClient({
  apiKey: "sk_your_api_key"
});

// Setup event listeners
moyasar.webhook.onPaymentEvent("payment_paid", async (payload) => {
  console.log("Payment received:", payload.data.id);
  // Update your database, send confirmation email, etc.
});

moyasar.webhook.onPaymentEvent("payment_failed", async (payload) => {
  console.log("Payment failed:", payload.data.id);
  // Notify customer, log failure, etc.
});

// Webhook endpoint
app.post("/webhooks/moyasar", async (req, res) => {
  try {
    const signature = req.headers["x-moyasar-signature"];

    // Process webhook with automatic validation
    await moyasar.webhook.processWebhook(req.body, {
      signature: signature as string,
      secret: process.env.WEBHOOK_SECRET!
    });

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).send("Invalid webhook");
  }
});

app.listen(3000, () => {
  console.log("Webhook server running on port 3000");
});
```

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

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
