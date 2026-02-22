/**
 * PGlite database initialization with Electric sync plugin.
 * Creates a local Postgres database in the browser with IndexedDB persistence
 * and syncs data from ElectricSQL service.
 */
import { PGlite } from '@electric-sql/pglite';
import { live } from '@electric-sql/pglite/live';
import { electricSync } from '@electric-sql/pglite-sync';
import { getElectricUrl, LISTS_TABLE, TODOS_TABLE } from './AppSchema';

let dbInstance: PGlite | null = null;
let dbInitPromise: Promise<PGlite> | null = null;

/**
 * SQL to create local tables matching the Supabase schema.
 * These tables will be populated by the Electric sync plugin.
 */
const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS ${LISTS_TABLE} (
    id TEXT PRIMARY KEY,
    created_at TEXT,
    name TEXT,
    owner_id TEXT
  );

  CREATE TABLE IF NOT EXISTS ${TODOS_TABLE} (
    id TEXT PRIMARY KEY,
    list_id TEXT REFERENCES ${LISTS_TABLE}(id),
    created_at TEXT,
    completed_at TEXT,
    description TEXT,
    created_by TEXT,
    completed_by TEXT,
    completed BOOLEAN DEFAULT false
  );

  CREATE TABLE IF NOT EXISTS _electric_write_queue (
    id SERIAL PRIMARY KEY,
    target_table TEXT NOT NULL,
    operation TEXT NOT NULL,
    data JSONB NOT NULL,
    record_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
    error_message TEXT
  );
`;

/**
 * Initialize (or return existing) PGlite instance with Electric sync.
 */
export async function getElectricDatabase(): Promise<PGlite> {
  if (dbInstance) return dbInstance;

  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = initDatabase();
  dbInstance = await dbInitPromise;
  return dbInstance;
}

async function initDatabase(): Promise<PGlite> {
  const db = await PGlite.create({
    dataDir: 'idb://electric-todolist',
    extensions: {
      live,
      electric: electricSync()
    }
  });

  // Create local tables
  await db.exec(CREATE_TABLES_SQL);

  // Auto-migration: Ensure 'completed' is BOOLEAN (fix for existing PGlite DBs with INTEGER)
  try {
    await db.exec(`ALTER TABLE ${TODOS_TABLE} ALTER COLUMN completed TYPE BOOLEAN USING completed::boolean`);
    console.log('[Electric] Successfully migrated "completed" column to BOOLEAN');
  } catch (e) {
    // Ignore error (likely already boolean or table empty)
    // console.log('[Electric] Column migration skipped:', e);
  }

  return db;
}

/**
 * Start syncing shapes from Electric service into local PGlite tables.
 * Returns an unsubscribe function to stop syncing.
 */
export async function startElectricSync(db: PGlite): Promise<{ unsubscribe: () => void }> {
  let electricUrl = getElectricUrl();
  const envParams: Record<string, string> = {};

  // Robust parsing: extract query params and normalize the base URL
  try {
    const urlObj = new URL(electricUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    // Extract existing params (e.g., source_id, source_secret)
    urlObj.searchParams.forEach((value, key) => {
      // Skip 'offset' if it's -1 or similar, as we want the SDK to manage it, 
      // but 'source_id' is mandatory for Electric Cloud.
      if (key !== 'offset' && key !== 'table') {
        envParams[key] = value;
      }
    });

    if (urlObj.pathname.includes('/v1/shape')) {
      electricUrl = baseUrl + '/v1/shape';
    } else {
      electricUrl = baseUrl;
    }
  } catch (e) {
    console.warn('[Electric] Invalid VITE_ELECTRIC_SQL_SERVICE_URL, using as is:', electricUrl);
  }

  const sync = await (db as any).electric.syncShapesToTables({
    shapes: {
      lists: {
        shape: {
          url: electricUrl.endsWith('/v1/shape') ? electricUrl : `${electricUrl}/v1/shape`,
          params: { ...envParams, table: LISTS_TABLE }
        },
        table: LISTS_TABLE,
        primaryKey: ['id']
      },
      todos: {
        shape: {
          url: electricUrl.endsWith('/v1/shape') ? electricUrl : `${electricUrl}/v1/shape`,
          params: { ...envParams, table: TODOS_TABLE }
        },
        table: TODOS_TABLE,
        primaryKey: ['id']
      }
    },
    key: 'todolist-sync',
    onInitialSync: () => {
      console.log('[Electric] Initial sync complete');
    },
    onError: (error: Error) => {
      console.error('[Electric] Sync error:', error);
    }
  });

  return sync;
}
