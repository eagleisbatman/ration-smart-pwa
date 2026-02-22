import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/lib/api';
import { db, User } from 'src/lib/offline/db';
import { fetchAndCacheCountries, setCountryCache, clearCountryCache, toAlpha2 } from 'src/services/api-adapter';
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
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  userRole: string;
  preferredLanguage: string;
  selfFarmerProfileId: string | null;
  needsOnboarding: boolean;
}

// Helper: determine which storage backend holds the session.
// When "Remember me" was checked we persist in localStorage; otherwise sessionStorage.
function getStorage(): Storage {
  return localStorage.getItem('remember_me') === '1' ? localStorage : sessionStorage;
}

// Normalize backend user response to match frontend User type.
// Backend returns email_id, phone_number, country_id (UUID), language_code;
// frontend expects email, phone, country_code (alpha-2), language.
function normalizeUser(data: Record<string, unknown>): User {
  const normalized = { ...data };

  // email_id → email
  if ('email_id' in normalized && !normalized.email) {
    normalized.email = normalized.email_id;
  }
  delete normalized.email_id;

  // phone_number → phone
  if ('phone_number' in normalized && !normalized.phone) {
    normalized.phone = normalized.phone_number;
  }
  delete normalized.phone_number;

  // language_code → language (same value, e.g. "en")
  if (normalized.language_code && !normalized.language) {
    normalized.language = normalized.language_code;
  }

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
  // State – try both storages so a returning session is found regardless
  const user = ref<User | null>(null);
  const token = ref<string | null>(
    localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'),
  );
  const userId = ref<string | null>(
    localStorage.getItem('user_id') || sessionStorage.getItem('user_id'),
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Countries state
  const countries = ref<Country[]>([]);
  const countriesLoading = ref(false);

  // Extended state for generic user system
  const userRole = ref<string>(localStorage.getItem('user_role') || 'farmer');
  const preferredLanguage = ref<string>(localStorage.getItem('preferred_language') || 'en');
  const selfFarmerProfileId = ref<string | null>(localStorage.getItem('self_farmer_profile_id'));
  const adminLevel = ref<string | null>(localStorage.getItem('admin_level'));
  const onboardingSkipped = ref(sessionStorage.getItem('onboarding_skipped') === 'true');
  const profileImage = ref<string | null>(localStorage.getItem('profile_image'));

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!userId.value);
  const userCountry = computed(
    () => user.value?.country_code || localStorage.getItem('last_country_code') || 'IN'
  );
  const userLanguage = computed(() => user.value?.language_code || preferredLanguage.value || 'en');
  const needsOnboarding = computed(() => isAuthenticated.value && !selfFarmerProfileId.value && !onboardingSkipped.value);

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

  // Admin hierarchy computed properties
  const isOrgAdmin = computed(() => adminLevel.value === 'org_admin');
  const isCountryAdmin = computed(() => adminLevel.value === 'country_admin');
  const isSuperAdmin = computed(() => adminLevel.value === 'super_admin');
  const isAnyAdmin = computed(() => !!adminLevel.value && ['org_admin', 'country_admin', 'super_admin'].includes(adminLevel.value));

  // Actions

  /**
   * Fetch countries from the API for dropdown population.
   * Caches the result in localStorage for offline fallback.
   */
  async function fetchCountries(): Promise<void> {
    // If already loaded, skip
    if (countries.value.length > 0) return;

    countriesLoading.value = true;
    try {
      const response = await api.get('/api/v1/countries');
      const data = response.data as Country[];
      countries.value = data;
      // Cache in localStorage for offline fallback
      localStorage.setItem('cached_countries', JSON.stringify(data));
      // Also seed the api-adapter cache for country_code -> UUID lookup
      setCountryCache(data as Array<{ id: string; country_code: string }>);
    } catch (err) {
      console.warn('[Auth] Failed to fetch countries from API, trying localStorage cache:', err);
      // Fall back to localStorage cache
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

  /**
   * Ensure countries are loaded for country_code to country_id UUID lookup.
   * Delegates to fetchCountries which populates both the store and api-adapter cache.
   */
  async function ensureCountriesLoaded(): Promise<void> {
    await fetchCountries();
  }

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
      // Ensure countries are loaded for country_code -> country_id mapping
      await ensureCountriesLoaded();

      // Always use phone registration endpoint
      const endpoint = '/api/v1/users/register-phone';

      // The api-adapter will transform the request data automatically:
      // - Convert phone to E.164 format (e.g., "9876543210" -> "+919876543210")
      // - Convert country_code to country_id UUID
      // - Map field names (email -> email_id, phone -> phone_number)
      const response = await api.post(endpoint, data);

      // Handle response - backend returns different field names
      const responseData = response.data;
      const rawUser = responseData.user;
      const authToken = responseData.access_token || responseData.token;
      const responseUserId = rawUser?.id || responseData.user_id;

      // Normalize backend field names (email_id→email, phone_number→phone, etc.)
      const userData = rawUser ? normalizeUser(rawUser) : null;

      // Save to local state
      user.value = userData;
      token.value = authToken;
      userId.value = responseUserId;

      // Always persist to localStorage after registration (not sessionStorage).
      // New users proceed directly into onboarding, so we keep them signed in
      // across tabs/refreshes — equivalent to "remember me" by default.
      if (authToken) {
        localStorage.setItem('auth_token', authToken);
      }
      if (responseUserId) {
        localStorage.setItem('user_id', responseUserId);
      }

      // Save user to IndexedDB
      if (userData) {
        await db.users.put(userData);
      }

      // Persist last-used country for future login pre-fill
      if (data.country_code) {
        localStorage.setItem('last_country_code', data.country_code);
      }

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function login(data: {
    email?: string;
    phone?: string;
    pin: string;
    country_code?: string; // Needed for phone login to format E.164
    rememberMe?: boolean;
  }): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Always use phone login endpoint
      const endpoint = '/api/v1/users/login-phone';

      // Strip rememberMe before sending to the API
      const { rememberMe, ...apiData } = data;

      // The api-adapter will transform the request data automatically:
      // - Convert phone to E.164 format
      // - Map field names (email -> email_id, phone -> phone_number)
      const response = await api.post(endpoint, apiData);

      // Handle response - backend returns different field names
      const responseData = response.data;
      const rawUser = responseData.user;
      const authToken = responseData.access_token || responseData.token;
      const responseUserId = rawUser?.id || responseData.user_id;

      // Normalize backend field names (email_id→email, phone_number→phone, etc.)
      const userData = rawUser ? normalizeUser(rawUser) : null;

      // Save to local state
      user.value = userData;
      token.value = authToken;
      userId.value = responseUserId;

      // Choose storage backend based on "Remember me" preference
      if (rememberMe) {
        localStorage.setItem('remember_me', '1');
      } else {
        localStorage.removeItem('remember_me');
      }
      const storage = getStorage();

      // Persist auth tokens to the chosen storage
      if (authToken) {
        storage.setItem('auth_token', authToken);
      }
      if (responseUserId) {
        storage.setItem('user_id', responseUserId);
      }

      // Save user to IndexedDB
      if (userData) {
        await db.users.put(userData);
      }

      // Persist last-used country so the login page can pre-fill it next time
      // (this key is intentionally NOT cleared by clearAuth)
      if (data.country_code) {
        localStorage.setItem('last_country_code', data.country_code);
      }

      // Restore onboarding-related fields from login response
      if (userData?.self_farmer_profile_id) {
        selfFarmerProfileId.value = userData.self_farmer_profile_id;
        localStorage.setItem('self_farmer_profile_id', userData.self_farmer_profile_id);
      }
      if (userData?.user_role) {
        userRole.value = userData.user_role;
        localStorage.setItem('user_role', userData.user_role);
      }
      if (userData?.language_code) {
        preferredLanguage.value = userData.language_code;
        localStorage.setItem('preferred_language', userData.language_code);
        // Sync i18n engine so the app displays in the correct language immediately
        setLocale(userData.language_code);
      }
      if (userData?.profile_image_url) {
        profileImage.value = userData.profile_image_url;
        localStorage.setItem('profile_image', userData.profile_image_url);
      }

      // Sync milk price from backend to local settings store
      if (userData?.milk_price_per_liter != null) {
        const { useSettingsStore } = await import('./settings');
        const settingsStore = useSettingsStore();
        settingsStore.loadFromUserProfile(userData.milk_price_per_liter);
      }

      // Restore admin_level from login response
      const respAdminLevel = responseData.admin_level || userData?.admin_level || null;
      adminLevel.value = respAdminLevel;
      if (respAdminLevel) {
        localStorage.setItem('admin_level', respAdminLevel);
      } else {
        localStorage.removeItem('admin_level');
      }

      // If self_farmer_profile_id wasn't in login response, fetch full profile
      if (!selfFarmerProfileId.value && responseUserId) {
        await loadUserProfile();
      }

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
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
      const normalizedData = normalizeUser(response.data);
      user.value = normalizedData;
      await db.users.put(normalizedData);

      // Update extended state from user data
      if (normalizedData.user_role) {
        userRole.value = normalizedData.user_role;
        localStorage.setItem('user_role', normalizedData.user_role);
      }
      if (normalizedData.language_code || normalizedData.language) {
        const lang = normalizedData.language_code || normalizedData.language || 'en';
        preferredLanguage.value = lang;
        localStorage.setItem('preferred_language', lang);
        setLocale(lang);
      }
      if (normalizedData.self_farmer_profile_id) {
        selfFarmerProfileId.value = normalizedData.self_farmer_profile_id;
        localStorage.setItem('self_farmer_profile_id', normalizedData.self_farmer_profile_id);
      }
      if (normalizedData.profile_image_url) {
        profileImage.value = normalizedData.profile_image_url;
        localStorage.setItem('profile_image', normalizedData.profile_image_url);
      }
      // Restore admin_level from profile
      const profileAdminLevel = normalizedData.admin_level || null;
      adminLevel.value = profileAdminLevel;
      if (profileAdminLevel) {
        localStorage.setItem('admin_level', profileAdminLevel);
      } else {
        localStorage.removeItem('admin_level');
      }

      // If self_farmer_profile_id still not set, check via self-profile endpoint
      if (!selfFarmerProfileId.value) {
        try {
          const profileResp = await api.get(`/api/v1/users/${userId.value}/self-profile`);
          if (profileResp.data?.id) {
            selfFarmerProfileId.value = profileResp.data.id;
            localStorage.setItem('self_farmer_profile_id', profileResp.data.id);
          }
        } catch {
          // 404 means no self-profile yet — user needs onboarding
        }
      }
    } catch {
      // Fallback to local cache (userId may have been cleared by 401 interceptor)
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

  async function updateProfile(data: Partial<User>): Promise<boolean> {
    if (!userId.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/api/v1/users/${userId.value}`, data);
      const normalized = normalizeUser(response.data);
      user.value = normalized;
      await db.users.put(normalized);
      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
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
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateUserSettings(settings: {
    user_role?: string;
    language_code?: string;
    organization_id?: string | null;
  }): Promise<boolean> {
    if (!userId.value) return false;

    loading.value = true;
    error.value = null;

    try {
      // Backend expects settings as query parameters, not request body
      const params = new URLSearchParams();
      if (settings.user_role) params.append('user_role', settings.user_role);
      if (settings.language_code) params.append('language_code', settings.language_code);
      if (settings.organization_id !== undefined) params.append('organization_id', settings.organization_id || '');
      const queryString = params.toString();
      const settingsUrl = `/api/v1/users/${userId.value}/settings${queryString ? '?' + queryString : ''}`;
      const response = await api.put(settingsUrl);

      // Update local state
      if (settings.user_role) {
        userRole.value = settings.user_role;
        localStorage.setItem('user_role', settings.user_role);
      }
      if (settings.language_code) {
        preferredLanguage.value = settings.language_code;
        localStorage.setItem('preferred_language', settings.language_code);
      }

      // Update user object if returned (normalize to PWA field names)
      if (response.data && user.value) {
        const normalized = normalizeUser(response.data);
        user.value = { ...user.value, ...normalized };
        await db.users.put(user.value as User);
      }

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function createSelfProfile(profileData: {
    name: string;
    phone?: string | null;
    village?: string | null;
    district?: string | null;
    state?: string | null;
  }): Promise<boolean> {
    if (!userId.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const response = await api.post(`/api/v1/users/${userId.value}/self-profile`, profileData);

      // Store the self farmer profile ID
      if (response.data?.id) {
        selfFarmerProfileId.value = response.data.id;
        localStorage.setItem('self_farmer_profile_id', response.data.id);
      }

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function getSelfProfile(): Promise<unknown | null> {
    if (!userId.value) return null;

    try {
      const response = await api.get(`/api/v1/users/${userId.value}/self-profile`);
      if (response.data?.id) {
        selfFarmerProfileId.value = response.data.id;
        localStorage.setItem('self_farmer_profile_id', response.data.id);
      }
      return response.data;
    } catch {
      return null;
    }
  }

  async function requestContactChange(type: 'email' | 'phone', newValue: string, pin?: string): Promise<boolean> {
    error.value = null;
    try {
      await api.post('/api/v1/auth/change-contact/request', {
        user_id: userId.value,
        type,
        new_value: newValue,
        pin: pin || '',
      });
      return true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      error.value = msg || 'Failed to request contact change';
      return false;
    }
  }

  async function verifyContactChange(type: 'email' | 'phone', newValue: string, code: string): Promise<boolean> {
    error.value = null;
    try {
      await api.post('/api/v1/auth/change-contact/verify', {
        user_id: userId.value,
        type,
        new_value: newValue,
        code,
      });

      // Update local user info
      if (user.value) {
        if (type === 'email') {
          user.value.email = newValue;
        } else {
          user.value.phone = newValue;
        }
        // Persist to IndexedDB
        await db.users.put(user.value);
      }

      return true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      error.value = msg || 'Failed to verify contact change';
      return false;
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
    // Preserve user preferences (role, language) — they survive session expiry
    // and will be restored from the backend on next login
    const savedRole = localStorage.getItem('user_role') || 'farmer';
    const savedLang = localStorage.getItem('preferred_language') || 'en';
    userRole.value = savedRole;
    preferredLanguage.value = savedLang;
    selfFarmerProfileId.value = null;
    adminLevel.value = null;
    onboardingSkipped.value = false;
    profileImage.value = null;

    // Clear auth data from both storages
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem('auth_token');
      storage.removeItem('user_id');
    }
    localStorage.removeItem('remember_me');
    // Keep user_role, preferred_language, and last_country_code so they
    // survive session expiry and pre-fill the login page correctly
    localStorage.removeItem('self_farmer_profile_id');
    localStorage.removeItem('admin_level');
    localStorage.removeItem('profile_image');
    sessionStorage.removeItem('onboarding_skipped');

    // Clear module-level caches to prevent stale data for next user
    clearCountryCache();
  }

  async function logout(): Promise<void> {
    // Clear local data
    clearAuth();
    await db.clearUserData();
  }

  // Initialize - restore user from IndexedDB immediately, then refresh from API.
  // This ensures UI has data instantly (name, email, phone) instead of waiting
  // for the network request — critical after app updates / page reloads.
  async function initialize(): Promise<void> {
    if (userId.value) {
      // 1. Instant restore from IndexedDB (survives reloads)
      try {
        const cachedUser = await db.users.get(userId.value);
        if (cachedUser) {
          // Normalize in case cached data has old backend field names
          user.value = normalizeUser(cachedUser as unknown as Record<string, unknown>);
        }
      } catch {
        // IndexedDB unavailable — will rely on API below
      }
      // 2. Refresh from server (updates IndexedDB too)
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
    countries,
    countriesLoading,
    userRole,
    preferredLanguage,
    selfFarmerProfileId,
    adminLevel,
    onboardingSkipped,
    profileImage,
    // Computed
    isAuthenticated,
    userCountry,
    userLanguage,
    needsOnboarding,
    isExtensionWorker,
    isResearcher,
    isFarmerRole,
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
    updateUserSettings,
    createSelfProfile,
    getSelfProfile,
    changePin,
    setProfileImage,
    requestContactChange,
    verifyContactChange,
    clearAuth,
    logout,
    initialize,
  };
});
