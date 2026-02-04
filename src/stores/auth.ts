import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { db, User } from 'src/lib/offline/db';

export interface AuthState {
  user: User | null;
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const userId = ref<string | null>(localStorage.getItem('user_id'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!userId.value);
  const userCountry = computed(() => user.value?.country_code || 'IN');
  const userLanguage = computed(() => user.value?.language || 'en');

  // Actions
  async function register(data: {
    email?: string;
    phone?: string;
    pin: string;
    country_code: string;
    language?: string;
    name?: string;
  }): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/api/v1/users/register', data);
      const { user: userData, token: authToken, user_id } = response.data;

      // Save to local state
      user.value = userData;
      token.value = authToken;
      userId.value = user_id;

      // Persist to localStorage
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user_id', user_id);

      // Save user to IndexedDB
      await db.users.put(userData);

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function login(data: {
    email?: string;
    phone?: string;
    pin: string;
  }): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/api/v1/users/login', data);
      const { user: userData, token: authToken, user_id } = response.data;

      // Save to local state
      user.value = userData;
      token.value = authToken;
      userId.value = user_id;

      // Persist to localStorage
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user_id', user_id);

      // Save user to IndexedDB
      await db.users.put(userData);

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function verifyPin(pin: string): Promise<boolean> {
    if (!userId.value) {
      error.value = 'No user session found';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/api/v1/users/verify-pin', {
        user_id: userId.value,
        pin,
      });

      token.value = response.data.token;
      localStorage.setItem('auth_token', response.data.token);

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function loadUserProfile(): Promise<void> {
    if (!userId.value) return;

    loading.value = true;

    try {
      // Try to load from server first
      const response = await api.get(`/api/v1/users/${userId.value}`);
      user.value = response.data;
      await db.users.put(response.data);
    } catch {
      // Fallback to local cache
      const cachedUser = await db.users.get(userId.value);
      if (cachedUser) {
        user.value = cachedUser;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(data: Partial<User>): Promise<boolean> {
    if (!userId.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/api/v1/users/${userId.value}`, data);
      user.value = response.data;
      await db.users.put(response.data);
      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function changePin(currentPin: string, newPin: string): Promise<boolean> {
    if (!userId.value) return false;

    loading.value = true;
    error.value = null;

    try {
      await api.post('/api/v1/users/change-pin', {
        user_id: userId.value,
        current_pin: currentPin,
        new_pin: newPin,
      });
      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  function clearAuth(): void {
    user.value = null;
    token.value = null;
    userId.value = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
  }

  async function logout(): Promise<void> {
    // Clear local data
    clearAuth();
    await db.clearUserData();
  }

  // Initialize - load user from cache if token exists
  async function initialize(): Promise<void> {
    if (userId.value) {
      await loadUserProfile();
    }
  }

  return {
    // State
    user,
    token,
    userId,
    loading,
    error,
    // Computed
    isAuthenticated,
    userCountry,
    userLanguage,
    // Actions
    register,
    login,
    verifyPin,
    loadUserProfile,
    updateProfile,
    changePin,
    clearAuth,
    logout,
    initialize,
  };
});

// Helper to extract error message
function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) {
      return response.data.detail;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred';
}
