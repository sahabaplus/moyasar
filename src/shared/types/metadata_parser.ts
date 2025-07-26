import type { Metadata } from "..";
/**
 * # Metadata Validator
 *
 * A type that defines a serializer and deserializer for metadata.
 *
 * @template T - The type of the metadata
 * @interface MetadataSerde
 * @method parse - Parse/deserialize the payload and return the parsed data
 * @method serialize - Serialize the data and return the serialized data
 */
export interface MetadataValidator<T> {
  /**
   * Parse the payload and return the parsed data
   * @param payload - The payload to parse
   * @returns The parsed data
   * @throws {Error} If the payload is invalid
   *
   * @example
   * ```ts
   * import z from "zod";
   * const metadataSchema = z.object({
   *   key: z.string(),
   * });
   * const metadataSerde = {
   *   parse: metadataSchema.parse,
   *   serialize: metadataSchema.stringify,
   * }
   * const metadata = {
   *   key: "value",
   * };
   * const parsed = metadataSerde.parse(metadata);
   * ```
   */
  parse(payload: Metadata): T;
}
