/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPARQL_ENDPOINT: string;
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
