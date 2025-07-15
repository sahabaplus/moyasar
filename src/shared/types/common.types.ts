export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * # Pagination
 * All top-level API resources have support for bulk fetches via "list" API methods. For instance, you can list payment and list invoices.
 *
 * The response of a list API method represents a single page in a reverse chronological stream of objects. If you do not specify the page, you will receive the first page of this stream, containing the newest objects.
 *
 * The stream of objects will return `40` objects for the requested resource by default and an object containing meta-information about the list.
 *
 * # Example
 * Here is an example of the meta object:
 * ```json
 * {
 *   "current_page": 1,
 *   "next_page": null,
 *   "prev_page": null,
 *   "total_pages": 1,
 *   "total_count": 5
 * }
 * ```
 * @see https://docs.moyasar.com/api/pagination
 */
export interface PaginationMeta {
  /**
   * @description The current page of the resource list.
   * @see https://docs.moyasar.com/api/pagination
   */
  current_page: number;
  /**
   * @description The next page number if any, otherwise null
   * @see https://docs.moyasar.com/api/pagination
   */
  next_page: number | null;
  /**
   * @description The previous page number if any, otherwise null
   * @see https://docs.moyasar.com/api/pagination
   */
  prev_page: number | null;
  /**
   * @description The total number of pages for the list of resources
   * @see https://docs.moyasar.com/api/pagination
   */
  total_pages: number;
  /**
   * @description The total number of resources in the list
   * @see https://docs.moyasar.com/api/pagination
   */
  total_count: number;
}

export interface ListResponse<T> {
  /**
   * @description Pagination metadata.
   * @see https://docs.moyasar.com/api/pagination
   */
  meta: PaginationMeta;
}

export interface BaseListOptions {
  /**
   * @description The response of a list API method represents a single page in a reverse chronological stream of objects. If you do not specify the page, you will receive the first page of this stream, containing the newest objects.
   * @default 1
   * @see https://docs.moyasar.com/api/pagination
   */
  page?: number;
  /**
   * @description You can only set the limit to 40.
   * @default 40
   * @see https://docs.moyasar.com/api/pagination
   */
  limit?: 40;
}

export interface ApiError {
  type: string;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
}
