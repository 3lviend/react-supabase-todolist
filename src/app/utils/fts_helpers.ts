/**
 * Search the table for the given searchTerm using PGlite.
 * @param db PGlite instance
 * @param searchTerm
 * @param tableName
 * @returns results from the table
 */
export async function searchTable(db: any, searchTerm: string, tableName: string): Promise<any[]> {
  if (!db) return [];
  const likeTerm = `%${searchTerm}%`;
  if (tableName === 'lists') {
    const res = await db.query(`SELECT * FROM lists WHERE name ILIKE $1`, [likeTerm]);
    return res.rows;
  } else if (tableName === 'todos') {
    const res = await db.query(`SELECT * FROM todos WHERE description ILIKE $1`, [likeTerm]);
    return res.rows;
  }
  return [];
}

//Used to display the search results in the autocomplete text field
export class SearchResult {
  id: string;
  todoName: string | null;
  listName: string;

  constructor(id: string, listName: string, todoName: string | null = null) {
    this.id = id;
    this.listName = listName;
    this.todoName = todoName;
  }
}
