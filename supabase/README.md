# Supabase portfolio storage

## Database and Storage setup

In the Supabase SQL Editor, run [`portfolio.sql`](./portfolio.sql). It creates the
`public.portfolio_content` table and the public `portfolio-assets` Storage bucket with the RLS
policies used by this frontend.

The portfolio is saved as one JSON document in the table's `content` column. The single-row
upsert preserves each record's ID, so editing a skill, project, education record, or achievement
updates the existing item rather than creating a duplicate. Profile, project, certificate, and
resume files are uploaded to Storage; the database document stores their public URLs.

## Environment variables

Copy the root `.env.example` to `.env.local` and set:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Set the same two variables in Vercel's project environment settings for Production and any
Preview environments you use, then redeploy. Keep the existing `VITE_API_URL` too if the
Contact form is using the separate FastAPI backend. Vite variables are public browser values;
never use a Supabase service-role/secret key in the frontend.

## Public editing warning

This project intentionally has no Admin authentication. The SQL policies allow anyone to read
and edit the single portfolio record and upload or replace assets in the portfolio bucket. A
visitor can overwrite the portfolio or upload unwanted public files. Do not store private
information. For protected editing, add server-side authorization before enabling public use.
