import type {
  BaseListOptions,
  CurrencyType,
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
export interface Invoice extends HasAmount {
  id: string;
  status: InvoiceStatus;
  currency: CurrencyType;
  description: string;
  /**
   * @description URL to the entity logo configured through Moyasar Dashboard.
   */
  logo_url?: `https://${string}` | undefined;
  amount_format: `${number} ${CurrencyType}`;
  url: `https://${string}`;
  /**
   * @description An endpoint on your server that will get a POST request with the invoice object when the invoice is paid. Unlike Payment, this is not used to redirect the user, this is only used to send a notification.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  callback_url?: `https://${string}` | undefined;
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
  back_url?: `https://${string}` | undefined;
  /**
   * @description An endpoint where the payer will be redirected to when the invoice is paid.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  success_url?: `https://${string}` | undefined;
  metadata?: Metadata | undefined;
}

export interface DetailedInvoice extends Invoice {
  payments: Payment[];
}

export interface CreateInvoiceRequest extends HasAmount {
  currency: CurrencyType;
  description: string;
  /**
   * @description An endpoint on your server that will get a POST request with the invoice object when the invoice is paid. Unlike Payment, this is not used to redirect the user, this is only used to send a notification.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  callback_url?: `https://${string}` | undefined;
  /**
   * @description An endpoint where the payer will be redirected to when the invoice is paid.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  success_url?: `https://${string}` | undefined;
  /**
   * @description An endpoint on your site used for redirect when the user clicks on the back button.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  back_url?: `https://${string}` | undefined;
  /**
   * @description Specifies when the invoice will get expired.
   * @note User will be prevented from paying the invoice once expired.
   * @note The argument can be a date string (e.g. 2017-01-12) or datetime string (e.g. 2018-01-01T09:55:14.000Z) in ISO 8601 format (default is null).
   * @note Specifying a date only will cause the time to be set to 00:00:00 which will cause the invoice to expire at the beginning of the day.
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  expired_at?: Date | undefined;
  metadata?: Metadata | undefined;
}

export interface UpdateInvoiceRequest {
  metadata?: Metadata | undefined;
}

export interface BulkCreateInvoiceRequest {
  /**
   * @description Max length is `BulkInvoiceLimit.MAX_BULK_INVOICES`
   * @see https://docs.moyasar.com/api/invoices/01-create-invoice#request
   */
  invoices: CreateInvoiceRequest[];
}

export interface InvoiceListOptions extends BaseListOptions {
  id?: string | undefined;
  status?: InvoiceStatus | undefined;
  "created[gt]"?: Date | undefined;
  "created[lt]"?: Date | undefined;
  metadata?: Metadata | undefined;
}

export interface ListInvoicesResponse extends ListResponse<Invoice> {
  invoices: Invoice[];
}

export interface BulkCreateInvoicesResponse {
  invoices: Invoice[];
}
