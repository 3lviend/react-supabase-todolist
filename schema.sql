-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  CONSTRAINT lists_pkey PRIMARY KEY (id),
  CONSTRAINT lists_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.todos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  description text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_by uuid,
  completed_by uuid,
  list_id uuid NOT NULL,
  CONSTRAINT todos_pkey PRIMARY KEY (id),
  CONSTRAINT todos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT todos_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES auth.users(id),
  CONSTRAINT todos_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id)
);

-- WARNING: This schema is for context only and is not meant to be run.
