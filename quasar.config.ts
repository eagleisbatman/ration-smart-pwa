import { defineConfig } from '#q-app/wrappers';

export default defineConfig((/* ctx */) => {
  return {
    eslint: {
      warnings: true,
      errors: true,
    },

    boot: ['axios', 'dexie', 'pwa', 'i18n', 'icons', 'dark-mode'],

    css: ['app.scss'],

    extras: [
      'material-symbols-outlined',
    ],

    build: {
      target: {
        browser: ['es2022', 'chrome100', 'firefox100', 'safari15'],
      },
      vueRouterMode: 'history',
      env: {
        API_BASE_URL: (process.env.VITE_API_BASE_URL || 'http://localhost:8000').trim(),
        APP_API_KEY: (process.env.VITE_APP_API_KEY || '').trim(),
      },
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {
        brand: {
          primary: '#1565C0',    // Deep Blue - RationSmart brand
          secondary: '#1E88E5',  // Medium Blue
          accent: '#FFA000',     // Amber for accents
          dark: '#1D1D1D',
          'dark-page': '#121212',
          positive: '#4CAF50',
          negative: '#F44336',
          info: '#2196F3',
          warning: '#FF9800',
        },
        notify: {
          position: 'bottom',
          timeout: 3000,
        },
        loading: {
          delay: 400,
          spinnerColor: 'primary',
        },
      },
      iconSet: 'material-symbols-outlined',
      plugins: [
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage',
        'SessionStorage',
        'BottomSheet',
        'Dark',
      ],
    },

    animations: ['fadeIn', 'fadeOut', 'slideInLeft', 'slideInRight'],

    pwa: {
      workboxMode: 'InjectManifest',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,

      extendInjectManifestOptions(cfg) {
        cfg.maximumFileSizeToCacheInBytes = 5 * 1024 * 1024; // 5MB
      },

      // Manifest is in src-pwa/manifest.json (canonical for @quasar/app-vite v2)
    },
  };
});
