import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/lib/api';
import { db, Organization } from 'src/lib/offline/db';
import { useAuthStore } from './auth';
import { extractUserFriendlyError } from 'src/lib/error-messages';

export interface OrganizationInput {
  name: string;
  type?: string;
  country_id?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
}

export const useOrganizationsStore = defineStore('organizations', () => {
  // State
  const organizations = ref<Organization[]>([]);
  const currentOrganization = ref<Organization | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const organizationCount = computed(() => organizations.value.length);
  const hasOrganization = computed(() => !!currentOrganization.value);

  // Actions
  async function fetchOrganizations(includeInactive = false): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/api/v1/organizations', {
        params: { include_inactive: includeInactive },
      });

      organizations.value = response.data.organizations || [];

      // Cache to IndexedDB
      await db.organizations.clear();
      for (const org of organizations.value) {
        await db.organizations.put({ ...org, _synced: true });
      }
    } catch (err) {
      error.value = extractUserFriendlyError(err);

      // Try to load from IndexedDB cache
      const cached = await db.organizations.toArray();
      if (cached.length > 0) {
        organizations.value = cached;
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchOrganization(id: string): Promise<Organization | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/api/v1/organizations/${id}`);
      const org = response.data as Organization;

      // Update cache
      await db.organizations.put({ ...org, _synced: true });

      // If this is the user's org, set as current
      const authStore = useAuthStore();
      if (authStore.user?.organization_id === id) {
        currentOrganization.value = org;
      }

      return org;
    } catch (err) {
      error.value = extractUserFriendlyError(err);

      // Try cache
      const cached = await db.organizations.get(id);
      return cached || null;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentOrganization(): Promise<void> {
    const authStore = useAuthStore();
    const orgId = authStore.user?.organization_id;

    if (!orgId) {
      currentOrganization.value = null;
      return;
    }

    const org = await fetchOrganization(orgId);
    currentOrganization.value = org;
  }

  async function createOrganization(input: OrganizationInput): Promise<Organization | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/api/v1/organizations', input);
      const org = response.data as Organization;

      // Add to local state
      organizations.value.push(org);

      // Cache to IndexedDB
      await db.organizations.put({ ...org, _synced: true });

      return org;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateOrganization(id: string, input: Partial<OrganizationInput>): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/api/v1/organizations/${id}`, input);
      const updatedOrg = response.data as Organization;

      // Update local state
      const index = organizations.value.findIndex((o) => o.id === id);
      if (index !== -1) {
        organizations.value[index] = updatedOrg;
      }

      // Update current org if it's the one being edited
      if (currentOrganization.value?.id === id) {
        currentOrganization.value = updatedOrg;
      }

      // Update cache
      await db.organizations.put({ ...updatedOrg, _synced: true });

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteOrganization(id: string, hardDelete = false): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await api.delete(`/api/v1/organizations/${id}`, {
        params: { hard_delete: hardDelete },
      });

      // Remove from local state
      organizations.value = organizations.value.filter((o) => o.id !== id);

      // Clear current if it was deleted
      if (currentOrganization.value?.id === id) {
        currentOrganization.value = null;
      }

      // Remove from cache
      await db.organizations.delete(id);

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function getOrganizationUsers(orgId: string): Promise<unknown[]> {
    try {
      const response = await api.get(`/api/v1/organizations/${orgId}/users`);
      return response.data.users || [];
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return [];
    }
  }

  async function getOrganizationFarmers(orgId: string): Promise<unknown[]> {
    try {
      const response = await api.get(`/api/v1/organizations/${orgId}/farmers`);
      return response.data.farmers || [];
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return [];
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    organizations.value = [];
    currentOrganization.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    organizations,
    currentOrganization,
    loading,
    error,
    // Computed
    organizationCount,
    hasOrganization,
    // Actions
    fetchOrganizations,
    fetchOrganization,
    fetchCurrentOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationUsers,
    getOrganizationFarmers,
    clearError,
    reset,
  };
});
