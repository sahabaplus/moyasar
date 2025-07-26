import { BaseAxiosApiClient } from "./base-client";
import { WebhookService } from "@webhook";

import { InvoiceService } from "@invoice";
import type {
  ApiClientOptions,
  Metadata,
  MoyasarClientTypes,
  MetadataValidator,
  ApiClient,
} from "@types";
import { PaymentService } from "@payment";

export interface MoyasarClientOptions<T extends object = Metadata>
  extends ApiClientOptions {
  apiKey: string;
  metadataValidator?: MetadataValidator<T>;
}

export class MoyasarClient<T extends object = Metadata>
  extends BaseAxiosApiClient
  implements ApiClient<MoyasarClientTypes<T>>
{
  public readonly webhook: WebhookService<MoyasarClientTypes<T>>;
  public readonly invoice: InvoiceService<MoyasarClientTypes<T>>;
  public readonly payment: PaymentService<MoyasarClientTypes<T>>;
  public readonly metadataValidator: MetadataValidator<T>;

  constructor(options: MoyasarClientOptions<T>) {
    super(options.apiKey, options);
    if (options.apiKey.length < 3)
      throw new Error(`apiKey is required!, got ${options.apiKey}`);

    this.metadataValidator = options.metadataValidator ?? this.defaultParser;

    // Initialize feature services
    this.webhook = new WebhookService({ apiClient: this });
    this.invoice = new InvoiceService({ apiClient: this });
    this.payment = new PaymentService({ apiClient: this });
  }

  public readonly defaultParser: MetadataValidator<T> = {
    parse: payload => payload as T,
  };

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
