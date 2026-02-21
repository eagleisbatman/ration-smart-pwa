import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/lib/api';
import { useAuthStore } from './auth';

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  user_role: string | null;
  admin_level: string;
  is_active: boolean;
  created_at: string | null;
}

export interface AdminOrg {
  id: string;
  name: string;
  type: string | null;
  country_id: string | null;
  is_active: boolean;
}

export const useAdminStore = defineStore('admin', () => {
  const users = ref<AdminUser[]>([]);
  const orgs = ref<AdminOrg[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchOrgUsers(orgId: string): Promise<AdminUser[]> {
    const authStore = useAuthStore();
    loading.value = true;
    error.value = null;
    try {
      const resp = await api.get(`/api/v1/admin/users/org/${orgId}`, {
        params: { admin_user_id: authStore.userId },
      });
      users.value = (resp.data.users || []).map((u: Record<string, unknown>) => ({
        id: String(u.id || u.user_id || ''),
        name: String(u.name || ''),
        email: u.email || u.email_id || null,
        phone_number: u.phone_number || null,
        user_role: u.user_role || null,
        admin_level: (u.admin_level as string) || 'user',
        is_active: u.is_active ?? true,
        created_at: u.created_at ? String(u.created_at) : null,
      })) as AdminUser[];
      return users.value;
    } catch (err) {
      error.value = 'Failed to fetch users';
      console.error('[admin] fetchOrgUsers error:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchAllUsers(page = 1, pageSize = 50, search?: string): Promise<{ users: AdminUser[]; total: number }> {
    const authStore = useAuthStore();
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, string | number> = {
        admin_user_id: authStore.userId || '',
        page,
        page_size: pageSize,
      };
      if (search) params.search = search;

      const resp = await api.get('/api/v1/admin/users', { params });
      const data = resp.data;
      users.value = (data.users || []).map((u: Record<string, unknown>) => ({
        id: String(u.id || u.user_id || ''),
        name: String(u.name || ''),
        email: u.email || u.email_id || null,
        phone_number: u.phone_number || null,
        user_role: u.user_role || null,
        admin_level: (u.admin_level as string) || 'user',
        is_active: u.is_active ?? true,
        created_at: u.created_at ? String(u.created_at) : null,
      })) as AdminUser[];
      return { users: users.value, total: data.total_count || data.total || users.value.length };
    } catch (err) {
      error.value = 'Failed to fetch users';
      console.error('[admin] fetchAllUsers error:', err);
      return { users: [], total: 0 };
    } finally {
      loading.value = false;
    }
  }

  async function setAdminLevel(userId: string, level: string | null): Promise<boolean> {
    const authStore = useAuthStore();
    error.value = null;
    try {
      await api.put(`/api/v1/admin/users/${userId}/set-admin-level`, {
        admin_level: level === 'user' ? null : level,
      }, {
        params: { admin_user_id: authStore.userId },
      });
      // Update local state
      const idx = users.value.findIndex((u) => u.id === userId);
      if (idx >= 0) {
        users.value[idx].admin_level = level || 'user';
      }
      return true;
    } catch (err) {
      error.value = 'Failed to update admin level';
      console.error('[admin] setAdminLevel error:', err);
      return false;
    }
  }

  async function fetchOrgs(): Promise<{ orgs: AdminOrg[]; total: number }> {
    loading.value = true;
    error.value = null;
    try {
      const resp = await api.get('/api/v1/organizations');
      const data = resp.data;
      const rawOrgs = data?.organizations ?? data ?? [];
      orgs.value = (Array.isArray(rawOrgs) ? rawOrgs : []).map((o: Record<string, unknown>) => ({
        id: String(o.id),
        name: String(o.name || ''),
        type: o.type ? String(o.type) : null,
        country_id: o.country_id ? String(o.country_id) : null,
        is_active: o.is_active ?? true,
      }));
      const total = data?.count ?? data?.total_count ?? orgs.value.length;
      return { orgs: orgs.value, total };
    } catch (err) {
      error.value = 'Failed to fetch organizations';
      console.error('[admin] fetchOrgs error:', err);
      return { orgs: [], total: 0 };
    } finally {
      loading.value = false;
    }
  }

  return {
    users,
    orgs,
    loading,
    error,
    fetchOrgUsers,
    fetchAllUsers,
    setAdminLevel,
    fetchOrgs,
  };
});
