# Account auth (EUP-005 / EUP-029)

Auth.js (NextAuth v5) with optional accounts. Party session cookies (host/participant) are unchanged from MVP.

## Setup

1. Copy variables from [`.env.example`](../.env.example) into `.env.local`
2. Set **`AUTH_SECRET`** (random string)
3. Set **`ADMIN_EMAILS`** to your login email (only this address can create parties)
4. Optional: `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, `EMAIL_SERVER` / `EMAIL_FROM` for magic link

Magic link is **off until SMTP is configured** — the login page hides that section when `EMAIL_SERVER` and `EMAIL_FROM` are missing.

Run migrations after pulling auth schema changes:

```bash
pnpm db:push
```

## Flows

| User | Create party | Join party |
|------|--------------|------------|
| Logged out | No — use **Host sign in** | Party code + nickname |
| Logged-in admin (`ADMIN_EMAILS`) | Yes | Display name from account |
| Logged-in non-admin | No | Display name from account |

## Routes

- `/auth/login` — password, Google (if configured), magic link (if `EMAIL_SERVER` + `EMAIL_FROM` set)
- `/auth/register` — open registration
- `/api/auth/*` — Auth.js handlers

## Schema

Auth tables: `user`, `account`, `session`, `verificationToken` (Auth.js Drizzle adapter).

`participants.user_id` optionally links a jury row to an account when joining while signed in.

## Dev quick-start

`/api/parties/dev-quick-start` remains **development-only** and does not require admin login.
