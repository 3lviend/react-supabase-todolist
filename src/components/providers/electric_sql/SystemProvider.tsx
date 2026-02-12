import {
  getElectricUrl,
  LISTS_TABLE,
  TODOS_TABLE,
  type ListRecord,
  type TodoRecord
} from '@/library/electric_sql/AppSchema';
import { SupabaseConnector } from '@/library/electric_sql/SupabaseConnector';
import { getElectricDatabase, startElectricSync } from '@/library/electric_sql/ElectricDatabase';
import { startWriteQueueLoop } from '@/library/electric_sql/WriteQueue';
import { CircularProgress, Box, Typography } from '@mui/material';
import { PGliteProvider, useLiveQuery, usePGlite } from '@electric-sql/pglite-react';
import type { PGlite } from '@electric-sql/pglite';
import React, { Suspense } from 'react';
import { NavigationPanelContextProvider } from '../../navigation/NavigationPanelContext';
import { SupabaseContext } from '../SyncProvider';

// useSupabase is provided via the shared SupabaseContext from SyncProvider

export type EnhancedListRecord = ListRecord & { total_tasks: number; completed_tasks: number };

/**
 * ElectricSQL sync data context.
 * Provides reactive access to lists and todos from PGlite.
 */
export type ElectricSyncData = {
  lists: EnhancedListRecord[];
  todos: TodoRecord[];
  isLoading: boolean;
};

const ElectricSyncContext = React.createContext<ElectricSyncData>({
  lists: [],
  todos: [],
  isLoading: true
});

export const useElectricSync = () => React.useContext(ElectricSyncContext);

/**
 * ElectricSQL sync status context — exposes connection state + connect/disconnect.
 */
export type ElectricSyncStatus = {
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const ElectricSyncStatusContext = React.createContext<ElectricSyncStatus>({
  connected: false,
  connecting: false,
  connect: async () => { },
  disconnect: () => { }
});

export const useElectricSyncStatus = () => React.useContext(ElectricSyncStatusContext);

/**
 * Inner provider that uses PGlite live queries for reactive data.
 * Must be rendered inside PGliteProvider.
 */
const ElectricDataProvider = ({ children, connector }: { children: React.ReactNode; connector: SupabaseConnector }) => {
  // Live query for lists with task counts
  const listsResult = useLiveQuery<EnhancedListRecord>(
    `SELECT
       l.*,
       COALESCE(COUNT(t.id), 0)::int AS total_tasks,
       COALESCE(SUM(CASE WHEN t.completed = true THEN 1 ELSE 0 END), 0)::int AS completed_tasks
     FROM ${LISTS_TABLE} l
     LEFT JOIN ${TODOS_TABLE} t ON t.list_id = l.id
     GROUP BY l.id
     ORDER BY l.created_at DESC`
  );

  // Live query for all todos
  const todosResult = useLiveQuery<TodoRecord>(
    `SELECT * FROM ${TODOS_TABLE} ORDER BY created_at DESC, id`
  );

  const syncData = React.useMemo<ElectricSyncData>(() => ({
    lists: listsResult?.rows ?? [],
    todos: todosResult?.rows ?? [],
    isLoading: !listsResult || !todosResult
  }), [listsResult, todosResult]);

  return (
    <ElectricSyncContext.Provider value={syncData}>
      <SupabaseContext.Provider value={connector}>
        <NavigationPanelContextProvider>{children}</NavigationPanelContextProvider>
      </SupabaseContext.Provider>
    </ElectricSyncContext.Provider>
  );
};

/**
 * Main ElectricSQL system provider with PGlite local-first support.
 */
export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
  const [connector] = React.useState(() => new SupabaseConnector());
  const [db, setDb] = React.useState<PGlite | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [connected, setConnected] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);

  // Refs to hold cleanup/sync handles so connect/disconnect can manage them
  const syncHandleRef = React.useRef<{ unsubscribe: () => void } | null>(null);
  const writeQueueCleanupRef = React.useRef<(() => void) | null>(null);
  const dbRef = React.useRef<PGlite | null>(null);

  const connectSync = React.useCallback(async () => {
    const pglite = dbRef.current;
    if (!pglite || connected || connecting) return;

    setConnecting(true);
    try {
      syncHandleRef.current = await startElectricSync(pglite);
      writeQueueCleanupRef.current = startWriteQueueLoop(pglite, connector);
      setConnected(true);
      console.log('[Electric] Sync connected');
    } catch (err: any) {
      console.error('[Electric] Connect error:', err);
    } finally {
      setConnecting(false);
    }
  }, [connected, connecting, connector]);

  const disconnectSync = React.useCallback(() => {
    syncHandleRef.current?.unsubscribe();
    syncHandleRef.current = null;
    writeQueueCleanupRef.current?.();
    writeQueueCleanupRef.current = null;
    setConnected(false);
    console.log('[Electric] Sync disconnected');
  }, []);

  React.useEffect(() => {
    const init = async () => {
      try {
        await connector.init();
        const pglite = await getElectricDatabase();
        setDb(pglite);
        dbRef.current = pglite;

        // Auto-connect on init
        setConnecting(true);
        syncHandleRef.current = await startElectricSync(pglite);
        writeQueueCleanupRef.current = startWriteQueueLoop(pglite, connector);
        setConnected(true);
        setConnecting(false);

        setIsInitializing(false);
      } catch (err: any) {
        console.error('[Electric] Initialization error:', err);
        setError(err?.message ?? 'Failed to initialize ElectricSQL');
        setIsInitializing(false);
        setConnecting(false);
      }
    };

    init();

    return () => {
      syncHandleRef.current?.unsubscribe();
      writeQueueCleanupRef.current?.();
    };
  }, [connector]);

  const syncStatus = React.useMemo<ElectricSyncStatus>(() => ({
    connected,
    connecting,
    connect: connectSync,
    disconnect: disconnectSync
  }), [connected, connecting, connectSync, disconnectSync]);

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">ElectricSQL Error: {error}</Typography>
      </Box>
    );
  }

  if (isInitializing || !db) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Suspense fallback={<CircularProgress />}>
      <ElectricSyncStatusContext.Provider value={syncStatus}>
        <PGliteProvider db={db as any}>
          <ElectricDataProvider connector={connector}>
            {children}
          </ElectricDataProvider>
        </PGliteProvider>
      </ElectricSyncStatusContext.Provider>
    </Suspense>
  );
};

export default SystemProvider;
