/**
 * # Metadata
 * Metadata is a key/value object that can be attached to Payments, Invoices, and Tokens.
 *
 * You can specify up to `30 keys`, with key names up to `40 characters` long and values up to `500 characters` long.
 * You can filter by metadata when listing payments, invoices, and tokens.
 *
 * ## Use cases
 * Metadata is useful for storing additional, structured information on an object. For example, you could store your user’s full name, email, and internal order id.
 * 
 * ## Unsetting Keys
 * Individual keys can be unset by sending them an empty value. All keys can be unset by sending an empty value to metadata.
 *
 * ## Important!!
 * Do not store any sensitive information (bank account numbers, card details, etc.) as metadata.
 * 
 * ## Example
 * ```json
 * {
    "id": "760878ec-d1d3-5f72-9056-191683f55872",
    "status": "paid",
    "amount": 60000,
    "fee": 1580,
    ...
    "metadata": {
      "order_id": 1000,
      "full_name": "Saleh Mohammed Ali"
    },
    "source": {
      "type": "creditcard",
      "company": "visa",
      ...
    }
  }
 * ```
 * @see https://docs.moyasar.com/api/metadata
 */
export type Metadata = Record<string, string>;

export interface HasMetadata<T extends object = Metadata> {
  /**
 * # Metadata
 * Metadata is a key/value object that can be attached to Payments, Invoices, and Tokens.
 *
 * You can specify up to `30 keys`, with key names up to `40 characters` long and values up to `500 characters` long.
 * You can filter by metadata when listing payments, invoices, and tokens.
 *
 * ## Use cases
 * Metadata is useful for storing additional, structured information on an object. For example, you could store your user’s full name, email, and internal order id.
 * 
 * ## Unsetting Keys
 * Individual keys can be unset by sending them an empty value. All keys can be unset by sending an empty value to metadata.
 *
 * ## Important!!
 * Do not store any sensitive information (bank account numbers, card details, etc.) as metadata.
 * 
 * ## Example
 * ```json
 * {
    "id": "760878ec-d1d3-5f72-9056-191683f55872",
    "status": "paid",
    "amount": 60000,
    "fee": 1580,
    ...
    "metadata": {
      "order_id": 1000,
      "full_name": "Saleh Mohammed Ali"
    },
    "source": {
      "type": "creditcard",
      "company": "visa",
      ...
    }
  }
 * ```
 * @see https://docs.moyasar.com/api/metadata
 */
  metadata?: T | undefined | null;
}
