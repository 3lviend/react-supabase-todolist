/**
 * ElectricSQL Shape definitions for the todo app tables.
 * These define the Electric sync shapes and TypeScript types.
 */

export const LISTS_TABLE = 'lists';
export const TODOS_TABLE = 'todos';

/**
 * Returns the ElectricSQL service URL from environment.
 */
export function getElectricUrl(): string {
  return import.meta.env.VITE_ELECTRIC_SQL_SERVICE_URL;
}

/**
 * Shape params for the lists table.
 */
export const listsShapeParams = {
  table: LISTS_TABLE
};

/**
 * Shape params for the todos table.
 */
export const todosShapeParams = {
  table: TODOS_TABLE
};

// TypeScript types matching the database schema
export type ListRecord = {
  id: string;
  created_at: string;
  name: string;
  owner_id: string;
};

export type TodoRecord = {
  id: string;
  list_id: string;
  created_at: string;
  completed_at: string | null;
  description: string;
  created_by: string;
  completed_by: string | null;
  completed: number;
};
