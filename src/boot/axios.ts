import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { useAuthStore } from 'src/stores/auth';
import { handleRequestInterceptor, handleResponseInterceptor } from 'src/services/api-adapter';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Create axios instance
const api = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    if (apiKey) {
      adaptedConfig.headers['X-API-Key'] = apiKey;
    }

    // Add auth token if available
    if (authStore.token) {
      adaptedConfig.headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    // Add user ID header if available
    if (authStore.userId) {
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
      authStore.clearAuth();
      // Redirect to login will be handled by router guard
    }

    // Handle network errors for offline support
    if (!error.response && error.code === 'ERR_NETWORK') {
      // Network error - likely offline
      console.warn('Network error - app may be offline');
    }

    return Promise.reject(error);
  }
);

export default boot(({ app }) => {
  // Make axios available globally
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
