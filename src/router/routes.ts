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
    ],
  },

  // Main app routes (simulation flow)
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // Home dashboard
      {
        path: '',
        name: 'home',
        component: () => import('pages/simulation/HomePage.vue'),
        meta: { title: 'RationSmart' },
      },

      // Simulation flow
      {
        path: 'cattle-info',
        name: 'cattle-info',
        component: () => import('pages/simulation/CattleInfoPage.vue'),
        meta: { titleKey: 'simulation.cattleInfo', showBack: true },
      },
      {
        path: 'feed-selection',
        name: 'feed-selection',
        component: () => import('pages/simulation/FeedSelectionPage.vue'),
        meta: { titleKey: 'simulation.feedSelection', showBack: true },
      },
      {
        path: 'evaluation-report',
        name: 'evaluation-report',
        component: () => import('pages/simulation/EvaluationReportPage.vue'),
        meta: { titleKey: 'simulation.evaluationReport', showBack: true },
      },
      {
        path: 'recommendation-report',
        name: 'recommendation-report',
        component: () => import('pages/simulation/RecommendationReportPage.vue'),
        meta: { titleKey: 'simulation.recommendationReport', showBack: true },
      },

      // Feeds catalog
      {
        path: 'feeds',
        name: 'feeds',
        component: () => import('pages/feeds/FeedListPage.vue'),
        meta: { titleKey: 'nav.feeds' },
      },
      {
        path: 'feeds/:id',
        name: 'feed-detail',
        component: () => import('pages/feeds/FeedDetailPage.vue'),
        meta: { titleKey: 'feed.feedDetails', showBack: true },
      },

      // Settings
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/settings/SettingsPage.vue'),
        meta: { titleKey: 'nav.settings' },
      },
      {
        path: 'settings/profile',
        name: 'profile',
        component: () => import('pages/settings/ProfilePage.vue'),
        meta: { titleKey: 'settings.profile', showBack: true },
      },
      {
        path: 'settings/help',
        name: 'help',
        component: () => import('pages/settings/HelpPage.vue'),
        meta: { titleKey: 'help.title', showBack: true },
      },
      {
        path: 'settings/privacy',
        name: 'privacy',
        component: () => import('pages/settings/PrivacyPolicyPage.vue'),
        meta: { titleKey: 'privacy.title', showBack: true },
      },
      {
        path: 'settings/feedback',
        name: 'feedback',
        component: () => import('pages/settings/FeedbackPage.vue'),
        meta: { titleKey: 'settings.feedback', showBack: true },
      },

      // Admin
      {
        path: 'admin',
        name: 'admin-dashboard',
        component: () => import('pages/admin/AdminDashboardPage.vue'),
        meta: { titleKey: 'nav.admin', requiresAdmin: true },
      },
      {
        path: 'admin/users',
        name: 'admin-users',
        component: () => import('pages/admin/AdminUsersPage.vue'),
        meta: { titleKey: 'admin.userManagement', showBack: true, requiresAdmin: true },
      },
    ],
  },

  // Offline fallback page
  {
    path: '/offline',
    name: 'offline',
    component: () => import('pages/OfflinePage.vue'),
  },

  // 404 - Catch all
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
