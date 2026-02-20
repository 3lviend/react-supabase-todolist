import { List } from '@mui/material';
import { ListItemWidget } from './ListItemWidget';

// ElectricSQL imports
import { useElectricSync } from '../providers/electric_sql/SystemProvider';

export type TodoListsWidgetProps = {
  selectedId?: string;
};

const description = (total: number, completed: number = 0) => {
  return `${total - completed} pending, ${completed} completed`;
};

export function TodoListsWidget(props: TodoListsWidgetProps) {
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
