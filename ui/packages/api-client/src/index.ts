import type {
  Prefix,
  SHACLError,
  SHACLValidationRequest,
  SHACLValidationResponse,
  SPARQLError,
  SPARQLQueryRequest,
  SPARQLResponse,
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
    format: SerializationFormat = 'sparql-json'
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

  async getPrefixes(): Promise<Prefix[]> {
    try {
      const response = await fetch(`${this.baseURL}/prefixes`);

      if (!response.ok) {
        throw new SPARQLAPIError('Failed to fetch prefixes', response.status);
      }

      const data: Prefix[] = await response.json();
      return data;
    } catch (error) {
      if (error instanceof SPARQLAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new SPARQLAPIError(error.message);
      }

      throw new SPARQLAPIError('Unknown error occurred while fetching prefixes');
    }
  }

  async validateSHACL(request: SHACLValidationRequest): Promise<SHACLValidationResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/shacl`, {
        method: 'POST',
        body: JSON.stringify({
          data: request.data,
          shapes: request.shapes,
          inference: request.inference ?? false,
        }),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: SHACLError = await response.json().catch(() => ({
          detail: `HTTP error ${response.status}: ${response.statusText}`,
        }));
        throw new SPARQLAPIError(
          errorData.detail || 'Failed to validate SHACL',
          response.status,
          errorData.detail
        );
      }

      const data: SHACLValidationResponse = await response.json();
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

  private getAcceptHeader(format: SerializationFormat): string {
    switch (format) {
      case 'sparql-json':
        return 'application/sparql-results+json';
      case 'csv':
        return 'text/csv';
      case 'sparql-xml':
        return 'application/sparql-results+xml';
      case 'turtle':
        return 'text/turtle';
      case 'json-ld':
        return 'application/ld+json';
      case 'rdf-xml':
        return 'application/rdf+xml';
      default:
        return 'application/sparql-results+json';
    }
  }
}

export const createSPARQLClient = (config?: SPARQLClientConfig) => new SPARQLClient(config);
