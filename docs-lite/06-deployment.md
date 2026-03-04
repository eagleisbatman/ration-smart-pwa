# Deployment Guide

## Platform

Both PWA and backend are deployed on **Railway** with auto-deploys on push to their respective branches.

| Service | Branch | Railway Project |
|---------|--------|-----------------|
| PWA | `app-lite` | ration-smart-pwa |
| Backend | `main` | ration-smart-backend |

## Environment Variables (Railway)

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_BASE_URL` | `https://ration-smart-backend.up.railway.app` | Yes |
| `VITE_APP_API_KEY` | Your API key | Optional |
| `VITE_APP_ENV` | `production` | Yes |

## Build Process

Railway automatically:
1. Detects Railpack builder from `railway.json`
2. Runs `bun install --frozen-lockfile`
3. Runs `bun run build` (which runs `quasar build -m pwa`)
4. Serves `dist/pwa/` via `bunx serve`

## Pre-Push Checklist

Before every push:
1. `npx quasar build -m pwa` — must pass with no errors
2. If `package.json` changed, run `bun install` to sync `bun.lock`
3. Backend changes: `python3 -m py_compile <changed_file.py>`

## Post-Push Verification

After every push:
1. Wait ~30 seconds for Railway to pick up the push
2. Check deployment status in Railway dashboard
3. For backend: `cd ration-smart-backend && railway logs -n 50`
4. Look for successful build, no startup crashes, no 5xx errors

## Domain & SSL

Railway auto-provisions SSL. Custom domains can be added in Railway dashboard under Settings → Domains.

## Troubleshooting

### Build Fails
- Check Railway build logs for TypeScript or ESLint errors
- Ensure `bun.lock` is committed and in sync with `package.json`
- Verify Node.js 20+ is being used

### API Connection Issues
- Verify `VITE_API_BASE_URL` matches the backend Railway URL
- Check CORS settings on backend (`CORS_ALLOW_ORIGINS` env var)
- Ensure backend service is running and healthy

### PWA Not Updating
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- DevTools → Application → Service Workers → "Update"
- Users may need to close all tabs and reopen
