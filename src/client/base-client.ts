import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import {
  type ApiClient,
  type ApiClientOptions,
  type RequestConfig,
} from "@types";
import { DEFAULT_API_CONFIG } from "@constants";
import { MoyasarError } from "@errors";

export class BaseApiClient implements ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(apiKey: string, options: ApiClientOptions = {}) {
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: options.baseUrl || DEFAULT_API_CONFIG.BASE_URL,
      timeout: options.timeout || DEFAULT_API_CONFIG.TIMEOUT,
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        "Content-Type": "application/json",
        "User-Agent": "Moyasar-SDK/1.0.0",
      },
    });

    // Setup response interceptor for error handling
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Response interceptor to handle errors
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        throw this.createErrorFromAxiosError(error);
      }
    );
  }

  async request<T = any>(config: RequestConfig): Promise<T> {
    const response = await this.axiosInstance.request<T>(config);
    return response.data;
  }

  private createErrorFromAxiosError(error: AxiosError): MoyasarError {
    const response = error.response;

    let errorData: {
      type?: string;
      message?: string;
      errors?: string[];
    } = {};
    let message = error.message;
    let statusCode = response?.status ?? 500;

    // Handle network errors
    if (!response) {
      return new MoyasarError(
        error.message || "Network error occurred",
        "api_connection_error",
        statusCode,
        {
          code: error.code,
          originalError: error.message,
        }
      );
    }

    statusCode = response.status;
    // Parse error response data
    if (response.data) errorData = response.data;

    // Determine error type and message based on Moyasar API documentation
    let errorType = "api_error";

    if (errorData.type) errorType = errorData.type;
    else errorType = this.getDefaultErrorType(statusCode, errorType);

    // Use error message from response or generate appropriate message
    if (errorData.message) message = errorData.message;
    else message = this.getDefaultErrorMessage(statusCode, errorType);

    const moyasarError = new MoyasarError(message, errorType, statusCode, {
      url: error.config?.url,
      status: statusCode,
      statusText: response.statusText,
      errors: errorData.errors, // Detailed validation errors
      ...errorData,
    });

    return moyasarError;
  }

  private getDefaultErrorType(statusCode: number, errorType: string) {
    switch (statusCode) {
      case 400:
        errorType = "invalid_request_error";
        break;
      case 401:
        errorType = "authentication_error";
        break;
      case 403:
        errorType = "account_inactive_error";
        break;
      case 404:
        errorType = "invalid_request_error";
        break;
      case 405:
        errorType = "account_inactive_error";
        break;
      case 429:
        errorType = "rate_limit_error";
        break;
      case 500:
      case 503:
        errorType = "api_error";
        break;
      default:
        errorType = "api_error";
    }
    return errorType;
  }

  private getDefaultErrorMessage(
    statusCode: number,
    errorType: string
  ): string {
    switch (statusCode) {
      case 400:
        return "The request was unacceptable, often due to missing a required parameter";
      case 401:
        return "Invalid authorization credentials";
      case 403:
        return "Credentials not enough to access resources";
      case 404:
        return "The requested resource doesn't exist";
      case 405:
        return "Entity not activated to use live account";
      case 429:
        return "Too many requests hit the API too quickly";
      case 500:
        return "We had a problem with our server. Try again later";
      case 503:
        return "We are temporarily offline for maintenance. Please try again later";
      default:
        return `HTTP ${statusCode}: Request failed`;
    }
  }

  // Getter for base URL (maintaining API compatibility)
  get baseUrl(): string {
    return this.axiosInstance.defaults.baseURL || "";
  }

  // Setter for base URL (maintaining API compatibility)
  set baseUrl(url: string) {
    this.axiosInstance.defaults.baseURL = url;
  }
}
