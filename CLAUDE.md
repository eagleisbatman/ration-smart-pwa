# RationSmart PWA - Development Guidelines

## Pre-Commit Checklist (MANDATORY)

**Before EVERY commit, you MUST run the build and fix all errors:**

```bash
cd /Users/eagleisbatman/digitalgreen_projects/rationsmart/ration-smart-pwa
npx quasar build
```

This catches:
- TypeScript type errors
- ESLint / linter errors
- Build errors (missing imports, bad syntax, etc.)
- Template compilation errors

**Do NOT commit if the build fails.** Fix all errors first, then commit.

If `package.json` dependencies changed, also run `bun install` so `bun.lock` stays in sync (Railway uses `--frozen-lockfile`).

## Post-Push Verification (MANDATORY)

**After EVERY `git push`, you MUST verify Railway deployment:**

1. Wait ~30 seconds for Railway to pick up the push
2. Check deployment logs from the backend directory (Railway CLI is linked there):
   ```bash
   cd /Users/eagleisbatman/digitalgreen_projects/rationsmart/ration-smart-backend
   railway logs -n 50
   ```
3. For PWA-specific deploy status, check Railway dashboard or use:
   ```bash
   railway status
   ```
4. Look for:
   - Build success/failure messages
   - Runtime errors after deployment
   - Any 5xx errors in the first few requests
5. If the build failed, fix the issue immediately and push again

## Project Structure

- Framework: Quasar v2 + Vue 3 Composition API + Pinia + TypeScript
- Build: `npx quasar build` -> `dist/spa/`
- Package manager: Bun (Railway uses `bun install --frozen-lockfile`)
- Git repo root: this directory (`ration-smart-pwa/`)
- Deployed on Railway (auto-deploys on push to main)

## Key Architecture

- **API Adapter**: `src/services/api-adapter.ts` maps `/api/v1/*` -> backend paths
- **Auth**: `src/stores/auth.ts` with dual storage (localStorage / sessionStorage)
- **Offline-first**: Stores use Dexie.js (IndexedDB) as cache fallback
- **Boot**: `src/boot/axios.ts` configures interceptors, retry, auth headers
