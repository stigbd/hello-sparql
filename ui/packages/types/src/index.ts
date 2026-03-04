export interface SPARQLQueryRequest {
  query: string;
  data: string;
  inference?: boolean;
}

export interface SPARQLResponse {
  length: number;
  result: string;
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

export type QueryType = 'select' | 'ask' | 'describe' | 'construct';

export interface QueryTemplate {
  type: QueryType;
  label: string;
  query: string;
}

export interface EditorState {
  query: string;
  data: string;
}

export type SerializationFormat =
  | 'sparql-json' // application/sparql-results+json (SELECT/ASK)
  | 'csv' // text/csv (SELECT/ASK)
  | 'sparql-xml' // application/sparql-results+xml (SELECT/ASK)
  | 'turtle' // text/turtle (DESCRIBE/CONSTRUCT)
  | 'json-ld' // application/ld+json (DESCRIBE/CONSTRUCT)
  | 'rdf-xml'; // application/rdf+xml (DESCRIBE/CONSTRUCT)

export interface QueryExecutionResult {
  data: string;
  duration: number;
  format: SerializationFormat;
}

export interface Prefix {
  prefix: string;
  namespace: string;
}

export interface SHACLValidationRequest {
  data: string;
  shapes: string;
  inference?: boolean;
}

export interface SHACLValidationResponse {
  length: number;
  result_content_type: string | null;
  result: string;
}

export interface SHACLError {
  detail: string;
}
