/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPM_AVATAR_URL: string;
  readonly VITE_ANIM_RUN?: string;
  readonly VITE_ANIM_IDLE?: string;
  readonly VITE_ANIM_JUMP?: string;
  readonly VITE_ANIM_WIN?: string;
  readonly VITE_ANIM_LOSE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
