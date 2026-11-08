# Portfolio API

FastAPI backend for portfolio APIs and the SMTP-backed Contact form. The React frontend stores
editable portfolio content in browser `localStorage`; contact submissions are sent through this
backend and are not stored in `localStorage`.

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

Edit `backend\.env` with the MongoDB settings and Gmail SMTP values described below. Keep all
mail credentials in this backend-only file or your production secret manager; never add them to
a Vite variable or frontend source.

## Gmail contact delivery

1. Enable 2-Step Verification on the Gmail account that will send the message.
2. In Google Account settings, create an **App Password** for this application.
3. Set these values in `backend\.env` (or the backend host's secret/environment settings).
   Enter the App Password without any display spaces:

   ```dotenv
   MAIL_USERNAME=your-gmail-address@gmail.com
   MAIL_PASSWORD=your-16-character-app-password
   MAIL_TO=shanmukhameda20@gmail.com
   ```

The backend sends mail to Gmail using SMTP over SSL on port 465. `MAIL_USERNAME` and
`MAIL_PASSWORD` are server-only. Do not commit the real values or set them in Vercel.

## Frontend API URL and CORS

For local development, create the frontend `.env.local` from `../.env.example` and set
`VITE_API_URL=http://127.0.0.1:8000`. Start/restart Vite after changing the value. The
backend must be running separately for the form to send messages.

For deployment, set `VITE_API_URL` in the Vercel project's environment variables to the
FastAPI backend's base origin, such as `https://your-backend.example.com` (without
`/api/contact`), then redeploy the frontend. On the backend host, set `CORS_ORIGINS` to a
comma-separated list of exact frontend origins, such as
`https://your-site.vercel.app`. Add any Vercel preview/custom-domain origins that should be
allowed. Do not use a wildcard for production.

Start the API:

```powershell
python -m uvicorn backend.main:app --reload
```

The API is available at `http://127.0.0.1:8000`, documentation at
`http://127.0.0.1:8000/docs`, and health check at `http://127.0.0.1:8000/api/health`.
Stop the server with `Ctrl+C`.

The backend loads `backend\.env` locally. In production, supply variables through your
deployment environment/secret manager instead. Never commit `.env`, expose `MONGODB_URI` or
mail credentials in frontend variables, or prefix secrets with `VITE_`.

## API endpoints

Public endpoints:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/contact` | Validate and send a contact message to `MAIL_TO` via Gmail SMTP |
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

Both public submission endpoints validate an email address and require non-empty name,
subject, and message fields. They share a limit of five submissions per client IP in a rolling
ten-minute window and return `429` with a `Retry-After` header when exceeded. The basic limit
is held in backend-process memory and resets on restart; multi-worker deployments should use a
shared rate-limit store for consistent enforcement. The React form includes a hidden honeypot
field, which the contact endpoint ignores when populated.

The React Contact form uses `/api/contact`; it does not persist messages in browser storage.
The other portfolio sections continue to use local browser storage in the frontend.
