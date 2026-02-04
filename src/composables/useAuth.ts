import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

export function useAuth() {
  const authStore = useAuthStore();
  const router = useRouter();

  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const user = computed(() => authStore.user);
  const loading = computed(() => authStore.loading);
  const error = computed(() => authStore.error);

  async function login(credentials: {
    email?: string;
    phone?: string;
    pin: string;
  }): Promise<boolean> {
    const success = await authStore.login(credentials);
    if (success) {
      await router.push('/');
    }
    return success;
  }

  async function register(data: {
    email?: string;
    phone?: string;
    pin: string;
    country_code: string;
    language?: string;
    name?: string;
  }): Promise<boolean> {
    const success = await authStore.register(data);
    if (success) {
      await router.push('/');
    }
    return success;
  }

  async function logout(): Promise<void> {
    await authStore.logout();
    await router.push('/auth/login');
  }

  function requireAuth(): boolean {
    if (!isAuthenticated.value) {
      router.push('/auth/login');
      return false;
    }
    return true;
  }

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    register,
    logout,
    requireAuth,
  };
}
