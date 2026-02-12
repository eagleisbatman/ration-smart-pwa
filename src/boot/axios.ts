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
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status !== undefined && error.response.status >= 500)
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

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      // Only show notification if user was previously authenticated
      if (authStore.isAuthenticated) {
        Notify.create({
          type: 'warning',
          message: 'Session expired. Please log in again.',
          icon: 'lock_clock',
          position: 'top',
          timeout: 4000,
        });
      }
      authStore.clearAuth();
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
});

// Re-export for backward compatibility (prefer importing from 'src/lib/api')
export { api };
