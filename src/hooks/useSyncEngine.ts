import { usePGlite as _usePGlite } from '@electric-sql/pglite-react';

/**
 * Safe wrapper around usePGlite() for backward compatibility during refactor.
 */
export function usePGliteOptional() {
  return _usePGlite();
}
