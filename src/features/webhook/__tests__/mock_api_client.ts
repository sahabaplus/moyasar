import { type ApiClient } from "@types";

export class MockApiClient implements ApiClient {
  public mockResponses: Map<string, any> = new Map();
  public requestHistory: Array<{
    method: string;
    url: string;
    data?: any;
    params?: any;
  }> = [];

  setMockResponse(key: string, response: any) {
    this.mockResponses.set(key, response);
  }

  async request<T = any>(config: {
    method: string;
    url: string;
    data?: any;
    params?: any;
  }): Promise<T> {
    this.requestHistory.push(config);

    const key = `${config.method}:${config.url}`;
    const response = this.mockResponses.get(key);

    if (response instanceof Error) {
      throw response;
    }

    if (response === undefined) {
      throw new Error(`No mock response for ${key}`);
    }

    return response;
  }

  clearHistory() {
    this.requestHistory = [];
  }

  getLastRequest() {
    return this.requestHistory[this.requestHistory.length - 1];
  }
}
