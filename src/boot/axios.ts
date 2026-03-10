import { boot } from 'quasar/wrappers';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { Notify } from 'quasar';
import { setApiRef } from 'src/services/api-adapter';
import { api } from 'src/lib/api';
import { i18n } from 'src/boot/i18n';

// Provide the api reference to the adapter (breaks the circular import)
setApiRef(api);

// Configure retry logic for failed requests
axiosRetry(api, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    const responseStatus = error.response?.status;
    if (responseStatus === 401 || responseStatus === 403) {
      return false;
    }
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (responseStatus !== undefined && responseStatus >= 500)
    );
  },
});

// Request interceptor — attach Bearer token if available
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authToken =
      localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (authToken && config.headers) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — handle auth expiry and network errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear stored token
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }
    if (!error.response && error.code === 'ERR_NETWORK') {
      console.warn('Network error - app may be offline');
    }
    return Promise.reject(error);
  }
);

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;

  app.config.errorHandler = (err, _instance, info) => {
    console.error('[Vue] Unhandled component error:', err, 'info:', info);
    Notify.create({
      type: 'negative',
      message: i18n.global.t('errors.unexpectedError'),
      position: 'top',
      timeout: 5000,
    });
  };
});

export { api };
