# TodoDodo

TodoDodo is a desktop-first Expo application for a deliberately quiet todo
workflow. The same React Native UI is prepared for web, iOS, and Android, while
the v1 data path stays online-only:

```text
Expo UI -> same-origin /api -> Expo API Route -> Supabase Edge Function -> Postgres + RLS
```

The web client never receives a Supabase session token. Access and refresh
tokens live in host-only, `HttpOnly` cookies scoped to `/api`; task data only
lives in Supabase and in the memory of the active tab.

## Architecture

- `src/app/` contains Expo Router routes, providers, and module composition.
- `src/modules/` contains independent visible UI modules. A module may import
  Core, Shared State, and packages, but never another module.
- `src/core/` owns types, API transports, auth, theme, and task operations.
- `src/shared-state/` is a synchronous `useSyncExternalStore` UI bus. It has no
  network, Supabase, or database imports.
- `src/server/` contains the allowlisted same-origin API proxy.
- `supabase/functions/todododo-api/` owns auth, CSRF, validation, and task CRUD.
- `supabase/migrations/` and `supabase/tests/database/` own the Postgres contract.

PowerSync, local SQLite, Realtime, TanStack Query, SWR, and browser token storage
are intentionally absent.

## Local setup

Requirements: Node 22.13 or newer, npm, Docker Desktop, and the local Supabase
CLI installed through this project's dev dependencies.

```bash
npm install
npm run supabase:start
```

Create `supabase/.env.local` from `supabase/.env.example`, then serve the Edge
Function in a second terminal:

```bash
npm run supabase:functions
```

Create the root `.env` from `.env.example`. For local development,
`SUPABASE_FUNCTION_URL` should be
`http://127.0.0.1:54321/functions/v1/todododo-api`; use the local publishable
key shown by `npx supabase status`. Set the server-only
`TODODODO_PUBLIC_ORIGINS` to the exact browser origins, comma-separated and
without trailing slashes—for example,
`http://localhost:8081,http://127.0.0.1:8081`. Hosted environments must set the
deployed alias or custom-domain origin explicitly; only loopback development
falls back to the incoming request URL when the variable is absent. Keep this
list aligned with the Edge Function's `TODODODO_ALLOWED_ORIGINS` secret.

Start the Expo web app:

```bash
npm run dev:web
```

No `EXPO_PUBLIC_SUPABASE_*` variable is used on web. Do not put an access token,
refresh token, session object, service-role key, or database URI in any client
environment variable.

## Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run test:architecture
npm run test:db
npm run doctor
npm run export:web
```

The repository only contains local configuration and migration code. Applying
the cleanup migration, setting Edge Function secrets, deploying the function,
or deploying to EAS must target the confirmed dev project and is intentionally
kept separate from local implementation.
