# Railway Deployment Guide - RationSmart PWA

## Prerequisites

1. Railway account (https://railway.app)
2. Backend already deployed to Railway (note the URL)
3. GitHub repository connected to Railway

## Deployment Steps

### 1. Create New Railway Project

```bash
# Option A: Via CLI
railway login
railway init

# Option B: Via Dashboard
# Go to railway.app → New Project → Deploy from GitHub repo
```

### 2. Configure Environment Variables

In Railway dashboard, set these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_BASE_URL` | `https://your-backend.up.railway.app` | ✅ Yes |
| `VITE_APP_API_KEY` | Your API key (if using) | Optional |
| `VITE_APP_ENV` | `production` | ✅ Yes |
| `VITE_VAPID_PUBLIC_KEY` | VAPID key for push notifications | Optional |

**Example:**
```
VITE_API_BASE_URL=https://ration-smart-backend-production.up.railway.app
VITE_APP_ENV=production
```

### 3. Deploy

Railway will automatically:
1. Detect the build configuration from `railway.json` (Railpack builder)
2. Run `bun install`
3. Run `bun run build`
4. Serve static files from `dist/spa` via `bunx serve`

### 4. Configure Domain

In Railway dashboard:
1. Go to Settings → Domains
2. Add custom domain or use Railway's generated domain
3. SSL is automatically provisioned

## Build Configuration

The PWA uses these config files:

- `railway.json` - Railway deployment settings (Railpack builder, build + start commands)
- `.env.production` - Environment defaults (overridden by Railway vars)

## Troubleshooting

### Build Fails

1. Check Railway logs for errors
2. Ensure Node.js 20+ is being used
3. Verify `bun.lock` is committed

### API Connection Issues

1. Verify `VITE_API_BASE_URL` is set correctly
2. Check CORS settings on backend (`CORS_ALLOW_ORIGINS`)
3. Ensure backend is running and healthy

### PWA Not Installing

1. Check HTTPS is enabled (Railway does this automatically)
2. Verify manifest.json is served correctly
3. Check service worker registration in browser DevTools

## Local Development

```bash
# Install dependencies
bun install

# Run development server (uses .env.development)
bun dev

# Build for production
bun run build

# Preview production build locally
bun run preview
```

## Environment Files

| File | Purpose |
|------|---------|
| `.env` | Local overrides (gitignored) |
| `.env.development` | Development defaults |
| `.env.production` | Production defaults (Railway overrides) |
| `.env.example` | Template for new developers |
