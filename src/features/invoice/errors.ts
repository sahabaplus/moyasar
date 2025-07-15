import { MoyasarError } from "@errors";
export class InvoiceError extends MoyasarError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "INVOICE_ERROR", 500, details ?? {});
    this.name = "InvoiceError";
  }
}
