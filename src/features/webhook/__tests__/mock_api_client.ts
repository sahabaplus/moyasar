import type { ApiClient, MoyasarClientTypes, MetadataValidator } from "@types";

export class MockApiClient<T extends MoyasarClientTypes>
  implements ApiClient<T>
{
  public metadataValidator: MetadataValidator<T["metadata"]>;
  public mockResponses: Map<string, any> = new Map();
  public requestHistory: Array<{
    method: string;
    url: string;
    data?: any;
    params?: any;
  }> = [];

  constructor({
    dataParser,
  }: {
    dataParser?: MetadataValidator<T["metadata"]>;
  }) {
    this.metadataValidator = dataParser ?? {
      parse: payload => payload,
    };
  }

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
