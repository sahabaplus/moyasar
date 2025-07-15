import { MoyasarError } from "@errors";

export class PaymentError extends MoyasarError {
  constructor(
    message: string,
    statusCode: number,
    details?: Record<string, any>
  ) {
    super(message, "PAYMENT_ERROR", statusCode, details ?? {});
    this.name = "PaymentError";
  }
}
