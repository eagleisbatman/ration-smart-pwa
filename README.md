# RationSmart PWA

A Progressive Web App for cattle nutrition optimization. Built with Quasar Framework (Vue 3), TypeScript, and Pinia.

## Features

- **User Authentication**: Email + PIN based login
- **Cow Profile Management**: Create and manage cow profiles with breed, weight, lactation stage
- **Diet Optimization**: Get optimized feed recommendations based on cow requirements
- **Custom Feed Management**: Add custom feeds with nutritional information
- **Milk Logging**: Daily milk production tracking with offline support
- **Reports**: View and download diet and production reports
- **Offline Support**: Full offline-first architecture with background sync

## Tech Stack

- **Framework**: Quasar v2 (Vue 3)
- **Language**: TypeScript
- **State Management**: Pinia
- **Offline Storage**: Dexie.js (IndexedDB)
- **Service Worker**: Workbox (InjectManifest mode)
- **HTTP Client**: Axios with retry support
- **Package Manager**: Bun

## Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- RationSmart Backend running at `http://localhost:8000`

## Installation

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env
# Edit .env with your API settings

# Start development server
bun dev
```

## Development

```bash
# Start dev server (hot-reload)
bun dev

# Lint files
bun lint

# Format files
bun format

# Type check
bun typecheck

# Build for production
bun build
```

## PWA Testing

The PWA features work best when served over HTTPS. For local testing:

```bash
# Build and preview production build
bun build
bun preview
```

### Testing Install Prompt
1. Open Chrome DevTools > Application > Manifest
2. Verify manifest is loaded correctly
3. The "Add to Home Screen" prompt should appear automatically

### Testing Offline Mode
1. Open Chrome DevTools > Network
2. Select "Offline" from the throttling dropdown
3. Navigate the app - data should load from IndexedDB

### Testing Service Worker
1. Open Chrome DevTools > Application > Service Workers
2. Check "Update on reload" during development
3. Test "Skip waiting" to activate new versions

## Project Structure

```
ration-smart-pwa/
├── .planning/              # Sprint planning JSON files
│   ├── initiative.json
│   └── sprints/
├── docs/                   # Documentation
│   ├── DEPENDENCIES.md
│   ├── RESEARCH.md
│   └── SETUP.md
├── public/
│   ├── icons/             # PWA icons (generate from SVG)
│   └── manifest.json      # Web app manifest
├── src/
│   ├── boot/              # Quasar boot files
│   │   ├── axios.ts       # HTTP client setup
│   │   ├── dexie.ts       # Database initialization
│   │   └── pwa.ts         # PWA utilities
│   ├── components/
│   │   ├── pwa/           # PWA-specific components
│   │   └── ui/            # Reusable UI components
│   ├── composables/       # Vue composables
│   ├── css/               # Global styles
│   ├── layouts/           # Page layouts
│   ├── lib/
│   │   └── offline/       # Offline sync infrastructure
│   ├── pages/             # Route pages
│   ├── router/            # Vue Router setup
│   ├── stores/            # Pinia stores
│   └── types/             # TypeScript types
├── src-pwa/               # Service worker source
│   ├── custom-service-worker.ts
│   └── register-service-worker.ts
└── quasar.config.ts       # Quasar configuration
```

## Offline Architecture

The app follows an offline-first architecture:

1. **Read Operations**: Always read from local IndexedDB first, then sync with server
2. **Write Operations**: Write to local DB immediately (optimistic UI), queue for server sync
3. **Background Sync**: When online, process queued operations in order
4. **Conflict Resolution**: Last-write-wins with server timestamp comparison

### Sync Queue

Failed or offline mutations are stored in a sync queue:
- Queue persists in IndexedDB
- Auto-processes when connection restored
- Manual sync available via pull-to-refresh
- Visual indicator shows pending sync count

## PWA Icons

Generate production icons from the SVG source:

1. Visit [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload `public/icons/icon-512x512.svg`
3. Download and extract to `public/icons/`
4. For maskable icons, use [Maskable.app](https://maskable.app/)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_APP_API_KEY` | API key for authentication | - |
| `VITE_VAPID_PUBLIC_KEY` | VAPID key for push notifications | - |

## Building for Production

```bash
# Build optimized bundle
bun build

# Preview production build locally
bun preview

# Build outputs to dist/pwa/
```

## Deployment

The built PWA can be deployed to any static hosting:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop `dist/pwa/` folder
- **AWS S3 + CloudFront**: Upload to S3, configure CloudFront for HTTPS
- **Firebase Hosting**: `firebase deploy`

### Important for Production

1. Serve over HTTPS (required for Service Workers)
2. Configure proper cache headers for service worker
3. Set up proper CORS on backend for API calls

## License

Proprietary - Digital Green Foundation
