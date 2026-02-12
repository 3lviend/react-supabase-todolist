import { NavigationPage } from '@/components/navigation/NavigationPage';
import { useSupabase } from '@/components/providers/SyncProvider';
import { TodoItemWidget } from '@/components/widgets/TodoItemWidget';
import { LISTS_TABLE, TODOS_TABLE, TodoRecord } from '@/library/powersync/AppSchema';
import { useIsPowerSync } from '@/hooks/useSyncEngine';
import { usePowerSync as _usePowerSync, useQuery } from '@powersync/react';
import { useLiveQuery } from '@electric-sql/pglite-react';
import { usePGlite } from '@electric-sql/pglite-react';
import { queueWrite } from '@/library/electric_sql/WriteQueue';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  TextField,
  Typography,
  styled
} from '@mui/material';
import Fab from '@mui/material/Fab';
import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';

/**
 * PowerSync-specific section that uses useQuery for reactive SQL queries.
 */
const PowerSyncTodoEditSection = () => {
  const powerSync = _usePowerSync();
  const supabase = useSupabase();
  const { id: listID } = useParams();

  const {
    data: [listRecord]
  } = useQuery(
    /* sql */ `SELECT name FROM ${LISTS_TABLE} WHERE id = ?`,
    [listID]
  ) as { data: Array<{ name: string }> };

  const { data: todos } = useQuery(
    /* sql */ `SELECT * FROM ${TODOS_TABLE} WHERE list_id = ? ORDER BY created_at DESC, id`,
    [listID]
  ) as { data: TodoRecord[] };

  const [showPrompt, setShowPrompt] = React.useState(false);
  const nameInputRef = React.createRef<HTMLInputElement>();

  const createNewTodo = async (description: string) => {
    const userID = supabase?.currentSession?.user.id;
    if (!userID) throw new Error(`Could not get user ID.`);

    await powerSync.execute(
      /* sql */ `INSERT INTO ${TODOS_TABLE} (id, created_at, created_by, description, list_id) VALUES (uuid(), datetime(), ?, ?, ?)`,
      [userID, description, listID!]
    );
  };

  const renameList = async (newName: string) => {
    await powerSync.execute(
      /* sql */ `UPDATE ${LISTS_TABLE} SET name = ? WHERE id = ?`,
      [newName, listID!]
    );
  };

  if (!listRecord) {
    return (
      <Box>
        <Typography>No matching List found, please navigate back...</Typography>
      </Box>
    );
  }

  return (
    <TodoEditUI
      listName={listRecord.name}
      todos={todos}
      showPrompt={showPrompt}
      setShowPrompt={setShowPrompt}
      nameInputRef={nameInputRef}
      onCreateTodo={createNewTodo}
      onRename={renameList}
    />
  );
};

/**
 * ElectricSQL-specific section that uses PGlite live queries + local writes.
 */
