import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import routes from './routes';

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Track whether auth store has been initialized this session
  let authInitialized = false;

  // Navigation guards
  Router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore();
    const isOnboardingRoute = to.matched.some((record) => record.meta.isOnboarding);

    // Initialize auth store once per session (loads user profile from IndexedDB + API).
    // Must await to ensure selfFarmerProfileId is loaded before onboarding checks.
    if (!authInitialized && authStore.isAuthenticated) {
      authInitialized = true;
      await authStore.initialize();
    }

    // Check if route requires authentication
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!authStore.isAuthenticated) {
        // When offline with no cached auth, show offline page instead of login
        if (!navigator.onLine && to.name !== 'offline') {
          next({ name: 'offline' });
          return;
        }
        // Redirect to login with return URL
        next({
          path: '/auth/login',
          query: { redirect: to.fullPath },
        });
        return;
      }

      // Check if authenticated user needs to complete onboarding
      if (authStore.needsOnboarding && !isOnboardingRoute) {
        // Redirect to onboarding flow
        next({ path: '/auth/role' });
        return;
      }
    }

    // Check if route requires admin privileges
    if (to.matched.some((record) => record.meta.requiresAdmin)) {
      if (!authStore.isAnyAdmin) {
        next({ path: '/' });
        return;
      }
    }

    // Check if route requires guest (non-authenticated)
    if (to.matched.some((record) => record.meta.requiresGuest)) {
      if (authStore.isAuthenticated) {
        // Check if user needs onboarding before going to home
        if (authStore.needsOnboarding) {
          next({ path: '/auth/role' });
        } else {
          next({ path: '/' });
        }
        return;
      }
    }

    next();
  });

  return Router;
});
