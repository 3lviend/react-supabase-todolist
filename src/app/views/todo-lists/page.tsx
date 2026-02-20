import { NavigationPage } from '@/components/navigation/NavigationPage';
import { useSupabase } from '@/components/providers/SyncProvider';
import { SearchBarWidget } from '@/components/widgets/SearchBarWidget';
import { TodoListsWidget } from '@/components/widgets/TodoListsWidget';
import { LISTS_TABLE } from '@/library/electric_sql/AppSchema';
import { usePGliteOptional } from '@/hooks/useSyncEngine';
import { queueWrite } from '@/library/electric_sql/WriteQueue';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  styled
} from '@mui/material';
import Fab from '@mui/material/Fab';
import React from 'react';

export default function TodoListsPage() {
  const supabase = useSupabase();
  const pglite = usePGliteOptional();

  const [showPrompt, setShowPrompt] = React.useState(false);
  const nameInputRef = React.createRef<HTMLInputElement>();

  const createNewList = async (name: string) => {
    const session = await supabase?.client.auth.getSession();
    const userID = session?.data.session?.user?.id;
    if (!userID) {
      throw new Error(`Could not create new lists, no userID found`);
    }

    if (pglite) {
      // ElectricSQL + PGlite: write locally (instant, offline-capable) + queue for sync
      const newId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const record = { id: newId, created_at: createdAt, name, owner_id: userID };

      await pglite.query(
        `INSERT INTO ${LISTS_TABLE} (id, created_at, name, owner_id) VALUES ($1, $2, $3, $4)`,
        [newId, createdAt, name, userID]
      );
      await queueWrite(pglite, LISTS_TABLE, 'insert', record);
    }
  };

  return (
    <NavigationPage title="Todo Lists">
      <Box>
        <S.FloatingActionButton onClick={() => setShowPrompt(true)} sx={{ display: showPrompt ? 'none' : 'flex' }}>
          <AddIcon />
        </S.FloatingActionButton>
        <Box>
          <SearchBarWidget />
          <TodoListsWidget />
        </Box>
        <Dialog
          open={showPrompt}
          onClose={() => setShowPrompt(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description">
          <DialogTitle id="alert-dialog-title">{'Create Todo List'}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">Enter a name for a new todo list</DialogContentText>
            <TextField
              sx={{ marginTop: '10px' }}
              fullWidth
              inputRef={nameInputRef}
              label="List Name"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  await createNewList(nameInputRef.current!.value);
                  setShowPrompt(false);
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPrompt(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await createNewList(nameInputRef.current!.value);
                setShowPrompt(false);
              }}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </NavigationPage>
  );
}

namespace S {
  export const FloatingActionButton = styled(Fab)`
    position: absolute;
    bottom: 20px;
    right: 20px;
  `;
}
