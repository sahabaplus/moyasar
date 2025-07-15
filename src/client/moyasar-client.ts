import { BaseApiClient } from "./base-client";
import { WebhookService } from "@webhook";
import { InvoiceService } from "@invoice";
import type { ApiClientOptions } from "@types";
import { PaymentService } from "@payment";

export interface MoyasarClientOptions extends ApiClientOptions {
  apiKey: string;
}

export class MoyasarClient extends BaseApiClient {
  public readonly webhook: WebhookService;
  public readonly invoice: InvoiceService;
  public readonly payment: PaymentService;

  constructor(options: MoyasarClientOptions) {
    if (options.apiKey.length < 3) {
      throw new Error(`apiKey is required!, got ${options.apiKey}`);
    }
    super(options.apiKey, options);

    // Initialize feature services
    this.webhook = new WebhookService({ apiClient: this });
    this.invoice = new InvoiceService({ apiClient: this });
    this.payment = new PaymentService({ apiClient: this });
  }

  /**
   * Test the API connection
   */
  async ping(): Promise<{ status: "ok"; timestamp: number }> {
    try {
      await this.webhook.availableEvents();
      return {
        status: "ok",
        timestamp: Date.now(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get client information
   */
  getClientInfo(): {
    baseUrl: string;
    userAgent: string;
    version: string;
  } {
    return {
      baseUrl: this.baseUrl,
      userAgent: "Moyasar-SDK/1.0.0",
      version: "1.0.0",
    };
  }
}
