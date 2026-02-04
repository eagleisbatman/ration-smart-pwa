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

  // Navigation guards
  Router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();

    // Check if route requires authentication
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!authStore.isAuthenticated) {
        // Redirect to login with return URL
        next({
          path: '/auth/login',
          query: { redirect: to.fullPath },
        });
        return;
      }
    }

    // Check if route requires guest (non-authenticated)
    if (to.matched.some((record) => record.meta.requiresGuest)) {
      if (authStore.isAuthenticated) {
        // Redirect to home
        next({ path: '/' });
        return;
      }
    }

    next();
  });

  return Router;
});
