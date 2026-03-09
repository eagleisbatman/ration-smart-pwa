import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/lib/api';
import { useAuthStore } from './auth';
import { extractUserFriendlyError } from 'src/lib/error-messages';

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string | null;
}

export const useAdminStore = defineStore('admin', () => {
  const users = ref<AdminUser[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function _normalizeUser(u: Record<string, unknown>): AdminUser {
    return {
      id: String(u.id || u.user_id || ''),
      name: String(u.name || ''),
      email: (u.email || u.email_id || null) as string | null,
      is_admin: (u.is_admin ?? false) as boolean,
      is_active: (u.is_active ?? true) as boolean,
      created_at: u.created_at ? String(u.created_at) : null,
    };
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

      const resp = await api.get('/admin/users', { params });
      const data = resp.data;
      users.value = (data.users || []).map(_normalizeUser);
      return { users: users.value, total: data.total_count || data.total || users.value.length };
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      console.error('[admin] fetchAllUsers error:', err);
      return { users: [], total: 0 };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Toggle user active status on EC2.
   * EC2: PUT /admin/users/{user_id}/toggle-status
   * Body: { action: 'enable' | 'disable' }
   */
  async function toggleUserStatus(userId: string, enable: boolean): Promise<boolean> {
    const authStore = useAuthStore();
    error.value = null;
    try {
      await api.put(`/admin/users/${userId}/toggle-status`, {
        action: enable ? 'enable' : 'disable',
      }, {
        params: { admin_user_id: authStore.userId },
      });
      // Update local state
      const idx = users.value.findIndex((u) => u.id === userId);
      if (idx >= 0) {
        users.value[idx].is_active = enable;
      }
      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      console.error('[admin] toggleUserStatus error:', err);
      return false;
    }
  }

  // ---- Feed Management ----
  async function fetchFeeds(page = 1, search?: string, countryId?: string): Promise<{ feeds: Record<string, unknown>[]; total: number }> {
    const authStore = useAuthStore();
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, string | number> = {
        admin_user_id: authStore.userId || '',
        page,
        page_size: 25,
      };
      if (search) params.search = search;
      if (countryId) params.country_id = countryId;
      const resp = await api.get('/admin/list-feeds', { params });
      const data = resp.data;
      return { feeds: data.feeds || [], total: data.total_count || 0 };
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return { feeds: [], total: 0 };
    } finally {
      loading.value = false;
    }
  }

  async function addFeed(payload: Record<string, unknown>): Promise<boolean> {
    const authStore = useAuthStore();
    error.value = null;
    try {
      await api.post('/admin/add-feed', payload, {
        params: { admin_user_id: authStore.userId },
      });
      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    }
  }

  async function updateFeed(feedId: string, payload: Record<string, unknown>): Promise<boolean> {
    const authStore = useAuthStore();
    error.value = null;
    try {
      await api.put(`/admin/update-feed/${feedId}`, payload, {
        params: { admin_user_id: authStore.userId },
      });
      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    }
  }

  async function deleteFeed(feedId: string): Promise<boolean> {
    const authStore = useAuthStore();
    error.value = null;
    try {
      await api.delete(`/admin/delete-feed/${feedId}`, {
        params: { admin_user_id: authStore.userId },
      });
      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    }
  }

  async function bulkUploadFeeds(file: File, countryId: string): Promise<{ success: boolean; message: string }> {
    const authStore = useAuthStore();
    error.value = null;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await api.post('/admin/bulk-upload-feeds', formData, {
        params: { admin_user_id: authStore.userId, country_id: countryId },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: true, message: resp.data.message || 'Upload complete' };
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return { success: false, message: error.value || 'Upload failed' };
    }
  }

  async function exportFeeds(countryId?: string): Promise<string | null> {
    const authStore = useAuthStore();
    error.value = null;
    try {
      const params: Record<string, string> = { admin_user_id: authStore.userId || '' };
      if (countryId) params.country_id = countryId;
      const resp = await api.get('/admin/export-feeds', { params });
      return resp.data?.download_url || resp.data?.url || null;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return null;
    }
  }

  // ---- Feedback ----
  async function fetchFeedback(limit = 50): Promise<Record<string, unknown>[]> {
    const authStore = useAuthStore();
    loading.value = true;
    error.value = null;
    try {
      const resp = await api.get('/admin/user-feedback/all', {
        params: { admin_user_id: authStore.userId, limit },
      });
      return resp.data?.feedbacks || resp.data || [];
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchFeedbackStats(): Promise<Record<string, unknown> | null> {
    const authStore = useAuthStore();
    error.value = null;
    try {
      const resp = await api.get('/admin/user-feedback/stats', {
        params: { admin_user_id: authStore.userId },
      });
      return resp.data || null;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return null;
    }
  }

  // ---- Reports ----
  async function fetchAllReports(page = 1): Promise<{ reports: Record<string, unknown>[]; total: number }> {
    const authStore = useAuthStore();
    loading.value = true;
    error.value = null;
    try {
      const resp = await api.get('/admin/get-all-reports', {
        params: { admin_user_id: authStore.userId, page, page_size: 25 },
      });
      const data = resp.data;
      return { reports: data.reports || [], total: data.total_count || 0 };
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return { reports: [], total: 0 };
    } finally {
      loading.value = false;
    }
  }

  // ---- Simulation Stats ----
  async function fetchSimulationStats(): Promise<Record<string, unknown> | null> {
    const authStore = useAuthStore();
    error.value = null;
    try {
      const resp = await api.get('/admin/simulation-stats', {
        params: { admin_user_id: authStore.userId },
      });
      return resp.data || null;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return null;
    }
  }

  return {
    users,
    loading,
    error,
    fetchAllUsers,
    toggleUserStatus,
    fetchFeeds,
    addFeed,
    updateFeed,
    deleteFeed,
    bulkUploadFeeds,
    exportFeeds,
    fetchFeedback,
    fetchFeedbackStats,
    fetchAllReports,
    fetchSimulationStats,
  };
});
