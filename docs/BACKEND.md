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

The public brief endpoints accept a single-day selector as a query parameter.
`GET /weather/brief` returns every domain's brief for that day in one response.

| Request | Meaning |
| --- | --- |
| `GET /api-v1/weather/brief?date=2026-10-15` | All domains' human briefs for that calendar day |
| `GET /api-v1/weather/brief?latest=true` | All domains' most recent stored briefs |
| `GET /api-v1/climate/brief?date=2026-10-15` | Climate human brief for that calendar day |
| `GET /api-v1/climate/brief?latest=true` | Most recent stored climate brief |
| `POST /api-v1/weather/observations-research?date=2026-10-15` | Observations + research for that day; body stays `{ domains }` |
| `POST /api-v1/weather/observations-research?latest=true` | Most recent stored observations + research |

Weather brief response shape:

```json
{
  "briefs": [
    {
      "id": "uuid",
      "brief_date": "2026-10-15T04:00:00.000Z",
      "domain": "macro",
      "human_brief": { "title": "...", "sections": [] },
      "created_at": "2026-10-15T04:00:00.000Z",
      "updated_at": "2026-10-15T04:00:00.000Z"
    }
  ],
  "date": "2026-10-15",
  "latest": false,
  "limit": 6,
  "total": 6
}
```

- Request dates use `YYYY-MM-DD`. Response `brief_date` values are timestamps;
  the frontend compares only the first ten characters.
- A request with neither selector returns `400`. `latest=true` ignores any
  `date` and selects `MAX(brief_date)`; in that case the response `date` is the
  resolved latest date.
- Weather domains are `macro`, `financial_markets`, `geopolitics`,
  `ai_technology_industry`, `commodities_energy`, and `crypto`.
- The response contains every domain stored for the day, so one request serves
  all six domain tabs and the climate overview fallback. No `domains` parameter
  is needed.
- `human_brief` is JSONB. The API returns it as an object, but the frontend also
  accepts a JSON string and normalizes both before Zod validation.
- `limit` and `total` are informational and optional in the frontend schema. The
  frontend renders the returned `briefs` array as-is.
- `GET /weather/brief?date=...` answers `404` when that day has no rows; the
  frontend treats that as an empty state, not an error.
- When the selected date is empty, the weather query refetches with
  `latest=true`, shows a "No data for <date>" notice in the card, and renders the
  latest data. The sidebar widget shows a "No Data" badge in that state.
- `components/providers/brief-selection-provider.tsx` owns the date/Latest state,
  the selected weather domain, and the three brief queries. The weather query
  fetches the whole day's briefs at once.

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

## Asset API contract

One endpoint per asset class, each taking the ticker/symbol in the path:

| Request | Meaning |
| --- | --- |
| `GET /api-v1/stocks/AAPL` | Stock intelligence for a ticker |
| `GET /api-v1/crypto/DOGE` | Crypto intelligence; the route uppercases the ticker |
| `GET /api-v1/commodities/GCUSD` | Commodity intelligence; FMP first, EIA fallback |

- All three accept `?refresh=true` to bypass the database freshness check.
- Unknown tickers answer `404 { error: "wrong_ticker" }`.
- A cache miss fetches from external providers and writes to the database, so
  the first request for an asset can take tens of seconds.
  `lib/asset-api.ts` uses a 90 s timeout for these calls.
- Frontend crypto routes use the CoinGecko id (`/crypto/dogecoin`), not the
  ticker. The page resolves the id to the symbol (`DOGE`) through
  `lib/asset-search.ts` before calling the backend.
- The stock response contains `company` (exchange, CIK, sector, industry,
  country, logo, description), `market` (price, previous close, day/52-week
  ranges, moving averages), `financialReports.quarterly` / `.annual` (13 SEC
  metrics per period plus filing provenance) and `history`, which is currently
  always `null`. `/stock/[id]` renders all of these; `history` is reserved for a
  future price chart.

### Local asset search

