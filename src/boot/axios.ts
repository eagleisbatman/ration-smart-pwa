import { boot } from 'quasar/wrappers';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { Notify } from 'quasar';
import type { Router } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { handleRequestInterceptor, handleResponseInterceptor, setApiRef } from 'src/services/api-adapter';
import { api } from 'src/lib/api';

// Router instance set during boot, used by the 401 interceptor to redirect
let appRouter: Router | null = null;

// Provide the api reference to the adapter (breaks the circular import)
setApiRef(api);

// Configure retry logic for failed requests
axiosRetry(api, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    // Never retry auth failures — let the interceptor handle redirect
    const responseStatus = error.response?.status;
    if (responseStatus === 401 || responseStatus === 403) {
      return false;
    }
    // Retry on network errors or 5xx server errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (responseStatus !== undefined && responseStatus >= 500)
    );
  },
});

// Request interceptor - adapt endpoints and add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();

    // Apply API adapter transformations (endpoint mapping, request transforms)
    const adaptedConfig = handleRequestInterceptor(config);

    // Add API key header
    const apiKey = process.env.APP_API_KEY;
    if (apiKey && adaptedConfig.headers) {
      adaptedConfig.headers['X-API-Key'] = apiKey;
    }

    // Add auth token if available
    if (authStore.token && adaptedConfig.headers) {
      adaptedConfig.headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    // Add user ID header if available
    if (authStore.userId && adaptedConfig.headers) {
      adaptedConfig.headers['X-User-ID'] = authStore.userId;
    }

    return adaptedConfig as InternalAxiosRequestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - transform responses and handle errors
api.interceptors.response.use(
  (response) => {
    // Apply API adapter response transformations
    return handleResponseInterceptor(response);
  },
  async (error: AxiosError) => {
    const authStore = useAuthStore();

    // Handle 401 Unauthorized / 403 with expired token — redirect to login
    const status = error.response?.status;
    const detail = (error.response?.data as { detail?: string })?.detail || '';
    const isAuthFailure =
      status === 401 ||
      (status === 403 && /invalid|expired|token/i.test(detail));

    if (isAuthFailure && authStore.isAuthenticated) {
      // Only act on 401/403 when the user has an active session.
      // A 401 on a login attempt (unauthenticated user, wrong credentials) must NOT
      // trigger logout — that would clear the country cache and break subsequent
      // register-phone calls (country_id becomes undefined → Pydantic 422).
      Notify.create({
        type: 'warning',
        message: 'Session expired. Please log in again.',
        icon: 'lock_clock',
        position: 'top',
        timeout: 4000,
      });
      // Use logout() (not clearAuth()) so IndexedDB user data is also wiped,
      // preventing a second user on the same device from seeing stale cached data.
      void authStore.logout();
      // Redirect to login immediately (avoid stale page state)
      if (appRouter && appRouter.currentRoute.value.path !== '/auth/login') {
        appRouter.push('/auth/login');
      }
    }

    // Handle network errors for offline support
    if (!error.response && error.code === 'ERR_NETWORK') {
      // Network error - likely offline
      console.warn('Network error - app may be offline');
    }

    return Promise.reject(error);
  }
);

export default boot(({ app, router }) => {
  appRouter = router;
  // Make axios available globally
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  // Global Vue error handler — catches unhandled component errors that would
  // otherwise be silently swallowed in production (Quasar/Vue3 default).
  // Logs to console and shows a Notify so users know something went wrong.
  app.config.errorHandler = (err, _instance, info) => {
    console.error('[Vue] Unhandled component error:', err, 'info:', info);
    Notify.create({
      type: 'negative',
      message: 'An unexpected error occurred. Please refresh the page.',
      position: 'top',
      timeout: 5000,
    });
  };
});

// Re-export for backward compatibility (prefer importing from 'src/lib/api')
export { api };
