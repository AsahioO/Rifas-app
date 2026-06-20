# Repository Notes

## Commands
- Use `npm` by default: `README.md` names it as the package manager and `package-lock.json` is present. `pnpm-lock.yaml` also exists; do not update both lockfiles casually.
- Local dev: `npm install`, then `npm run dev` for `http://localhost:3000`.
- Production verification: `npm run build`. This is the closest available typecheck because there is no `typecheck` script.
- Lint: `npm run lint` (`next lint`).
- No test runner or test files are configured in this repo.

## App Shape
- This is a Next.js 14 App Router app under `src/app`, with Tailwind under `src/app/globals.css` and design tokens mapped in `tailwind.config.ts`.
- Public raffle UI is `src/app/page.tsx`; admin pages live under `src/app/admin/**`.
- Supabase access is centralized in `src/lib/supabase.ts`, `src/lib/supabase-server.ts`, and `src/lib/store.ts`.
- `mockStore` in `src/lib/store.ts` is not a mock; it is the real Supabase-backed data wrapper used by the UI.
- Use the `@/*` import alias for `src/*` paths.

## Supabase And Auth
- Required env vars for normal app access are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`; `/api/keep-alive` also requires `CRON_SECRET`.
- Database setup is tracked as SQL, not migrations: run `database.sql` and `storage.sql` in the Supabase SQL Editor.
- Expected tables are `rifas` and `participantes`; expected public storage bucket is `rifas-images`.
- Admin routes are protected by `src/middleware.ts`; `/admin/login` is the only unprotected admin route.
- The live raffle flow uses the Supabase Realtime broadcast channel `sorteo-live` and requires Realtime enabled for `rifas` as in `database.sql`.

## Build And Generated Files
- PWA support uses `@ducanh2912/next-pwa` in `next.config.mjs`; it is disabled in development and writes service-worker assets to `public` during production builds.
- Generated PWA files in `public` and TypeScript build info are ignored; avoid hand-editing generated `sw.js` or `workbox-*` files.
- `vercel.json` configures a daily cron that calls `/api/keep-alive`; keep its secret handling aligned with `CRON_SECRET`.
