/**
 * Offline write queue for ElectricSQL mode.
 * Writes go to PGlite's _electric_write_queue table first, then
 * are flushed to Supabase REST API when online.
 */
import type { SupabaseConnector } from '@/library/electric_sql/SupabaseConnector';

// Use a minimal interface to avoid PGlite vs PGliteWithLive type mismatch
interface PGliteQueryable {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
}

export type QueuedWrite = {
  id: number;
  target_table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  record_id: string | null;
  status: string;
  created_at: string;
  error_message: string | null;
};

/**
 * Queue a write operation to be synced to Supabase when online.
 * The write is stored in PGlite's _electric_write_queue table.
 */
export async function queueWrite(
  db: PGliteQueryable,
  table: string,
  operation: 'insert' | 'update' | 'delete',
  data: Record<string, any>,
  recordId?: string
): Promise<void> {
  await db.query(
    `INSERT INTO _electric_write_queue (target_table, operation, data, record_id)
     VALUES ($1, $2, $3::jsonb, $4)`,
    [table, operation, JSON.stringify(data), recordId ?? null]
  );
}

/**
 * Process all pending writes in the queue, sending them to Supabase.
 * Successfully sent items are marked as 'completed'.
 * Failed items are marked with error messages for retry.
 */
export async function flushWriteQueue(
  db: PGliteQueryable,
  connector: SupabaseConnector
): Promise<{ processed: number; failed: number }> {
  // Also retry errored items (not just pending)
  const result = await db.query<QueuedWrite>(
    `SELECT * FROM _electric_write_queue WHERE status IN ('pending', 'error') ORDER BY id ASC`
  );

  if (result.rows.length === 0) return { processed: 0, failed: 0 };

  console.log(`[WriteQueue] Processing ${result.rows.length} queued write(s)...`);

  let processed = 0;
  let failed = 0;

  for (const item of result.rows) {
    try {
      // PGlite JSONB may return data as a string — parse it if needed
      const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;

      console.log(`[WriteQueue] Flushing item #${item.id}: ${item.operation} on ${item.target_table}`, data);

      switch (item.operation) {
        case 'insert':
          await connector.upsertRecord(item.target_table, data);
          break;
        case 'update':
          if (!item.record_id) throw new Error('record_id required for update');
          await connector.updateRecord(item.target_table, item.record_id, data);
          break;
        case 'delete':
          if (!item.record_id) throw new Error('record_id required for delete');
          await connector.deleteRecord(item.target_table, item.record_id);
          break;
      }

      await db.query(
        `UPDATE _electric_write_queue SET status = 'completed' WHERE id = $1`,
        [item.id]
      );
      processed++;
      console.log(`[WriteQueue] ✓ Item #${item.id} synced successfully`);
    } catch (error: any) {
      await db.query(
        `UPDATE _electric_write_queue SET status = 'error', error_message = $1 WHERE id = $2`,
        [error?.message ?? 'Unknown error', item.id]
      );
      failed++;
      console.error(`[WriteQueue] ✗ Failed to sync item ${item.id}:`, error);
    }
  }

  // Clean up old completed items
  await db.query(
    `DELETE FROM _electric_write_queue WHERE status = 'completed'`
  );

  return { processed, failed };
}

/**
 * Start the write queue flush loop.
 * Flushes on:
 * - Online event (network reconnection)
 * - Periodic interval (every 5 seconds when online)
 * Returns a cleanup function to stop the loop.
 */
export function startWriteQueueLoop(
  db: PGliteQueryable,
  connector: SupabaseConnector
): () => void {
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const flush = async () => {
    if (!navigator.onLine) return;
    try {
      const result = await flushWriteQueue(db, connector);
      if (result.processed > 0) {
        console.log(`[WriteQueue] Flushed ${result.processed} items, ${result.failed} failed`);
      }
    } catch (error) {
      console.error('[WriteQueue] Flush error:', error);
    }
  };

  // Flush immediately, then on interval
  flush();
  intervalId = setInterval(flush, 5000);

  // Also flush when coming back online
  const onlineHandler = () => {
    console.log('[WriteQueue] Online detected, flushing...');
    flush();
  };
  window.addEventListener('online', onlineHandler);

  return () => {
    if (intervalId) clearInterval(intervalId);
    window.removeEventListener('online', onlineHandler);
  };
}
