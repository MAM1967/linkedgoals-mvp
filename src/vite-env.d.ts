/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_LINKEDIN_CLIENT_ID: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