`GET /api/assets/search?q=<query>` is a Next.js route handler, not a backend
route. It filters `data/stock-tickers.json`, `data/crypto-tickers.json` and
`data/commodities-tickers.json` on the server and returns at most `limit`
results per asset class (default 5, max 10). The ticker files never reach the
browser bundle. Results are ranked by exact ticker/name, name prefix, ticker
prefix, then substring, and a shorter name wins ties so canonical assets
("Dogecoin") sort above derivative tokens.

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
| `hooks/use-weather-brief.ts` | One date-scoped request for all domains; falls back to latest when the date is empty |
| `components/providers/brief-selection-provider.tsx` | Shared date/Latest state, active weather domain, the three brief queries, and fallback status |
| `components/weather/weather-domain-tabs.tsx` | Six domain buttons that switch the weather brief card |
| `components/layout/BriefDateWidget.tsx` | Sidebar date picker + Latest toggle, pinned above the Actions section |
| `components/briefs/no-data-notice.tsx` | "No data for <date>" notice shown when a section falls back to latest |
| `types/zodSchemas.ts` | Runtime validation of auth and chatbot responses |
| `lib/asset-types.ts` | Shared `AssetType` / `AssetSearchResult` types, group labels, route helper |
| `lib/asset-search.ts` | Server-only ticker index, autocomplete ranking, route-id to ticker resolution |
| `app/api/assets/search/route.ts` | Autocomplete endpoint used by the navbar |
| `lib/asset-api.ts` | Typed `fetchStockAsset` / `fetchCryptoAsset` / `fetchCommodityAsset` clients with Zod validation |
| `lib/asset-format.ts` | Shared money, percent, range and date formatting, including invalid-currency fallback |
| `hooks/use-asset-search.ts` | Debounced, abortable autocomplete hook |
| `components/layout/Navbar.tsx` | Grouped autocomplete and navigation to `/stock`, `/crypto`, `/commodity` detail routes |
| `components/assets/stock-profile.tsx` | Stock identity header: logo, name, price, description, website |
| `components/assets/stock-statistics.tsx` | Quote statistics, day/52-week range bars, moving averages |
| `components/assets/stock-company-details.tsx` | Registry and classification facts, SEC CIK link |
| `components/assets/stock-financials.tsx` | Quarterly/annual toggle, metric table, revenue chart and filing provenance |
| `scripts/fetch-asset-responses.ts` | Dumps one raw response per asset class into `data/` |

## Open backend requests

The weather brief route now supports both selectors:

- `GET /api-v1/weather/brief?date=YYYY-MM-DD` returns that day's six briefs.
- `GET /api-v1/weather/brief?latest=true` returns the newest stored day's six
  briefs and resolves `date` for the caller.
- A request with neither selector returns `400`; an empty date returns `404`.

The other two brief routes still ignore the selector and therefore cannot give
the General page date-scoped snapshots:

- `GET /api-v1/climate/brief` always returns the newest row. The frontend sends
  `date`/`latest` but the controller currently ignores it.
- `POST /api-v1/weather/observations-research` returns every stored row for the
  requested domains. It ignores the `date` and `latest` query parameters.

The frontend still sends the selectors so these sections become date-scoped once
the backend honours them. The climate section also compares the returned date
with the selected date, so it shows the fallback notice today. The observations
section cannot detect an empty day until the route filters rows.

> **Domain naming:** the live database uses `financial_markets`. A sample request
> with `fundamental_markets` would not match any stored brief, so keep the id
> spelled that way only if the backend data is renamed as well.

Asset endpoints:

- `GET /api-v1/crypto/:ticker` hard-codes `market.price: null` on the database
  cache-hit path (`buildResponseFromDB`). The first request for an asset returns
  the normalized price, but later page loads show no price. The frontend renders
  `—` until the route returns stored market values.
- The crypto route echoes the requested ticker in `symbol`. Requesting a
  non-canonical ticker (`DOGECOIN`) returns `symbol: "DOGECOIN"` rather than the
  canonical `DOGE`, so the frontend resolves the CoinGecko id to the ticker
  before calling the route.

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
