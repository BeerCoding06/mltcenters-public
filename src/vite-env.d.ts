/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TOEIC_GAME_URL?: string;
  readonly VITE_PROGRAM_VIDEO_YOUTUBE_ID?: string;
  readonly VITE_PROGRAM_VIDEO_SRC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
