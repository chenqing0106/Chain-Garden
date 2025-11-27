/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PINATA_JWT?: string;
  readonly VITE_PINATA_API_BASE?: string;
  readonly VITE_PINATA_GATEWAY?: string;
  readonly GEMINI_API_KEY?: string;
  readonly API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

