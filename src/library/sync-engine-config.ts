/**
 * Sync engine configuration.
 *
 * Set `VITE_SYNC_ENGINE` in `.env.local` to switch between engines:
 *   - 'powersync'    (default) — PowerSync with local SQLite
 *   - 'electric_sql' — ElectricSQL with HTTP Shape streams
 */

export enum SyncEngine {
  PowerSync = 'powersync',
  ElectricSQL = 'electric_sql'
}

export function getSyncEngine(): SyncEngine {
  const value = import.meta.env.VITE_SYNC_ENGINE;
  if (value === SyncEngine.ElectricSQL) {
    return SyncEngine.ElectricSQL;
  }
  return SyncEngine.PowerSync;
}
