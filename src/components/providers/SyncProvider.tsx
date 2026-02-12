import React from 'react';
import { getSyncEngine, SyncEngine } from '@/library/sync-engine-config';
import { SupabaseConnector as BaseSupabaseConnector } from '@/library/supabase/SupabaseConnector';

// Re-export the shared SupabaseConnector type for consumers
export type { SupabaseConnector as BaseSupabaseConnector } from '@/library/supabase/SupabaseConnector';

/**
 * Unified Supabase context that works across both sync engines.
 * Consumer files should import useSupabase from this file.
 * Engine providers should import SupabaseContext to provide the value.
 */
export const SupabaseContext = React.createContext<BaseSupabaseConnector | null>(null);
export const useSupabase = () => React.useContext(SupabaseContext);

// Lazy-load providers so we don't bundle both engines unnecessarily
const PowerSyncSystemProvider = React.lazy(
  () => import('@/components/providers/powersync/SystemProvider')
);
const ElectricSQLSystemProvider = React.lazy(
  () => import('@/components/providers/electric_sql/SystemProvider')
);

/**
 * Top-level SyncProvider that switches between PowerSync and ElectricSQL
 * based on the VITE_SYNC_ENGINE environment variable.
 */
export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  const engine = getSyncEngine();

  if (engine === SyncEngine.ElectricSQL) {
    return <ElectricSQLSystemProvider>{children}</ElectricSQLSystemProvider>;
  }

  return <PowerSyncSystemProvider>{children}</PowerSyncSystemProvider>;
};

export default SyncProvider;
