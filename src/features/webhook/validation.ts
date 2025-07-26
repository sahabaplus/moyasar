import { WebhookEvent, WebhookHttpMethod } from "./enums";

export class WebhookValidation {
  /**
   * Validate webhook event type
   */
  static isValidWebhookEvent(event: string): boolean {
    return Object.values(WebhookEvent).includes(event as any);
  }

  /**
   * Validate HTTP method
   */
  static isValidHttpMethod(method: string): boolean {
    return Object.values(WebhookHttpMethod).includes(method as any);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "https:"; // Only allow HTTPS
    } catch {
      return false;
    }
  }

  /**
   * Validate required fields
   */
  static validateRequired<T extends Record<string, any>>(
    obj: T,
    requiredFields: (keyof T)[]
  ): string[] {
    const errors: string[] = [];

    for (const field of requiredFields) {
      if (
        obj[field] === undefined ||
        obj[field] === null ||
        obj[field] === ""
      ) {
        errors.push(`${String(field)} is required`);
      }
    }

    return errors;
  }

  /**
   * Sanitize webhook URL
   */
  static sanitizeUrl(url: string): string {
    return url.trim().toLowerCase();
  }
}
