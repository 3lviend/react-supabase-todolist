import { SupabaseConnector as BaseSupabaseConnector } from '@/library/supabase/SupabaseConnector';

/**
 * ElectricSQL-specific Supabase connector.
 * Extends the shared connector with direct Supabase REST write methods,
 * since ElectricSQL only handles read sync (not writes).
 */
export class SupabaseConnector extends BaseSupabaseConnector {
  /**
   * Upsert a record directly via Supabase REST API.
   */
  async upsertRecord(table: string, record: Record<string, any>) {
    const { error } = await this.client.from(table).upsert(record);
    if (error) {
      console.error(`ElectricSQL upsert error on ${table}:`, error);
      throw error;
    }
  }

  /**
   * Update a record directly via Supabase REST API.
   */
  async updateRecord(table: string, id: string, data: Record<string, any>) {
    const { error } = await this.client.from(table).update(data).eq('id', id);
    if (error) {
      console.error(`ElectricSQL update error on ${table}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record directly via Supabase REST API.
   */
  async deleteRecord(table: string, id: string) {
    const { error } = await this.client.from(table).delete().eq('id', id);
    if (error) {
      console.error(`ElectricSQL delete error on ${table}:`, error);
      throw error;
    }
  }
}
