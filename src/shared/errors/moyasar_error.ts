export class MoyasarError extends Error {
  public readonly type: string;
  public readonly statusCode: number;
  public readonly details: Record<string, any>;

  constructor(
    message: string,
    type: string = "MOYASAR_ERROR",
    statusCode: number,
    details: Record<string, any>
  ) {
    super(message);
    this.name = "MoyasarError";
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}
