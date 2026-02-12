import { List } from '@mui/material';
import { useWatchedQuerySubscription as _useWatchedQuerySubscription } from '@powersync/react';
import { useIsPowerSync } from '@/hooks/useSyncEngine';
import { ListItemWidget } from './ListItemWidget';

// PowerSync imports (used conditionally)
import { useQueryStore } from '../providers/powersync/SystemProvider';

// ElectricSQL imports
import { useElectricSync } from '../providers/electric_sql/SystemProvider';

export type TodoListsWidgetProps = {
  selectedId?: string;
};

const description = (total: number, completed: number = 0) => {
  return `${total - completed} pending, ${completed} completed`;
};

/**
 * PowerSync version: uses DifferentialWatchedQuery from useQueryStore.
 */
function PowerSyncTodoListsWidget(props: TodoListsWidgetProps) {
  const queries = useQueryStore();
  const { data: listRecords, isLoading } = _useWatchedQuerySubscription(queries!.lists);

  if (isLoading && listRecords.length == 0) {
    return <div>Loading...</div>;
  }

  return (
    <List dense={false}>
      {listRecords.map((r: any) => (
        <ListItemWidget
          key={r.id}
          id={r.id}
          title={r.name ?? ''}
          description={description(r.total_tasks, r.completed_tasks)}
          selected={r.id == props.selectedId}
        />
      ))}
    </List>
  );
}

/**
 * ElectricSQL version: uses shape data from ElectricSyncContext.
 */
function ElectricTodoListsWidget(props: TodoListsWidgetProps) {
  const { lists, isLoading } = useElectricSync();

  if (isLoading && lists.length == 0) {
    return <div>Loading...</div>;
  }

  return (
    <List dense={false}>
      {lists.map((r) => (
        <ListItemWidget
          key={r.id}
          id={r.id}
          title={r.name ?? ''}
          description={description(r.total_tasks, r.completed_tasks)}
          selected={r.id == props.selectedId}
        />
      ))}
    </List>
  );
}

export function TodoListsWidget(props: TodoListsWidgetProps) {
  const isPowerSync = useIsPowerSync();
  return isPowerSync ? <PowerSyncTodoListsWidget {...props} /> : <ElectricTodoListsWidget {...props} />;
}
