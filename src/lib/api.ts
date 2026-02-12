/**
 * Axios API instance (separated from boot file to avoid Vite mixed import warning).
 *
 * The boot file (src/boot/axios.ts) sets up interceptors and global config.
 * All stores and components should import `api` from here, not from the boot file.
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

const api = axios.create({
  baseURL: (process.env.API_BASE_URL || 'http://localhost:8000').trim(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { api };
