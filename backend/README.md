# Optional UniTask private SQLite API

This is an optional local/LAN backend for the mobile app's shared-account mode. The ICA offline mode works independently using the mobile device's SQLite database. The API uses Node built-ins only and was verified with Node 24.13; no npm server dependencies or online database are required.

```sh
npm run api
```

Defaults: `127.0.0.1:8000`, local data at `.unitask-api/data.sqlite`. Override `HOST`, `PORT` or `UNITASK_API_DB` as needed. Use `HOST=0.0.0.0` for a trusted LAN and configure `EXPO_PUBLIC_API_URL` with the server's LAN IP before restarting Expo. For remote hosting, use HTTPS. The data directory is private, ignored by Git and excluded from Metro.

Register/login through the app. Passwords are salted and hashed with scrypt; the database stores only hashes of random bearer tokens. Sessions expire after seven days. The mobile app's token is memory-only. Auth endpoints have a basic per-address rate limit; JSON bodies are limited to 32 KiB.

## API contract

All routes except health and register/login require `Authorization: Bearer <token>`.

| Method | Route | Behavior |
| --- | --- | --- |
| GET | /api/health | Health check |
| POST | /api/auth/register | name, email, password; returns token and user |
| POST | /api/auth/login | email, password; returns token and user |
| GET | /api/auth/me | Current user |
| GET / POST | /api/tasks | Search/category list or create a service |
| GET / PUT / DELETE | /api/tasks/:id | Details or provider-only modification |
| GET | /api/tasks/:id/interests/me | Whether the current user already sent a request |
| POST | /api/tasks/:id/interests | Optional message (max 500 characters); creates the owner's notification |
| POST | /api/tasks/:id/hire | Explicit booking; changes status and creates a separate notification |
| POST | /api/tasks/:id/rate | Review a completed service |
| GET | /api/notifications | Current user's latest 50 notifications plus total unread count |
| PATCH | /api/notifications/read-all | Mark only the current user's notifications read |
| PATCH | /api/notifications/:id/read | Mark an owned notification read |

An interest request derives sender and recipient from authenticated account/listing IDs, not client-provided recipient IDs. It does not alter availability or perform payment. The unique sender/task/type constraint prevents duplicate notifications, including concurrent retries. A duplicate does not resurrect a notification that was marked read. Viewing a listing never creates a notification. Owners cannot self-request; unavailable listings reject requests. Recipient filtering also applies to read operations.

Requests store a message and reference the requesting user's contact email. Deleted listings keep the notification text but clear the link. Inboxes poll while the app is foregrounded; this implementation does not send OS push notifications, SMS or email.

## Verification

`npm test` runs real HTTP tests with distinct accounts, owner-only reads, concurrent request retries, Unicode messages and persisted SQLite data across a server restart. Browser verification of shared accounts requires starting this API, setting Expo's API URL, and running:

```powershell
$env:PLAYWRIGHT_API_URL='http://127.0.0.1:8000'; npm run test:web
```

Without `PLAYWRIGHT_API_URL`, only the shared-account browser case is skipped; local-profile notification tests still run. Browser fixture accounts use reserved test email domains and are not real messages to other people.
