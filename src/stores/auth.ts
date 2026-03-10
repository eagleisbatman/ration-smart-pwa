import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/lib/api';
import { db, User } from 'src/lib/offline/db';
import { setCountryCache, clearCountryCache, toAlpha2 } from 'src/services/api-adapter';
import { extractUserFriendlyError } from 'src/lib/error-messages';
import { setLocale } from 'src/boot/i18n';

export interface Country {
  id: string;
  country_code: string;
  name?: string;
  code?: string; // alias added by api-adapter response transform
}

export interface AuthState {
  user: User | null;
  userId: string | null;
  isAuthenticated: boolean;
  userRole: string;
  preferredLanguage: string;
}

// Helper: determine which storage backend holds the session.
// When "Remember me" was checked we persist in localStorage; otherwise sessionStorage.
function getStorage(): Storage {
  return localStorage.getItem('remember_me') === '1' ? localStorage : sessionStorage;
}

// Normalize backend user response to match frontend User type.
// EC2 returns email_id, country_id (UUID); frontend expects email, country_code (alpha-2).
function normalizeUser(data: Record<string, unknown>): User {
  const normalized = { ...data };

  // email_id → email
  if ('email_id' in normalized && !normalized.email) {
    normalized.email = normalized.email_id;
  }
  delete normalized.email_id;

  // Extract country_code from nested country object (alpha-3 → alpha-2)
  if (!normalized.country_code && normalized.country && typeof normalized.country === 'object') {
    const country = normalized.country as Record<string, unknown>;
    if (country.country_code) {
      normalized.country_code = toAlpha2(country.country_code as string);
    }
  }

  return normalized as unknown as User;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(
    localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'),
  );
  const userId = ref<string | null>(
    localStorage.getItem('user_id') || sessionStorage.getItem('user_id'),
  );
  const userEmail = ref<string | null>(
    localStorage.getItem('user_email') || sessionStorage.getItem('user_email'),
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Countries state
  const countries = ref<Country[]>([]);
  const countriesLoading = ref(false);

  // Extended state
  const userRole = ref<string>(localStorage.getItem('user_role') || 'farmer');
  const preferredLanguage = ref<string>(localStorage.getItem('preferred_language') || 'en');
  const adminLevel = ref<string | null>(localStorage.getItem('admin_level'));
  const profileImage = ref<string | null>(localStorage.getItem('profile_image'));

  // Computed — EC2 has no JWT, so isAuthenticated checks userId only
  const isAuthenticated = computed(() => !!userId.value);
  const userCountry = computed(
    () => user.value?.country_code || localStorage.getItem('last_country_code') || ''
  );
  const userLanguage = computed(() => preferredLanguage.value || 'en');
  const needsOnboarding = computed(() => false);

  // Role-based computed properties
  const isExtensionWorker = computed(() => {
    const role = userRole.value?.toLowerCase();
    return role === 'extension_worker' || role === 'nutritionist';
  });

  const isResearcher = computed(() => {
    return userRole.value?.toLowerCase() === 'researcher';
  });

  const isFarmerRole = computed(() => {
    const role = userRole.value?.toLowerCase();
    return role === 'farmer' || role === 'feed_supplier' || role === 'other';
  });

  // Admin — EC2 has simple is_admin boolean, not hierarchy
  const isAdmin = computed(() => adminLevel.value === 'admin' || adminLevel.value === 'super_admin');
  const isOrgAdmin = computed(() => isAdmin.value);
  const isCountryAdmin = computed(() => isAdmin.value);
  const isSuperAdmin = computed(() => isAdmin.value);
  const isAnyAdmin = computed(() => isAdmin.value);

  // Actions

  /**
   * Fetch countries from the EC2 API.
   * EC2 returns: [{id: UUID, name, country_code: alpha-3, currency, is_active}]
   */
  async function fetchCountries(): Promise<void> {
    if (countries.value.length > 0) {
      setCountryCache(countries.value as Array<{ id: string; country_code: string }>);
      return;
    }

    countriesLoading.value = true;
    try {
      const response = await api.get('/auth/countries');
      const data = response.data as Country[];
      countries.value = data;
      localStorage.setItem('cached_countries', JSON.stringify(data));
      setCountryCache(data as Array<{ id: string; country_code: string }>);
    } catch (err) {
      console.warn('[Auth] Failed to fetch countries from API, trying localStorage cache:', err);
      const cached = localStorage.getItem('cached_countries');
      if (cached) {
        try {
          countries.value = JSON.parse(cached) as Country[];
          setCountryCache(countries.value as Array<{ id: string; country_code: string }>);
        } catch {
          console.warn('[Auth] Failed to parse cached countries');
        }
      }
    } finally {
      countriesLoading.value = false;
    }
  }

  async function ensureCountriesLoaded(): Promise<void> {
    await fetchCountries();
  }

  /**
   * Register a new user (EC2: email-based).
   * EC2 POST /auth/register expects: {name, email_id, pin, country_id}
   * EC2 returns: {success, message, user: {id, name, email_id, country_id, country, is_admin}}
   */
  async function register(data: {
    email: string;
    pin: string;
    country_code: string;
    name?: string;
  }): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Ensure countries are loaded for country_code -> country_id UUID mapping
      await ensureCountriesLoaded();

      // Find country_id UUID from country_code
      const country = countries.value.find(
        c => toAlpha2(c.country_code) === data.country_code
      );
      if (!country) {
        error.value = 'Country not found. Please select a valid country.';
        return false;
      }

      const response = await api.post('/auth/register', {
        name: data.name || data.email.split('@')[0],
        email_id: data.email,
        pin: data.pin,
        country_id: country.id,
      });

      const responseData = response.data;

      // Backend may return {access_token, user} or {success, user}
      const rawUser = responseData.user;
      if (!rawUser) {
        error.value = responseData.message || 'Registration failed';
        return false;
      }

      const responseUserId = rawUser.id;
      const userData = normalizeUser(rawUser);

      // Save to local state
      user.value = userData;
      userId.value = responseUserId;
      userEmail.value = data.email;
      if (responseData.access_token) {
        token.value = responseData.access_token;
      }

      // Persist to localStorage (new users stay signed in)
      if (responseUserId) {
        localStorage.setItem('user_id', responseUserId);
      }
      localStorage.setItem('user_email', data.email);
      if (responseData.access_token) {
        localStorage.setItem('auth_token', responseData.access_token);
      }

      // Save user to IndexedDB
      if (userData) {
        await db.users.put(userData);
      }

      // Persist last-used country
      if (data.country_code) {
        localStorage.setItem('last_country_code', data.country_code);
      }

      // Set admin level from response
      if (rawUser?.is_admin) {
        adminLevel.value = 'admin';
        localStorage.setItem('admin_level', 'admin');
      }

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Login (EC2: email-based).
   * EC2 POST /auth/login expects: {email_id, pin}
   * EC2 returns: {success, message, user: {id, name, email_id, country_id, country, is_admin}}
   * No JWT token — auth is tracked client-side.
   */
  async function login(data: {
    email: string;
    pin: string;
    rememberMe?: boolean;
  }): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/auth/login', {
        email_id: data.email,
        pin: data.pin,
      });

      const responseData = response.data;

      // Backend may return {access_token, user} or {success, user}
      const rawUser = responseData.user;
      if (!rawUser) {
        error.value = responseData.message || 'Login failed';
        return false;
      }

      const responseUserId = rawUser.id;
      const userData = normalizeUser(rawUser);

      // Save to local state
      user.value = userData;
      userId.value = responseUserId;
      userEmail.value = data.email;
      if (responseData.access_token) {
        token.value = responseData.access_token;
      }

      // Choose storage backend based on "Remember me" preference
      if (data.rememberMe) {
        localStorage.setItem('remember_me', '1');
      } else {
        localStorage.removeItem('remember_me');
      }
      const storage = getStorage();

      if (responseUserId) {
        storage.setItem('user_id', responseUserId);
      }
      storage.setItem('user_email', data.email);
      if (responseData.access_token) {
        storage.setItem('auth_token', responseData.access_token);
      }

      // Save user to IndexedDB
      if (userData) {
        await db.users.put(userData);
      }

      // Persist last-used country
      if (userData?.country_code) {
        localStorage.setItem('last_country_code', userData.country_code);
      }

      // Set admin level from is_admin boolean
      if (rawUser?.is_admin) {
        adminLevel.value = 'admin';
        localStorage.setItem('admin_level', 'admin');
      } else {
        adminLevel.value = null;
        localStorage.removeItem('admin_level');
      }

      // Restore language if available
      if (userData?.language_code || userData?.language) {
        const lang = userData.language_code || userData.language || 'en';
        preferredLanguage.value = lang;
        localStorage.setItem('preferred_language', lang);
        setLocale(lang);
      }

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Load user profile from EC2.
   * EC2 GET /auth/user/{email_id} returns: {id, name, email_id, country_id, country, is_admin}
   */
  async function loadUserProfile(): Promise<void> {
    if (!userEmail.value) return;

    loading.value = true;

    try {
      const response = await api.get(`/auth/user/${encodeURIComponent(userEmail.value)}`);
      const normalizedData = normalizeUser(response.data);
      user.value = normalizedData;
      await db.users.put(normalizedData);
    } catch {
      // Fallback to local cache
      if (userId.value) {
        const cachedUser = await db.users.get(userId.value);
        if (cachedUser) {
          user.value = cachedUser;
        }
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update user profile on EC2.
   * EC2 PUT /auth/user/{email_id} expects: {name?, country_id?}
   */
  async function updateProfile(data: Partial<User>): Promise<boolean> {
    if (!userEmail.value) return false;

    loading.value = true;
    error.value = null;

    try {
      // EC2 accepts name and country_id
      const updateData: Record<string, unknown> = {};
      if (data.name) updateData.name = data.name;
      if (data.country_id) updateData.country_id = data.country_id;
      // If country_code passed, resolve to country_id UUID
      if (data.country_code && !data.country_id) {
        const country = countries.value.find(
          c => toAlpha2(c.country_code) === data.country_code
        );
        if (country) updateData.country_id = country.id;
      }

      const response = await api.put(
        `/auth/user/${encodeURIComponent(userEmail.value)}`,
        updateData
      );
      const normalized = normalizeUser(response.data);
      user.value = normalized;
      await db.users.put(normalized);

      // Update country cache
      if (normalized.country_code) {
        localStorage.setItem('last_country_code', normalized.country_code);
      }

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Change PIN on EC2.
   * EC2 POST /auth/change-pin expects: {email_id, current_pin, new_pin}
   */
  async function changePin(currentPin: string, newPin: string): Promise<boolean> {
    if (!userEmail.value) return false;

    loading.value = true;
    error.value = null;

    try {
      await api.post('/auth/change-pin', {
        email_id: userEmail.value,
        current_pin: currentPin,
        new_pin: newPin,
      });
      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  function setProfileImage(image: string | null): void {
    profileImage.value = image;
    if (image) {
      localStorage.setItem('profile_image', image);
    } else {
      localStorage.removeItem('profile_image');
    }
  }

  function clearAuth(): void {
    user.value = null;
    token.value = null;
    userId.value = null;
    userEmail.value = null;
    const savedRole = localStorage.getItem('user_role') || 'farmer';
    const savedLang = localStorage.getItem('preferred_language') || 'en';
    userRole.value = savedRole;
    preferredLanguage.value = savedLang;
    adminLevel.value = null;
    profileImage.value = null;

    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem('user_id');
      storage.removeItem('user_email');
      storage.removeItem('auth_token');
    }
    localStorage.removeItem('remember_me');
    localStorage.removeItem('admin_level');
    localStorage.removeItem('profile_image');

    clearCountryCache();
  }

  async function logout(): Promise<void> {
    clearAuth();
    await db.clearUserData();

    try {
      const { useFeedsStore } = await import('./feeds');
      useFeedsStore().$patch({ masterFeeds: [], customFeeds: [] });
    } catch {
      // Non-critical
    }
  }

  // Initialize - restore user from IndexedDB, then refresh from API.
  async function initialize(): Promise<void> {
    if (userId.value) {
      try {
        const cachedUser = await db.users.get(userId.value);
        if (cachedUser) {
          user.value = normalizeUser(cachedUser as unknown as Record<string, unknown>);
        }
      } catch {
        // IndexedDB unavailable
      }
      if (userEmail.value) {
        await loadUserProfile();
      }
    }
  }

  return {
    // State
    user,
    token,
    userId,
    userEmail,
    loading,
    error,
    countries,
    countriesLoading,
    userRole,
    preferredLanguage,
    adminLevel,
    profileImage,
    // Computed
    isAuthenticated,
    userCountry,
    userLanguage,
    needsOnboarding,
    isExtensionWorker,
    isResearcher,
    isFarmerRole,
    isAdmin,
    isOrgAdmin,
    isCountryAdmin,
    isSuperAdmin,
    isAnyAdmin,
    // Actions
    fetchCountries,
    ensureCountriesLoaded,
    register,
    login,
    loadUserProfile,
    updateProfile,
    changePin,
    setProfileImage,
    clearAuth,
    logout,
    initialize,
  };
});
