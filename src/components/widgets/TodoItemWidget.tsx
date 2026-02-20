import { usePGliteOptional } from '@/hooks/useSyncEngine';
import { useSupabase } from '../providers/SyncProvider';
import { queueWrite } from '@/library/electric_sql/WriteQueue';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { Box, IconButton, ListItem, ListItemAvatar, ListItemButton, ListItemText, Paper, TextField, styled } from '@mui/material';
import React from 'react';

const TODOS_TABLE = 'todos';

export type TodoItemWidgetProps = {
  id: string;
  description: string | null;
  isComplete: boolean;
};

export const TodoItemWidget: React.FC<TodoItemWidgetProps> = React.memo((props) => {
  const { id, description, isComplete } = props;

  const pglite = usePGliteOptional();
  const supabase = useSupabase();

  const deleteTodo = React.useCallback(async () => {
    if (pglite) {
      // PGlite: delete locally + queue for sync
      await pglite.query(`DELETE FROM ${TODOS_TABLE} WHERE id = $1`, [id]);
      await queueWrite(pglite, TODOS_TABLE, 'delete', {}, id);
    }
  }, [id, pglite]);

  const toggleCompletion = React.useCallback(async () => {
    let completedAt: string | null = null;
    let completedBy: string | null = null;

    if (!isComplete) {
      const userID = supabase?.currentSession?.user.id;
      if (!userID) throw new Error(`Could not get user ID.`);
      completedAt = new Date().toISOString();
      completedBy = userID;
    }

    if (pglite) {
      // PGlite: update locally + queue for sync
      const newCompleted = !isComplete;
      await pglite.query(
        `UPDATE ${TODOS_TABLE} SET completed = $1, completed_at = $2, completed_by = $3 WHERE id = $4`,
        [newCompleted, completedAt, completedBy, id]
      );
      await queueWrite(pglite, TODOS_TABLE, 'update', {
        completed: newCompleted,
        completed_at: completedAt,
        completed_by: completedBy
      }, id);
    }
  }, [id, isComplete, pglite, supabase]);

  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(description || '');

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditText(description || '');
    setIsEditing(true);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const saveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editText.trim() === description) {
      setIsEditing(false);
      return;
    }

    if (pglite) {
      // PGlite: update locally + queue for sync
      await pglite.query(
        `UPDATE ${TODOS_TABLE} SET description = $1 WHERE id = $2`,
        [editText, id]
      );
      await queueWrite(pglite, TODOS_TABLE, 'update', { description: editText }, id);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit(e as any);
    } else if (e.key === 'Escape') {
      cancelEditing(e as any);
    }
  };

  return (
    <S.MainPaper elevation={1}>
      <ListItem
        disablePadding
        secondaryAction={
          <Box>
            {isEditing ? (
              <IconButton edge="end" aria-label="save" onClick={saveEdit}>
                <SaveIcon />
              </IconButton>
            ) : (
              <IconButton edge="end" aria-label="edit" onClick={startEditing}>
                <EditIcon />
              </IconButton>
            )}
            <IconButton edge="end" aria-label="delete" onClick={deleteTodo}>
              <DeleteIcon />
            </IconButton>
          </Box>
        }>
        <ListItemButton onClick={!isEditing ? toggleCompletion : undefined}>
          <ListItemAvatar>
            <IconButton edge="end" aria-label="toggle" onClick={!isEditing ? toggleCompletion : undefined}>
              {props.isComplete ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
            </IconButton>
          </ListItemAvatar>
          {isEditing ? (
            <TextField
              fullWidth
              variant="standard"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <ListItemText primary={description} sx={{ textDecoration: props.isComplete ? 'line-through' : 'none' }} />
          )}
        </ListItemButton>
      </ListItem>
    </S.MainPaper>
  );
});

namespace S {
  export const MainPaper = styled(Paper)`
    margin-bottom: 10px;
  `;
}
