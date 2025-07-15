export type Amount = number;

export interface HasAmount {
  /**
   * ### Payment amount
   * @description A positive **INTEGER** representing the payment amount in the smallest currency unit.
   * @values Possible values: `>= 100`
   * @see https://docs.moyasar.com/api/payments/01-create-payment#request-body
   * @example
   * `1.00 SAR` = 100
   * `1.00 KWD` = 1000
   * `1 JPY` = 1
   */
  amount: Amount;
}
