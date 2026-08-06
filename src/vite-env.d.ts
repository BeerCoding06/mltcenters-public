/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TOEIC_GAME_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
