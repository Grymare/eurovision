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
- `/auth/forgot-password` — request reset link (requires email config)
- `/auth/reset-password?token=…` — set new password from email link
- `/api/auth/*` — Auth.js handlers + register / forgot-password / reset-password

## Password reset

Requires the same **`EMAIL_SERVER`** and **`EMAIL_FROM`** as magic link. The login page shows **Forgot password?** only when email is configured.

- Reset links expire after **1 hour** and are single-use
- Google-only accounts (no password hash) do not receive a reset email; the request still returns a generic success message
- Rate limit: 3 forgot-password requests per email per hour

## Schema

Auth tables: `user`, `account`, `session`, `verificationToken` (Auth.js Drizzle adapter).

`participants.user_id` optionally links a jury row to an account when joining while signed in.

## Dev quick-start

`/api/parties/dev-quick-start` remains **development-only** and does not require admin login.
