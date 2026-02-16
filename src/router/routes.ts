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
        path: 'forgot-pin',
        name: 'forgot-pin',
        component: () => import('pages/auth/ForgotPinPage.vue'),
        meta: { requiresGuest: true },
      },
      // Onboarding flow
      {
        path: 'language',
        name: 'language-select',
        component: () => import('pages/auth/LanguageSelectPage.vue'),
        meta: { requiresAuth: true, isOnboarding: true },
      },
      {
        path: 'role',
        name: 'role-select',
        component: () => import('pages/auth/RoleSelectPage.vue'),
        meta: { requiresAuth: true, isOnboarding: true },
      },
      {
        path: 'organization',
        name: 'org-select',
        component: () => import('pages/auth/OrgSelectPage.vue'),
        meta: { requiresAuth: true, isOnboarding: true },
      },
      {
        path: 'profile-setup',
        name: 'profile-setup',
        component: () => import('pages/auth/MyProfileSetupPage.vue'),
        meta: { requiresAuth: true, isOnboarding: true },
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
        meta: { titleKey: 'nav.myCows', hideFab: true },
      },
      {
        path: 'cows/new',
        name: 'cow-new',
        component: () => import('pages/cows/CowFormPage.vue'),
        meta: { titleKey: 'cow.addCow', showBack: true, hideBottomNav: true, hideFab: true },
      },
      {
        path: 'cows/:id',
        name: 'cow-detail',
        component: () => import('pages/cows/CowDetailPage.vue'),
        meta: { titleKey: 'cow.cowDetails', showBack: true, hideFab: true },
      },
      {
        path: 'cows/:id/edit',
        name: 'cow-edit',
        component: () => import('pages/cows/CowFormPage.vue'),
        meta: { titleKey: 'cow.editCow', showBack: true, hideBottomNav: true, hideFab: true },
      },

      // Diet
      {
        path: 'diet',
        name: 'diet',
        component: () => import('pages/diet/DietListPage.vue'),
        meta: { titleKey: 'nav.diet', hideFab: true },
      },
      {
        path: 'diet/new',
        name: 'diet-new',
        component: () => import('pages/diet/DietWizardPage.vue'),
        meta: { titleKey: 'diet.newDietPlan', showBack: true, hideBottomNav: true, hideFab: true },
      },
      {
        path: 'diet/compare',
        name: 'diet-compare',
        component: () => import('pages/diet/DietComparePage.vue'),
        meta: { titleKey: 'diet.compare', showBack: true, hideFab: true },
      },
      {
        path: 'diet/:id',
        name: 'diet-detail',
        component: () => import('pages/diet/DietDetailPage.vue'),
        meta: { titleKey: 'diet.dietDetails', showBack: true, hideFab: true },
      },

      // Feeds
      {
        path: 'feeds',
        name: 'feeds',
        component: () => import('pages/feeds/FeedListPage.vue'),
        meta: { titleKey: 'nav.feeds', hideFab: true },
      },
      {
        path: 'feeds/new',
        name: 'feed-new',
        component: () => import('pages/feeds/FeedFormPage.vue'),
        meta: { titleKey: 'feeds.addCustomFeed', showBack: true, hideBottomNav: true, hideFab: true },
      },
      {
        path: 'feeds/:id',
        name: 'feed-detail',
        component: () => import('pages/feeds/FeedDetailPage.vue'),
        meta: { titleKey: 'feeds.feedDetails', showBack: true, hideFab: true },
      },
      {
        path: 'feeds/:id/edit',
        name: 'feed-edit',
        component: () => import('pages/feeds/FeedFormPage.vue'),
        meta: { titleKey: 'feeds.editFeed', showBack: true, hideBottomNav: true, hideFab: true },
      },

      // Milk Logs
      {
        path: 'logs',
        name: 'logs',
        component: () => import('pages/logs/LogListPage.vue'),
        meta: { titleKey: 'nav.milkLogs', hideFab: true },
      },
      {
        path: 'logs/new',
        name: 'log-new',
        component: () => import('pages/logs/LogFormPage.vue'),
        meta: { titleKey: 'logs.form.title.new', showBack: true, hideBottomNav: true, hideFab: true },
      },
      {
        path: 'logs/:id/edit',
        name: 'log-edit',
        component: () => import('pages/logs/LogFormPage.vue'),
        meta: { titleKey: 'logs.form.title.edit', showBack: true, hideBottomNav: true, hideFab: true },
      },

      // Farmers
      {
        path: 'farmers',
        name: 'farmers',
        component: () => import('pages/farmers/FarmerListPage.vue'),
        meta: { titleKey: 'farmer.farmers', hideFab: true },
      },
      {
        path: 'farmers/new',
        name: 'farmer-new',
        component: () => import('pages/farmers/FarmerFormPage.vue'),
        meta: { titleKey: 'farmer.addFarmer', showBack: true, hideBottomNav: true, hideFab: true },
      },
      {
        path: 'farmers/import',
        name: 'farmer-import',
        component: () => import('pages/farmers/FarmerImportPage.vue'),
        meta: { titleKey: 'farmers.import.title', showBack: true, hideBottomNav: true, hideFab: true },
      },
      {
        path: 'farmers/:id',
        name: 'farmer-detail',
        component: () => import('pages/farmers/FarmerDetailPage.vue'),
        meta: { titleKey: 'farmer.farmerDetails', showBack: true, hideFab: true },
      },
      {
        path: 'farmers/:id/edit',
        name: 'farmer-edit',
        component: () => import('pages/farmers/FarmerFormPage.vue'),
        meta: { titleKey: 'farmer.editFarmer', showBack: true, hideBottomNav: true, hideFab: true },
      },

      // Yields
      {
        path: 'yields',
        name: 'yields',
        component: () => import('pages/yields/YieldHistoryPage.vue'),
        meta: { titleKey: 'nav.yieldHistory', hideFab: true },
      },
      {
        path: 'yields/new',
        name: 'yield-new',
        component: () => import('pages/yields/YieldFormPage.vue'),
        meta: { titleKey: 'logs.yield.recordYield', showBack: true, hideBottomNav: true, hideFab: true },
      },
      {
        path: 'yields/compare-farmers',
        name: 'yield-farmer-compare',
        component: () => import('pages/yields/FarmerYieldComparePage.vue'),
        meta: { titleKey: 'yields.compare.title', showBack: true, hideFab: true },
      },
      {
        path: 'yields/:id/edit',
        name: 'yield-edit',
        component: () => import('pages/yields/YieldFormPage.vue'),
        meta: { titleKey: 'logs.yield.editYield', showBack: true, hideBottomNav: true, hideFab: true },
      },

      // Organization Analytics
      {
        path: 'analytics',
        name: 'org-analytics',
        component: () => import('pages/yields/OrgAnalyticsPage.vue'),
        meta: { titleKey: 'nav.analytics', showBack: true, hideFab: true },
      },

      // Reports
      {
        path: 'reports',
        name: 'reports',
        component: () => import('pages/reports/ReportListPage.vue'),
        meta: { titleKey: 'nav.reports', hideFab: true },
      },
      {
        path: 'reports/:id',
        name: 'report-detail',
        component: () => import('pages/reports/ReportDetailPage.vue'),
        meta: { titleKey: 'reports.reportDetail', showBack: true, hideFab: true },
      },

      // Settings
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/settings/SettingsPage.vue'),
        meta: { titleKey: 'nav.settings', hideFab: true },
      },
      {
        path: 'settings/profile',
        name: 'profile',
        component: () => import('pages/settings/ProfilePage.vue'),
        meta: { titleKey: 'settings.profile', showBack: true, hideFab: true },
      },
      {
        path: 'settings/help',
        name: 'help',
        component: () => import('pages/settings/HelpPage.vue'),
        meta: { titleKey: 'help.title', showBack: true, hideFab: true },
      },
      {
        path: 'settings/privacy',
        name: 'privacy',
        component: () => import('pages/settings/PrivacyPolicyPage.vue'),
        meta: { titleKey: 'privacy.title', showBack: true, hideFab: true },
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
