import type {
  SPARQLQueryRequest,
  SPARQLResponse,
  SPARQLError,
  SerializationFormat,
} from '@hello-sparql/types';

export class SPARQLAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'SPARQLAPIError';
  }
}

export interface SPARQLClientConfig {
  baseURL?: string;
  timeout?: number;
}

export class SPARQLClient {
  private baseURL: string;
  private timeout: number;

  constructor(config: SPARQLClientConfig = {}) {
    this.baseURL =
      config.baseURL || import.meta.env.VITE_SPARQL_ENDPOINT || 'http://localhost:8000';
    this.timeout = config.timeout || 60000;
  }

  async executeQuery(
    request: SPARQLQueryRequest,
    format: SerializationFormat = 'txt'
  ): Promise<SPARQLResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const acceptHeader = this.getAcceptHeader(format);

      const response = await fetch(`${this.baseURL}/sparql`, {
        method: 'POST',
        body: JSON.stringify({
          query: request.query,
          data: request.data,
          inference: request.inference ?? false,
        }),
        headers: {
          'Content-Type': 'application/json',
          Accept: acceptHeader,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: SPARQLError = await response.json().catch(() => ({
          detail: `HTTP error ${response.status}: ${response.statusText}`,
        }));
        throw new SPARQLAPIError(
          errorData.detail || 'Failed to execute query',
          response.status,
          errorData.detail
        );
      }

      const data: SPARQLResponse = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof SPARQLAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new SPARQLAPIError('Request timeout', 408);
        }
        throw new SPARQLAPIError(error.message);
      }

      throw new SPARQLAPIError('Unknown error occurred');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private getAcceptHeader(format: SerializationFormat): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'xml':
        return 'text/xml';
      default:
        return 'text/plain';
    }
  }
}

export const createSPARQLClient = (config?: SPARQLClientConfig) => new SPARQLClient(config);
