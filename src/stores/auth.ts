import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { db, User } from 'src/lib/offline/db';
import { fetchAndCacheCountries, setCountryCache } from 'src/services/api-adapter';

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
  const onboardingSkipped = ref(sessionStorage.getItem('onboarding_skipped') === 'true');

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!userId.value);
  const userCountry = computed(() => user.value?.country_code || 'IN');
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
   * Fetch and cache countries for country_code to country_id UUID lookup
   * This must be called before registration to ensure proper mapping
   */
  async function ensureCountriesLoaded(): Promise<void> {
    try {
      // Fetch countries from backend
      const response = await api.get('/api/v1/countries');
      const countries = response.data as Array<{ id: string; country_code: string }>;
      // Cache them in the api-adapter for use during registration
      setCountryCache(countries);
    } catch (err) {
      console.warn('[Auth] Failed to pre-load countries, will attempt during registration:', err);
      // Try the async fallback
      await fetchAndCacheCountries();
    }
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

      // Determine the correct endpoint based on registration method
      const isPhoneRegistration = data.phone && !data.email;
      const endpoint = isPhoneRegistration
        ? '/api/v1/users/register-phone'
        : '/api/v1/users/register';

      // The api-adapter will transform the request data automatically:
      // - Convert phone to E.164 format (e.g., "9876543210" -> "+919876543210")
      // - Convert country_code to country_id UUID
      // - Map field names (email -> email_id, phone -> phone_number)
      const response = await api.post(endpoint, data);

      // Handle response - backend returns different field names
      const responseData = response.data;
      const userData = responseData.user;
      const authToken = responseData.access_token || responseData.token;
      const responseUserId = userData?.id || responseData.user_id;

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
    country_code?: string; // Needed for phone login to format E.164
    rememberMe?: boolean;
  }): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Determine the correct endpoint based on login method
      const isPhoneLogin = data.phone && !data.email;
      const endpoint = isPhoneLogin
        ? '/api/v1/users/login-phone'
        : '/api/v1/users/login';

      // Strip rememberMe before sending to the API
      const { rememberMe, ...apiData } = data;

      // The api-adapter will transform the request data automatically:
      // - Convert phone to E.164 format
      // - Map field names (email -> email_id, phone -> phone_number)
      const response = await api.post(endpoint, apiData);

      // Handle response - backend returns different field names
      const responseData = response.data;
      const userData = responseData.user;
      const authToken = responseData.access_token || responseData.token;
      const responseUserId = userData?.id || responseData.user_id;

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
      }

      // If self_farmer_profile_id wasn't in login response, fetch full profile
      if (!selfFarmerProfileId.value && responseUserId) {
        await loadUserProfile();
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function verifyPin(pin: string): Promise<boolean> {
    // NOTE: Backend does not have a verify-pin endpoint.
    // Login already returns a token directly. This function is a no-op stub
    // until a dedicated verify-pin endpoint is added to the backend.
    console.warn('[auth] verifyPin called but backend has no /auth/verify-pin endpoint');
    error.value = 'PIN verification is not available';
    return false;
  }

  async function loadUserProfile(): Promise<void> {
    if (!userId.value) return;

    loading.value = true;

    try {
      // Try to load from server first
      const response = await api.get(`/api/v1/users/${userId.value}`);
      user.value = response.data;
      await db.users.put(response.data);

      // Update extended state from user data
      if (response.data.user_role) {
        userRole.value = response.data.user_role;
        localStorage.setItem('user_role', response.data.user_role);
      }
      if (response.data.language_code) {
        preferredLanguage.value = response.data.language_code;
        localStorage.setItem('preferred_language', response.data.language_code);
      }
      if (response.data.self_farmer_profile_id) {
        selfFarmerProfileId.value = response.data.self_farmer_profile_id;
        localStorage.setItem('self_farmer_profile_id', response.data.self_farmer_profile_id);
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
      if (settings.organization_id) params.append('organization_id', settings.organization_id);
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

      // Update user object if returned
      if (response.data) {
        user.value = { ...user.value, ...response.data };
        await db.users.put(user.value as User);
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
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
      error.value = extractErrorMessage(err);
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

  async function requestContactChange(type: 'email' | 'phone', newValue: string): Promise<boolean> {
    // NOTE: Backend does not have change-contact endpoints yet.
    // This is a stub until the backend adds /auth/change-contact/request.
    console.warn('[auth] requestContactChange called but backend has no /auth/change-contact/request endpoint');
    error.value = 'Contact change is not yet available';
    return false;
  }

  async function verifyContactChange(type: 'email' | 'phone', newValue: string, code: string): Promise<boolean> {
    // NOTE: Backend does not have change-contact endpoints yet.
    // This is a stub until the backend adds /auth/change-contact/verify.
    console.warn('[auth] verifyContactChange called but backend has no /auth/change-contact/verify endpoint');
    error.value = 'Contact change verification is not yet available';
    return false;
  }

  function clearAuth(): void {
    user.value = null;
    token.value = null;
    userId.value = null;
    userRole.value = 'farmer';
    preferredLanguage.value = 'en';
    selfFarmerProfileId.value = null;
    onboardingSkipped.value = false;

    // Clear auth data from both storages
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem('auth_token');
      storage.removeItem('user_id');
    }
    localStorage.removeItem('remember_me');
    localStorage.removeItem('user_role');
    localStorage.removeItem('preferred_language');
    localStorage.removeItem('self_farmer_profile_id');
    sessionStorage.removeItem('onboarding_skipped');
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
    countries,
    countriesLoading,
    userRole,
    preferredLanguage,
    selfFarmerProfileId,
    onboardingSkipped,
    // Computed
    isAuthenticated,
    userCountry,
    userLanguage,
    needsOnboarding,
    isExtensionWorker,
    isResearcher,
    isFarmerRole,
    // Actions
    fetchCountries,
    ensureCountriesLoaded,
    register,
    login,
    verifyPin,
    loadUserProfile,
    updateProfile,
    updateUserSettings,
    createSelfProfile,
    getSelfProfile,
    changePin,
    requestContactChange,
    verifyContactChange,
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
