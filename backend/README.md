# Portfolio API

> Legacy standalone API documentation. The current React frontend reads and writes portfolio
> content directly through Supabase; see [`../supabase/README.md`](../supabase/README.md).

FastAPI REST API backed by MongoDB. At startup, the API connects to the configured MongoDB
database and ensures the `profile`, `skills`, `projects`, `education`, `achievements`, and
`messages` collections exist. Existing project and skill examples seed an empty database;
education, achievements, and messages start empty so no personal accomplishments are invented.

## Start locally (Windows PowerShell)

Install and start MongoDB locally, or create a MongoDB Atlas database. From the project root:

```powershell
py -3 -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

Edit `backend\.env` with the MongoDB settings, your Supabase project URL, its anon/publishable
key, and the comma-separated email addresses allowed to administer this portfolio. The
Supabase anon/publishable key is intended for Auth API use; never use a service-role/secret
key in the browser or for this verification flow. Supabase stores and verifies passwords.

In Supabase Storage, create a **public** bucket named `portfolio-assets` (or set
`SUPABASE_STORAGE_BUCKET` to your chosen bucket). Limit it to 5 MB per file and the
`image/jpeg`, `image/png`, and `image/webp` content types. Set
`SUPABASE_SERVICE_ROLE_KEY` in `backend\.env` to the project service-role key so the backend
can upload and remove profile photos; this secret must never be added to `.env.local` or any
`VITE_` variable. The API independently validates the actual image data, dimensions, and size.
MongoDB stores only the public photo URL; the image itself stays in Supabase Storage.

In the Supabase dashboard, enable Google under Authentication providers and configure the
OAuth credentials. Add your local and production callback URLs to the Supabase redirect URL
allowlist (for example `http://localhost:5173/admin/dashboard` and
`http://127.0.0.1:5173/admin/dashboard`). Create or invite administrator accounts through
Supabase and include their verified email addresses in `SUPABASE_ADMIN_EMAILS`. Publicly
created or Google-authenticated accounts that are not on this server-side allowlist cannot
access admin APIs.

Then start the API:

```powershell
python -m uvicorn backend.main:app --reload
```

The API is available at `http://127.0.0.1:8000`, documentation at
`http://127.0.0.1:8000/docs`, and health check at `http://127.0.0.1:8000/api/health`.
Stop the server with `Ctrl+C`.

The backend loads `backend\.env` locally. In production, supply variables through your
deployment environment/secret manager instead. Never commit `.env` or expose `MONGODB_URI`
in frontend variables. Set `CORS_ORIGINS` to a comma-separated list of exact trusted browser
origins.

The current React frontend does not use this API. If running a separate legacy frontend
against it, configure its API URL and Supabase public Auth key; never put the service-role
key or database credentials in Vite variables.

## API endpoints

Public endpoints:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/profile` | Read the profile document |
| GET | `/api/skills` | List skills |
| GET | `/api/projects` | List projects |
| GET | `/api/education` | List education records |
| GET | `/api/achievements` | List achievements |
| POST | `/api/messages` | Validate and store a contact message |

Admin bearer-token endpoints require a Supabase access token and an email listed in
`SUPABASE_ADMIN_EMAILS`:

| Method | Path | Purpose |
|---|---|---|
| PUT | `/api/profile` | Update profile fields |
| POST / DELETE | `/api/profile/photo` | Upload/replace or remove the profile photo |
| POST / PUT / DELETE | `/api/skills[/{id}]` | Manage skills |
| POST / PUT / DELETE | `/api/projects[/{id}]` | Manage projects |
| POST / PUT / DELETE | `/api/education[/{id}]` | Manage education records |
| POST / PUT / DELETE | `/api/achievements[/{id}]` | Manage achievements |
| GET / PATCH / DELETE | `/api/messages[/{id}]` | View, mark read/unread, or delete contact messages |
| GET | `/api/auth/me` | Verify the current Supabase user has admin access |

This legacy API uses Supabase Authentication for bearer-token verification and checks the
user's email against the server-side allowlist. Write operations and private message access
require this verification. Passwords are never stored or validated by this application.

Collection IDs are returned as MongoDB ObjectId hex strings in both `id` and `_id`. Project
documents use `image_url`, `image_alt`, `technologies`, `github_url`, and `demo_url`.
Achievement `type` must be one of `Certificate`, `Hackathon`, `Award`, `Competition`,
`Workshop`, or `Course`. Validation errors return `422`, missing IDs return `404`, malformed
IDs return `400`, and database failures return `503`.

Profile photo uploads accept JPEG, PNG, and WebP files up to 5 MB and 20 megapixels. The
backend verifies and normalizes image data before sending it to the configured Storage
bucket; upload and storage failures are reported by the API.

Contact message submissions validate an email address and require non-empty name, subject,
and message fields. The public endpoint accepts at most five submissions per client IP in a
rolling ten-minute window and uses a hidden honeypot field for basic spam detection.
Rate-limited submissions return `429` and a `Retry-After` header. The basic rate limit is
held in backend-process memory and resets on restart; multi-worker deployments should use a
shared rate-limit store for consistent enforcement.

Legacy API clients can load profile, skills, projects, education, and achievements from the
API. Contact form submissions are stored in the `messages` collection. The current React
frontend instead reads those portfolio sections from Supabase as documented in
[`../supabase/README.md`](../supabase/README.md).
