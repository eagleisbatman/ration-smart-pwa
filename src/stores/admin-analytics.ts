import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/lib/api';
import { useAuthStore } from './auth';

export interface EwActivity {
  user_id: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  user_role: string | null;
  farmer_count: number;
  cow_count: number;
  diet_count: number;
  milk_log_count: number;
  last_active: string | null;
}

export interface OrgBreakdown {
  organization_id: string;
  organization_name: string;
  organization_type: string | null;
  ew_count: number;
  farmer_count: number;
  cow_count: number;
  diet_count: number;
}

export interface CountryBreakdown {
  country_id: string;
  country_name: string;
  country_code: string;
  org_count: number;
  user_count: number;
  farmer_count: number;
  cow_count: number;
}

export interface AnalyticsSummary {
  total_ews?: number;
  total_farmers: number;
  total_cows: number;
  total_diets?: number;
  total_milk_logs?: number;
  total_orgs?: number;
  total_users?: number;
  total_countries?: number;
}

export const useAdminAnalyticsStore = defineStore('admin-analytics', () => {
  const ewActivities = ref<EwActivity[]>([]);
  const orgBreakdowns = ref<OrgBreakdown[]>([]);
  const countryBreakdowns = ref<CountryBreakdown[]>([]);
  const summary = ref<AnalyticsSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Current context for drill-down
  const currentOrgName = ref<string>('');
  const currentCountryName = ref<string>('');

  const authStore = useAuthStore();

  async function fetchOrgAnalytics(orgId: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const resp = await api.get(`/api/v1/admin/analytics/org/${orgId}`, {
        params: { admin_user_id: authStore.userId },
      });
      ewActivities.value = resp.data.extension_workers || [];
      summary.value = resp.data.summary || null;
      currentOrgName.value = resp.data.organization_name || '';
    } catch (err) {
      error.value = 'Failed to fetch organization analytics';
      console.error('[admin-analytics] fetchOrgAnalytics error:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCountryAnalytics(countryId: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const resp = await api.get(`/api/v1/admin/analytics/country/${countryId}`, {
        params: { admin_user_id: authStore.userId },
      });
      orgBreakdowns.value = resp.data.organizations || [];
      summary.value = resp.data.summary || null;
      currentCountryName.value = resp.data.country_name || '';
    } catch (err) {
      error.value = 'Failed to fetch country analytics';
      console.error('[admin-analytics] fetchCountryAnalytics error:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchGlobalAnalytics(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const resp = await api.get('/api/v1/admin/analytics/global', {
        params: { admin_user_id: authStore.userId },
      });
      countryBreakdowns.value = resp.data.countries || [];
      summary.value = resp.data.summary || null;
    } catch (err) {
      error.value = 'Failed to fetch global analytics';
      console.error('[admin-analytics] fetchGlobalAnalytics error:', err);
    } finally {
      loading.value = false;
    }
  }

  return {
    ewActivities,
    orgBreakdowns,
    countryBreakdowns,
    summary,
    loading,
    error,
    currentOrgName,
    currentCountryName,
    fetchOrgAnalytics,
    fetchCountryAnalytics,
    fetchGlobalAnalytics,
  };
});
