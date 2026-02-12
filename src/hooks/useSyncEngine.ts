import { getSyncEngine, SyncEngine } from '@/library/sync-engine-config';
import { usePowerSync as _usePowerSync, useStatus as _useStatus } from '@powersync/react';
import { usePGlite as _usePGlite } from '@electric-sql/pglite-react';

/**
 * Engine-aware hooks that abstract PowerSync vs ElectricSQL differences.
 *
 * Note: getSyncEngine() is effectively a compile-time constant (from VITE_SYNC_ENGINE env var).
 * The conditional hook calls below always take the same branch per build, which makes them
 * safe despite appearing to violate the Rules of Hooks.
 */

/**
 * Returns true when the app is using ElectricSQL as the sync engine.
 */
export function useIsElectricSQL(): boolean {
  return getSyncEngine() === SyncEngine.ElectricSQL;
}

/**
 * Returns true when the app is using PowerSync as the sync engine.
 */
export function useIsPowerSync(): boolean {
  return getSyncEngine() === SyncEngine.PowerSync;
}

/**
 * Safe wrapper around usePowerSync() that returns null in ElectricSQL mode
 * instead of throwing when no PowerSyncContext.Provider exists.
 */
export function usePowerSyncOptional() {
  if (getSyncEngine() !== SyncEngine.PowerSync) {
    return null;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return _usePowerSync();
}

/**
 * Safe wrapper around useStatus() that returns null in ElectricSQL mode.
 */
export function useStatusOptional() {
  if (getSyncEngine() !== SyncEngine.PowerSync) {
    return null;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return _useStatus();
}

/**
 * Safe wrapper around usePGlite() that returns null in PowerSync mode.
 * In ElectricSQL mode, returns the PGlite database instance for local SQL.
 */
export function usePGliteOptional() {
  if (getSyncEngine() !== SyncEngine.ElectricSQL) {
    return null;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return _usePGlite();
}
