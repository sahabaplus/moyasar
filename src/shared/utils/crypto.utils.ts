/**
 * Crypto utilities for webhook signature verification
 */
export class CryptoUtils {
  /**
   * Create HMAC SHA256 signature
   */
  static async createHmacSha256(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data)
    );
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Verify HMAC SHA256 signature
   */
  static async verifyHmacSha256(
    data: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      const expectedSignature = await this.createHmacSha256(data, secret);
      return this.constantTimeCompare(signature, expectedSignature);
    } catch (error) {
      return false;
    }
  }

  /**
   * Constant time string comparison to prevent timing attacks
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}
