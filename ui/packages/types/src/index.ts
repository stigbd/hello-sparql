export interface SPARQLQueryRequest {
  query: string;
  data: string;
}

export interface SPARQLQueryResponse {
  results: SPARQLResult[];
}

export interface SPARQLResult {
  [key: string]: string | number | boolean | null;
}

export interface SPARQLError {
  detail: string;
}

export type QueryType = 'select' | 'construct' | 'count';

export interface QueryTemplate {
  type: QueryType;
  label: string;
  query: string;
}

export interface EditorState {
  query: string;
  data: string;
}

export type SerializationFormat = 'txt' | 'json' | 'csv' | 'xml';

export interface QueryExecutionResult {
  data: string;
  duration: number;
  format: SerializationFormat;
}
