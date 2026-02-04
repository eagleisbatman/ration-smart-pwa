const { configure } = require('quasar/wrappers');

module.exports = configure((/* ctx */) => {
  return {
    eslint: {
      warnings: true,
      errors: true,
    },

    boot: ['axios', 'dexie', 'pwa'],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
      'material-icons-outlined',
    ],

    build: {
      target: {
        browser: ['es2022', 'chrome100', 'firefox100', 'safari15'],
      },
      vueRouterMode: 'history',
      env: {
        API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        APP_API_KEY: process.env.VITE_APP_API_KEY || '',
      },
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {
        brand: {
          primary: '#2E7D32',    // Green - agriculture theme
          secondary: '#558B2F',  // Light green
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
      iconSet: 'material-icons',
      plugins: [
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage',
        'SessionStorage',
        'BottomSheet',
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
        // Customize Workbox InjectManifest options
        cfg.maximumFileSizeToCacheInBytes = 5 * 1024 * 1024; // 5MB
      },

      manifest: {
        name: 'RationSmart',
        short_name: 'RationSmart',
        description: 'Optimize your cattle\'s diet for better productivity and lower costs',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#ffffff',
        theme_color: '#2E7D32',
        start_url: '/',
        scope: '/',
        categories: ['agriculture', 'productivity', 'utilities'],
        icons: [
          {
            src: 'icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Log Milk',
            short_name: 'Log',
            description: 'Log daily milk production',
            url: '/logs/new?source=shortcut',
            icons: [{ src: 'icons/shortcut-log.png', sizes: '192x192' }],
          },
          {
            name: 'Get Diet',
            short_name: 'Diet',
            description: 'Get diet recommendation',
            url: '/diet/new?source=shortcut',
            icons: [{ src: 'icons/shortcut-diet.png', sizes: '192x192' }],
          },
        ],
      },

      // iOS-specific meta tags
      metaVariables: {
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'default',
        appleTouchIcon120: 'icons/apple-icon-120x120.png',
        appleTouchIcon180: 'icons/apple-icon-180x180.png',
        appleTouchIcon152: 'icons/apple-icon-152x152.png',
        appleTouchIcon167: 'icons/apple-icon-167x167.png',
        msapplicationTileImage: 'icons/ms-icon-144x144.png',
        msapplicationTileColor: '#2E7D32',
      },
    },
  };
});
