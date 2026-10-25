# Backend Integration

Durable notes for frontend work that depends on the backend. Keep this file
updated when API contracts, auth behavior, or local setup change.

## Working agreement

The backend repository is **read-only from the frontend session**.

- Do not edit backend source, config, dependencies, database, or `.env`.
- Reading backend files for API context is allowed.
- When the frontend needs a backend change, record the requirement under
  [Open backend requests](#open-backend-requests) and give it to the user, who
  applies it in the dedicated backend session.
- Do not stop or restart the backend process from the frontend session unless
  the user explicitly asks.

Before this rule was set on 2026-10-23, the backend `.env` was edited once:
`GOOGLE_OAUTH_CLIENT_ID` was renamed to `GOOGLE_CLIENT_ID`, `FRONTEND_URL` was
added, and `JWT_SECRET` was generated. Treat those changes as already applied.

## Repository

| Item | Value |
| --- | --- |
| Local path | `C:\Users\maxfe\OneDrive\Desktop\crypto Backend\crypto-intelligence-backend` |
| Relative to this repo | `..\..\crypto Backend\crypto-intelligence-backend` |
| Stack | Node.js, TypeScript, Express 5, PostgreSQL (`pg`), Mongoose, `tsx` |
| Dev command | `npm run dev` (`nodemon --watch . --ext ts --exec tsx index.ts`) |
| Port | `5000` |
| API base path | `/api-v1` |
| Env file | `.env` at the backend root (gitignored) |
| Agent rules | Backend `AGENTS.md` (read-only for this session; the user applies changes) |

A process started as `tsx index.ts` does **not** watch files or `.env`; restart
it after changing environment variables. `npm run dev` only restarts on `.ts`
changes, so `.env` changes still need a manual restart.

## Database

- PostgreSQL pool: `config/database.ts`, configured by `DATABASE_URL`
- Auth tables: `accounts.users`, `accounts.sessions`
- Sessions store a SHA-256 hash of the JWT `jti`, never the raw token

## Auth API contract

### `POST /api-v1/auth/login`

- Middleware: `requireTrustedOrigin`, `validateRequest(googleLoginSchema)`
- Body: `{ credential?: string, idToken?: string }` (at least one required)
- Verifies the Google ID token against Google JWKS (`accounts.google.com`)
- Audience must equal `GOOGLE_CLIENT_ID`
- Upserts the user by Google `sub`; email must be verified by Google
- Creates a DB session and sets the auth cookie
- Success: `200 { user: { id, email } }`
- Errors: `400` missing token, `401` invalid/unverified token, `409` email
  already linked to another account, `500` misconfigured or DB failure

### `GET /api-v1/authMe`

- Middleware: `authMiddleware`
- Success: `200 { user: { id, email, createdAt } }`
- `401` when the cookie is missing, invalid, expired, or revoked
- `500 "Authentication is not configured"` when `JWT_SECRET` is missing
- `500` when the DB lookup fails

### `POST /api-v1/auth/signout`

- Middleware: `requireTrustedOrigin`
- Revokes the presented session and clears the cookie
- Success: `200 { message: "Signed out" }`
- Idempotent: a missing/invalid cookie still clears it

### Session cookie

- Dev name: `token`; production name: `__Host-token`
- `httpOnly: true`
- `path: "/"`
- `sameSite: "lax"` in dev, `"none"` in production
- `secure: false` in dev, `true` in production
- Lifetime: 7 days

## CORS and trusted origin

- `index.ts` configures `cors` with:
  - `origin: process.env.FRONTEND_URL`
  - `credentials: true`
  - methods `GET, POST, DELETE, PUT`
  - allowed headers `Content-Type, Authorization`
- `requireTrustedOrigin` compares the request `Origin` header with
  `FRONTEND_URL` on login and signout.
- Local frontend origin must be `http://localhost:3000`.
- Cross-port requests (`:3000` -> `:5000`) are cross-origin; cookies require
  `withCredentials: true` on the frontend (already configured).

## Required backend environment variables

Names only; values live in the backend `.env` and must never be committed.

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID used for token audience validation; must equal the frontend's `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| `JWT_SECRET` | HMAC secret for signing session JWTs |
| `FRONTEND_URL` | Allowed CORS/trusted origin, e.g. `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string |

`GOOGLE_OAUTH_CLIENT_SECRET` is **not** used by the ID-token login flow. If a
secret is needed for another OAuth flow, it belongs only in the backend env,
never in the frontend.

## Brief API contract

The public brief endpoints accept a single-day selector as a query parameter:

| Request | Meaning |
| --- | --- |
| `GET /api-v1/weather/brief?date=2026-10-15` | Weather human brief for that calendar day |
| `GET /api-v1/weather/brief?latest=true` | Most recent stored weather brief, regardless of date |
| `GET /api-v1/climate/brief?date=2026-10-15` | Climate human brief for that calendar day |
| `GET /api-v1/climate/brief?latest=true` | Most recent stored climate brief |
| `POST /api-v1/weather/observations-research?date=2026-10-15` | Observations + research for that day; body stays `{ domains }` |
| `POST /api-v1/weather/observations-research?latest=true` | Most recent stored observations + research |

- Dates use `YYYY-MM-DD`.
- `latest` wins if both are ever sent; the frontend only sends one.
- The brief routes answer `404` when no row exists for the selection; the frontend
  treats that as an empty state, not an error.
- When the selected date is empty, each section refetches with `latest=true`,
  shows a "No data for <date>" notice in the card, and renders the latest data.
  The sidebar widget shows a "No Data" badge in that state.
- `components/providers/brief-selection-provider.tsx` owns the date/Latest state
  and the three brief queries so the sidebar widget and page never disagree.

## Chatbot API contract

The backend handoff is `docs/CHATBOT_FRONTEND.md` in the backend repository
(read-only). Key points:

- `GET /api-v1/chatbot/messages` returns the latest chat, or a specific chat
  with `?chatId=<uuid>`.
- `POST /api-v1/chatbot/messages` accepts `{ message, chatId? }`.
- Both require the auth cookie and `credentials: "include"`. Do not send an
  `Authorization` header, history, summaries, or a user ID.
- `POST` is non-streaming and may take minutes before responding.
- `POST` returns only the two new messages; the frontend merges them by ID and
  sorts by `sequenceNumber`.
- Errors are `{ message, chat?, userMessage? }`.
- The frontend uses the existing `NEXT_PUBLIC_API_URL` base (default
  `http://localhost:5000/api-v1`). The handoff's `NEXT_PUBLIC_API_BASE_URL`
  example is not used here; do not add a second base URL variable.

## Frontend mapping

| Frontend file | Responsibility |
| --- | --- |
| `lib/fetch-util.ts` | Exports `API_BASE_URL` from `NEXT_PUBLIC_API_URL`, default `http://localhost:5000/api-v1`; Axios `withCredentials: true`; global 401 handling |
| `components/providers/auth-context-provider.tsx` | `/authMe` on page load, `loginWithGoogle`, `signOut`, forced logout events |
| `components/auth/google-sign-in-button.tsx` | Google Identity Services button, reads `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, posts `{ credential }` |
| `components/auth/user-account.tsx` | Signed-out/signed-in UI for `/user` |
| `app/user/page.tsx` | `/user` route |
| `lib/chatbot-api.ts` | Typed `GET`/`POST` client for `/chatbot/messages`; validates responses with Zod; `credentials: "include"` |
| `hooks/use-chatbot.ts` | Chat state, optimistic sends, merge/sort, error handling, 401 forced logout |
| `components/chat/chat-widget.tsx` | Floating assistant on every page; auth-gated; uses the chatbot hook |
| `lib/brief-query.ts` | `BriefQuery` type, `toBriefQueryParams` (`date` / `latest=true`), `getTodayApiDate` |
| `hooks/use-today-api-date.ts` | Hydration-safe browser "today" via `useSyncExternalStore` |
| `components/providers/brief-selection-provider.tsx` | Shared date/Latest state, the three brief queries, and fallback status |
| `components/layout/BriefDateWidget.tsx` | Sidebar date picker + Latest toggle, pinned above the Actions section |
| `components/briefs/no-data-notice.tsx` | "No data for <date>" notice shown when a section falls back to latest |
| `types/zodSchemas.ts` | Runtime validation of auth and chatbot responses |

## Open backend requests

None currently. The previously requested chat endpoint is implemented at
`/api-v1/chatbot/messages`.

## Current local state (2026-10-23)

- Frontend `.env`: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` populated from the Google
  client ID.
- Backend `.env`: `GOOGLE_CLIENT_ID`, `FRONTEND_URL`, and `JWT_SECRET` are set.
  The backend was restarted and `GET /api-v1/authMe` now returns `401` for a
  signed-out browser, which is the expected behavior.
- Real Google sign-in has **not** been tested end-to-end yet.
- The frontend `.env` still contains `GOOGLE_OAUTH_CLIENT_SECRET`, which the
  frontend does not use. Prefer keeping the secret in the backend only.
- The floating chat is wired to the authenticated chatbot API. It loads the
  latest chat when opened, sends messages, and expects the backend to own
  history and summaries. Backend limitations still apply: no chat list, new
  chat, rename, delete, pagination, streaming, or cancellation.
- Chat requests require a signed-in session. The unauthenticated route and CORS
  preflight were verified; authenticated chat has not been tested in this
  session without a real Google login.

## Related backend files

- `docs/CHATBOT_FRONTEND.md` - chatbot API handoff
- `index.ts` - Express app, CORS, route mounting
- `routes/index.ts` - mounts `/auth`, `/authMe`, `/world`, `/chatbot`
- `routes/authRoutes.ts` - login and signout routes
- `routes/chatbotRoutes.ts` - authenticated chatbot GET/POST routes
- `controller/chatbotController.ts` - chat storage, graph invocation, error mapping
- `controller/authController.ts` - Google token verification and session creation
- `middleware/auth-middleware.ts` - session cookie verification
- `middleware/trustedOrigin.ts` - Origin allowlist for state-changing requests
- `utils/auth/session.ts` - cookie options, JWT/session lifetimes, token hashing
- `config/database.ts` - PostgreSQL pool
