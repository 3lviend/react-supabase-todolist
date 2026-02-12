/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_POWERSYNC_URL: string;
  readonly VITE_SYNC_ENGINE: string;
  readonly VITE_ELECTRIC_SQL_SERVICE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
