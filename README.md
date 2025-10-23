# Futsal Timer - Next.js + Supabase (starter)

This is a minimal starter project to track playing minutes for 10 fixed players.
Instructions:
1. Create a Supabase project and get SUPABASE_URL and SUPABASE_ANON_KEY.
2. Create the required tables in Supabase (SQL provided below).
3. Set environment variables in Vercel or locally:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Install dependencies: `npm install`
5. Run locally: `npm run dev`
6. Deploy to Vercel and add the environment variables in Vercel dashboard.

Supabase SQL to run (SQL Editor):
```
create extension if not exists "uuid-ossp";

create table matches (
  id uuid primary key default uuid_generate_v4(),
  name text,
  created_at timestamp default now()
);

create table player_times (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id),
  player_id integer,
  total_seconds integer default 0
);
```

