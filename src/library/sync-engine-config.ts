export enum SyncEngine {
  ElectricSQL = 'electric_sql'
}

export function getSyncEngine(): SyncEngine {
  return SyncEngine.ElectricSQL;
}
