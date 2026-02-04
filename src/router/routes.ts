import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // Auth routes
  {
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('pages/auth/LoginPage.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('pages/auth/RegisterPage.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: 'country',
        name: 'country-select',
        component: () => import('pages/auth/CountrySelectPage.vue'),
        meta: { requiresGuest: true },
      },
    ],
  },

  // Main app routes
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/HomePage.vue'),
        meta: { title: 'RationSmart' },
      },

      // Cows
      {
        path: 'cows',
        name: 'cows',
        component: () => import('pages/cows/CowListPage.vue'),
        meta: { title: 'My Cows' },
      },
      {
        path: 'cows/new',
        name: 'cow-new',
        component: () => import('pages/cows/CowFormPage.vue'),
        meta: { title: 'Add Cow', showBack: true, hideBottomNav: true },
      },
      {
        path: 'cows/:id',
        name: 'cow-detail',
        component: () => import('pages/cows/CowDetailPage.vue'),
        meta: { title: 'Cow Details', showBack: true },
      },
      {
        path: 'cows/:id/edit',
        name: 'cow-edit',
        component: () => import('pages/cows/CowFormPage.vue'),
        meta: { title: 'Edit Cow', showBack: true, hideBottomNav: true },
      },

      // Diet
      {
        path: 'diet',
        name: 'diet',
        component: () => import('pages/diet/DietListPage.vue'),
        meta: { title: 'Diet Plans' },
      },
      {
        path: 'diet/new',
        name: 'diet-new',
        component: () => import('pages/diet/DietWizardPage.vue'),
        meta: { title: 'New Diet Plan', showBack: true, hideBottomNav: true, hideFab: true },
      },
      {
        path: 'diet/:id',
        name: 'diet-detail',
        component: () => import('pages/diet/DietDetailPage.vue'),
        meta: { title: 'Diet Details', showBack: true },
      },

      // Feeds
      {
        path: 'feeds',
        name: 'feeds',
        component: () => import('pages/feeds/FeedListPage.vue'),
        meta: { title: 'Feeds' },
      },
      {
        path: 'feeds/new',
        name: 'feed-new',
        component: () => import('pages/feeds/FeedFormPage.vue'),
        meta: { title: 'Add Custom Feed', showBack: true, hideBottomNav: true },
      },
      {
        path: 'feeds/:id',
        name: 'feed-detail',
        component: () => import('pages/feeds/FeedDetailPage.vue'),
        meta: { title: 'Feed Details', showBack: true },
      },
      {
        path: 'feeds/:id/edit',
        name: 'feed-edit',
        component: () => import('pages/feeds/FeedFormPage.vue'),
        meta: { title: 'Edit Feed', showBack: true, hideBottomNav: true },
      },

      // Milk Logs
      {
        path: 'logs',
        name: 'logs',
        component: () => import('pages/logs/LogListPage.vue'),
        meta: { title: 'Milk Logs' },
      },
      {
        path: 'logs/new',
        name: 'log-new',
        component: () => import('pages/logs/LogFormPage.vue'),
        meta: { title: 'Log Milk', showBack: true, hideBottomNav: true },
      },
      {
        path: 'logs/:id/edit',
        name: 'log-edit',
        component: () => import('pages/logs/LogFormPage.vue'),
        meta: { title: 'Edit Log', showBack: true, hideBottomNav: true },
      },

      // Farmers
      {
        path: 'farmers',
        name: 'farmers',
        component: () => import('pages/farmers/FarmerListPage.vue'),
        meta: { title: 'Farmers' },
      },
      {
        path: 'farmers/new',
        name: 'farmer-new',
        component: () => import('pages/farmers/FarmerFormPage.vue'),
        meta: { title: 'Add Farmer', showBack: true, hideBottomNav: true },
      },
      {
        path: 'farmers/:id',
        name: 'farmer-detail',
        component: () => import('pages/farmers/FarmerDetailPage.vue'),
        meta: { title: 'Farmer Details', showBack: true },
      },
      {
        path: 'farmers/:id/edit',
        name: 'farmer-edit',
        component: () => import('pages/farmers/FarmerFormPage.vue'),
        meta: { title: 'Edit Farmer', showBack: true, hideBottomNav: true },
      },

      // Yields
      {
        path: 'yields',
        name: 'yields',
        component: () => import('pages/yields/YieldHistoryPage.vue'),
        meta: { title: 'Yield History' },
      },
      {
        path: 'yields/new',
        name: 'yield-new',
        component: () => import('pages/yields/YieldFormPage.vue'),
        meta: { title: 'Record Yield', showBack: true, hideBottomNav: true },
      },

      // Reports
      {
        path: 'reports',
        name: 'reports',
        component: () => import('pages/reports/ReportListPage.vue'),
        meta: { title: 'Reports' },
      },
      {
        path: 'reports/:id',
        name: 'report-detail',
        component: () => import('pages/reports/ReportDetailPage.vue'),
        meta: { title: 'Report', showBack: true },
      },

      // Settings
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/settings/SettingsPage.vue'),
        meta: { title: 'Settings' },
      },
      {
        path: 'settings/profile',
        name: 'profile',
        component: () => import('pages/settings/ProfilePage.vue'),
        meta: { title: 'Profile', showBack: true },
      },
    ],
  },

  // Offline fallback page
  {
    path: '/offline',
    name: 'offline',
    component: () => import('pages/OfflinePage.vue'),
    meta: { hideBottomNav: true },
  },

  // 404 - Catch all
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
