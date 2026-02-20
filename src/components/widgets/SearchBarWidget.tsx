import { Autocomplete, Box, Card, CardContent, FormControl, TextField, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchResult, searchTable } from '@/app/utils/fts_helpers';
import { TODO_LISTS_ROUTE } from '@/app/router';
import { usePGliteOptional } from '@/hooks/useSyncEngine';

const LISTS_TABLE = 'lists';

// This is a simple search bar widget that allows users to search for lists and todo items
export const SearchBarWidget: React.FC<any> = () => {
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [value, setValue] = React.useState<SearchResult | null>(null);

  const navigate = useNavigate();
  const pglite = usePGliteOptional();

  const handleInputChange = async (value: string) => {
    if (value.length !== 0 && pglite) {
      let listsSearchResults: any[] = [];
      const todoItemsSearchResults = await searchTable(pglite, value, 'todos');

      for (let i = 0; i < todoItemsSearchResults.length; i++) {
        // Fetch list name for the todo
        const listId = todoItemsSearchResults[i]['list_id'];
        const res = await pglite.query(`SELECT name FROM ${LISTS_TABLE} WHERE id = $1`, [listId]);
        if (res.rows.length > 0) {
          todoItemsSearchResults[i]['list_name'] = (res.rows[0] as any).name;
        } else {
          todoItemsSearchResults[i]['list_name'] = 'Unknown List';
        }
      }

      if (!todoItemsSearchResults.length) {
        listsSearchResults = await searchTable(pglite, value, 'lists');
      }

      const formattedListResults: SearchResult[] = listsSearchResults.map(
        (result) => new SearchResult(result['id'], result['name'])
      );
      const formattedTodoItemsResults: SearchResult[] = todoItemsSearchResults.map((result) => {
        return new SearchResult(result['list_id'], result['list_name'] ?? '', result['description']);
      });
      setSearchResults([...formattedTodoItemsResults, ...formattedListResults]);
    }
  };

  return (
    <div>
      <FormControl sx={{ my: 1, display: 'flex' }}>
        <Autocomplete
          freeSolo
          id="autocomplete-search"
          options={searchResults}
          value={value?.id}
          getOptionLabel={(option) => {
            if (option instanceof SearchResult) {
              return option.todoName ?? option.listName;
            }
            return option;
          }}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Card variant="outlined" sx={{ display: 'flex', width: '100%' }}>
                <CardContent>
                  {option.listName && (
                    <Typography sx={{ fontSize: 18 }} color="text.primary" gutterBottom>
                      {option.listName}
                    </Typography>
                  )}
                  {option.todoName && (
                    <Typography sx={{ fontSize: 14 }} color="text.secondary">
                      {'\u2022'} {option.todoName}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
          filterOptions={(x) => x}
          onInputChange={(event, newInputValue, reason) => {
            if (reason === 'clear') {
              setValue(null);
              setSearchResults([]);
              return;
            }
            handleInputChange(newInputValue);
          }}
          onChange={(event, newValue, reason) => {
            if (reason === 'selectOption') {
              if (newValue instanceof SearchResult) {
                navigate(TODO_LISTS_ROUTE + '/' + newValue.id);
              }
            }
          }}
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search..."
              InputProps={{
                ...params.InputProps
              }}
            />
          )}
        />
      </FormControl>
    </div>
  );
};
