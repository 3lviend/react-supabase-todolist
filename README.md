# Supabase CRDT Web Demo: Todo List

## Overview

Demo app demonstrating use of the [ElectricSQL SDK for Web](https://www.npmjs.com/package/@electric-sql/pglite-react) together with Supabase.

## Run Demo

Prerequisites:
* To run this demo, you need to have properly configured Supabase and ElectricSQL projects. Follow the instructions in our Supabase<>ElectricSQL integration guide:
  * [Configure Supabase](https://supabase.com/partners/integrations/electricsql)
  * [Configure ElectricSQL](https://electric-sql.com/docs/integrations/supabase)

Switch into the demo's directory:

```bash
cd react-supabase-todolist
```

Use [pnpm](https://pnpm.io/installation) to install dependencies:

```bash
pnpm install
```

Set up the Environment variables: Copy the `.env.local.template` file:

```bash
cp .env.local.template .env.local
```

And then edit `.env.local` to insert your credentials for Supabase.

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Learn More

To learn more about ElectricSQL, see the [ElectricSQL docs](https://electric-sql.com/docs).
To learn more about Supabase, see the [Supabase docs](https://supabase.com/docs).
