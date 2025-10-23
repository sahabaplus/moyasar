import type {
  BaseListOptions,
  CurrencyType,
  HasMetadata,
  ListResponse,
  Metadata,
} from "@types";
import type { InvoiceStatus } from "./enums";
import type { Payment } from "@payment";
import type { HasAmount } from "@types";

/**
 * # Invoice
 * @see https://docs.moyasar.com/category/invoices-api
 */
export interface Invoice<T extends object = Metadata>
  extends HasAmount,
    HasMetadata<T> {
  id: string;
  status: InvoiceStatus;
  currency: CurrencyType;
  description: string;
  /**
   * @description URL to the entity logo configured through Moyasar Dashboard.
   */
  logo_url?: string | undefined;
  amount_format: `${number} ${CurrencyType}`;
  url: string;
  /**
   * @description An endpoint on your server that will get a POST request with the invoice object when the invoice is paid. Unlike Payment, this is not used to redirect the user, this is only used to send a notification.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  callback_url?: string | undefined;
  /**
   * @description Specifies when the invoice will get expired.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  expired_at?: Date | undefined;
  created_at: Date;
  updated_at: Date;
  /**
   * @description An endpoint on your site used for redirect when the user clicks on the back button.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  back_url?: string | undefined;
  /**
   * @description An endpoint where the payer will be redirected to when the invoice is paid.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  success_url?: string | undefined;
}

export interface DetailedInvoice<T extends object = Metadata>
  extends Invoice<T> {
    /**
     * Payment attempts made against this invoice.
     * 
     * @hint Usually, last payment status is `PaymentStatus.PAID` if the invoice status is `InvoiceStatus.PAID`.
     * Hence, if you want to get the successful payment attempt, you can get it by using the `payments.at(-1)` method.
     * 
     * @see https://docs.moyasar.com/api/invoices/04-show-invoice
     */
  payments: Payment<T>[];
}

export interface CreateInvoiceRequest<T extends object = Metadata>
  extends HasAmount,
    HasMetadata<T> {
  currency: CurrencyType;
  description: string;
  /**
   * @description An endpoint on your server that will get a POST request with the invoice object when the invoice is paid. Unlike Payment, this is not used to redirect the user, this is only used to send a notification.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  callback_url?: string | undefined;
  /**
   * @description An endpoint where the payer will be redirected to when the invoice is paid.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  success_url?: string | undefined;
  /**
   * @description An endpoint on your site used for redirect when the user clicks on the back button.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  back_url?: string | undefined;
  /**
   * @description Specifies when the invoice will get expired.
   * @note User will be prevented from paying the invoice once expired.
   * @note The argument can be a date string (e.g. 2017-01-12) or datetime string (e.g. 2018-01-01T09:55:14.000Z) in ISO 8601 format (default is null).
   * @note Specifying a date only will cause the time to be set to 00:00:00 which will cause the invoice to expire at the beginning of the day.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  expired_at?: Date | undefined;
}

export interface UpdateInvoiceRequest<T extends object = Metadata>
  extends HasMetadata<Partial<T>> {}

export interface BulkCreateInvoiceRequest<T extends object = Metadata> {
  /**
   * @description Max length is `BulkInvoiceLimit.MAX_BULK_INVOICES`
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  invoices: CreateInvoiceRequest<T>[];
}

export interface InvoiceListOptions<T extends object = Metadata>
  extends BaseListOptions,
    HasMetadata<T> {
  id?: string | undefined;
  status?: InvoiceStatus | undefined;
  "created[gt]"?: Date | undefined;
  "created[lt]"?: Date | undefined;
}

export interface ListInvoicesResponse<T extends object = Metadata>
  extends ListResponse<Invoice<T>> {
  invoices: Invoice<T>[];
}

export interface BulkCreateInvoicesResponse<T extends object = Metadata> {
  invoices: Invoice<T>[];
}
