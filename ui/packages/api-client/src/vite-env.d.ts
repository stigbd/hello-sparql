/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPARQL_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