const ElectricTodoEditSection = () => {
  const supabase = useSupabase();
  const db = usePGlite();
  const { id: listID } = useParams();

  // PGlite live query for the list record
  const listResult = useLiveQuery<{ name: string }>(
    `SELECT name FROM ${LISTS_TABLE} WHERE id = $1`,
    [listID]
  );

  // PGlite live query for todos in this list
  const todosResult = useLiveQuery<TodoRecord>(
    `SELECT * FROM ${TODOS_TABLE} WHERE list_id = $1 ORDER BY created_at DESC, id`,
    [listID]
  );

  const listRecord = listResult?.rows?.[0];
  const todos = todosResult?.rows ?? [];

  const [showPrompt, setShowPrompt] = React.useState(false);
  const nameInputRef = React.createRef<HTMLInputElement>();

  const createNewTodo = async (description: string) => {
    const userID = supabase?.currentSession?.user.id;
    if (!userID) throw new Error(`Could not get user ID.`);

    const newId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const record = {
      id: newId,
      created_at: createdAt,
      created_by: userID,
      description,
      list_id: listID,
      completed: false
    };

    // Write locally to PGlite (instant, offline-capable)
    await db.query(
      `INSERT INTO ${TODOS_TABLE} (id, created_at, created_by, description, list_id, completed)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newId, createdAt, userID, description, listID, false]
    );
    // Queue for Supabase sync
    await queueWrite(db, TODOS_TABLE, 'insert', record);
  };

  const renameList = async (newName: string) => {
    // Write locally to PGlite
    await db.query(
      `UPDATE ${LISTS_TABLE} SET name = $1 WHERE id = $2`,
      [newName, listID]
    );
    // Queue for Sync (update list)
    await queueWrite(db, LISTS_TABLE, 'update', { name: newName }, listID!);
  };

  if (!listResult || !todosResult) {
    return <CircularProgress />;
  }

  if (!listRecord) {
    return (
      <Box>
        <Typography>No matching List found, please navigate back...</Typography>
      </Box>
    );
  }

  return (
    <TodoEditUI
      listName={listRecord.name}
      todos={todos as any}
      showPrompt={showPrompt}
      setShowPrompt={setShowPrompt}
      nameInputRef={nameInputRef}
      onCreateTodo={createNewTodo}
      onRename={renameList}
    />
  );
};

/**
 * Shared UI for todo edit (used by both engine sections).
 */
type TodoEditUIProps = {
  listName: string;
  todos: Array<{ id: string; description: string | null; completed: number | null }>;
  showPrompt: boolean;
  setShowPrompt: (v: boolean) => void;
  nameInputRef: React.RefObject<HTMLInputElement>;
  onCreateTodo: (description: string) => Promise<void>;
  onRename: (newName: string) => Promise<void>;
};

const TodoEditUI: React.FC<TodoEditUIProps> = ({
  listName,
  todos,
  showPrompt,
  setShowPrompt,
  nameInputRef,
  onCreateTodo,
  onRename
}) => {
  const [showRenamePrompt, setShowRenamePrompt] = React.useState(false);
  const renameInputRef = React.useRef<HTMLInputElement>(null);

  const renameAction = (
    <IconButton color="inherit" onClick={() => setShowRenamePrompt(true)}>
      <EditIcon />
    </IconButton>
  );

  return (
    <NavigationPage title={`Todo List: ${listName}`} actions={renameAction}>
      <Box>
        <S.FloatingActionButton onClick={() => setShowPrompt(true)} sx={{ display: showPrompt ? 'none' : 'flex' }}>
          <AddIcon />
        </S.FloatingActionButton>
        <Box>
          <List dense={false}>
            {todos.map((r) => (
              <TodoItemWidget key={r.id} id={r.id} description={r.description} isComplete={r.completed == 1} />
            ))}
          </List>
        </Box>

        {/* Create Todo Dialog */}
        <Dialog
          open={showPrompt}
          onClose={() => setShowPrompt(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description">
          <DialogTitle id="alert-dialog-title">{'Create Todo Item'}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">Enter a description for a new todo item</DialogContentText>
            <TextField
              sx={{ marginTop: '10px' }}
              fullWidth
              inputRef={nameInputRef}
              label="Task Name"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  await onCreateTodo(nameInputRef.current!.value);
                  setShowPrompt(false);
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPrompt(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await onCreateTodo(nameInputRef.current!.value);
                setShowPrompt(false);
              }}>
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rename List Dialog */}
        <Dialog open={showRenamePrompt} onClose={() => setShowRenamePrompt(false)}>
          <DialogTitle>{'Rename List'}</DialogTitle>
          <DialogContent>
            <DialogContentText>Enter a new name for this list</DialogContentText>
            <TextField
              sx={{ marginTop: '10px' }}
              fullWidth
              inputRef={renameInputRef}
              label="List Name"
              defaultValue={listName}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (renameInputRef.current && renameInputRef.current.value.trim().length > 0) {
                    await onRename(renameInputRef.current.value);
                  }
                  setShowRenamePrompt(false);
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRenamePrompt(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (renameInputRef.current && renameInputRef.current.value.trim().length > 0) {
                  await onRename(renameInputRef.current.value);
                }
                setShowRenamePrompt(false);
              }}>
              Rename
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </NavigationPage>
  );
};

export default function TodoEditPage() {
  const isPowerSync = useIsPowerSync();

  return (
    <Box>
      <Suspense fallback={<CircularProgress />}>
        {isPowerSync ? <PowerSyncTodoEditSection /> : <ElectricTodoEditSection />}
      </Suspense>
    </Box>
  );
}

namespace S {
  export const FloatingActionButton = styled(Fab)`
    position: absolute;
    bottom: 20px;
    right: 20px;
  `;
}
