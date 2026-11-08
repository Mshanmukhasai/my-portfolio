# Supabase portfolio data

## Existing database setup

This frontend uses the existing `public.portfolio` table and does not create a table or Supabase
project. In the Supabase SQL Editor, run [`portfolio.sql`](./portfolio.sql) to configure public
read/write access for that existing table and the `portfolio-assets` Storage bucket used for
uploaded profile photos.

The dashboard selects the oldest existing portfolio record and updates it. It inserts a row only
when the table is empty. The frontend maps the table's profile, contact, education, social, and
resume columns to the existing public portfolio sections.

## Environment variables

Copy the root `.env.example` to `.env.local` and set:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Set the same two variables in Vercel Project Settings > Environment Variables for Production and
any Preview environments you use, then redeploy. Keep `VITE_API_URL` if the Contact form is using
the separate FastAPI backend. These Vite variables are public browser values; never use a
Supabase service-role/secret key in the frontend.

## Public editing warning

This project intentionally has no Admin authentication. The SQL policies allow anyone to read
and edit portfolio details and upload public profile photos. A visitor can overwrite the
portfolio. Do not store private information. For protected editing, add server-side authorization
before enabling public use.
