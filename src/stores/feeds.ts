import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { api } from 'src/boot/axios';
import { db, Feed } from 'src/lib/offline/db';
import { queueCreate, queueUpdate, queueDelete } from 'src/lib/offline/sync-manager';
import { useAuthStore } from './auth';
import { isOnline } from 'src/boot/pwa';
import { fetchAndCacheCountries } from 'src/services/api-adapter';

export interface FeedInput {
  name: string;
  category: string;
  dm_percentage: number;
  cp_percentage: number;
  tdn_percentage: number;
  ca_percentage?: number;
  p_percentage?: number;
  ndf_percentage?: number;
  price_per_kg?: number;
  image_url?: string;
}

export const useFeedsStore = defineStore('feeds', () => {
  // State
  const masterFeeds = ref<Feed[]>([]);
  const customFeeds = ref<Feed[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const allFeeds = computed(() => [...masterFeeds.value, ...customFeeds.value]);

  const feedsByCategory = computed(() => {
    const grouped: Record<string, Feed[]> = {};
    for (const feed of allFeeds.value) {
      if (!grouped[feed.category]) {
        grouped[feed.category] = [];
      }
      grouped[feed.category].push(feed);
    }
    return grouped;
  });

  const categories = computed(() => Object.keys(feedsByCategory.value).sort());

  // Actions
  async function fetchMasterFeeds(countryCode?: string): Promise<void> {
    const authStore = useAuthStore();
    const country = countryCode || authStore.userCountry;

    loading.value = true;
    error.value = null;

    try {
      if (isOnline.value) {
        // Ensure country cache is populated so the API adapter can map country_code → country_id
        await fetchAndCacheCountries();

        const response = await api.get('/api/v1/feeds/master', {
          params: { country_code: country },
        });

        const rawFeeds = Array.isArray(response.data) ? response.data : [];
        const feeds = rawFeeds.map((feed: Feed) => ({
          ...feed,
          is_custom: 0,
          country_code: country,
          _synced: true,
          _deleted: false,
        }));

        // Update local database
        if (feeds.length > 0) {
          await db.feeds.bulkPut(feeds);
        }
      }

      // Load from local database
      masterFeeds.value = await db.feeds
        .where('is_custom')
        .equals(0)
        .filter((f) => !f._deleted)
        .toArray();
    } catch (err) {
      // Fallback to local data
      masterFeeds.value = await db.feeds
        .where('is_custom')
        .equals(0)
        .filter((f) => !f._deleted)
        .toArray();

      if (masterFeeds.value.length === 0) {
        error.value = extractErrorMessage(err);
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomFeeds(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.userId) return;

    loading.value = true;
    error.value = null;

    try {
      if (isOnline.value) {
        const response = await api.get('/api/v1/feeds/custom');

        const rawFeeds = Array.isArray(response.data) ? response.data : [];
        const feeds = rawFeeds.map((feed: Feed) => ({
          ...feed,
          is_custom: 1,
          user_id: authStore.userId,
          _synced: true,
          _deleted: false,
        }));

        // Update local database
        if (feeds.length > 0) {
          await db.feeds.bulkPut(feeds);
        }
      }

      // Load from local database
      customFeeds.value = await db.feeds
        .where({ user_id: authStore.userId, is_custom: 1 })
        .filter((f) => !f._deleted)
        .toArray();
    } catch (err) {
      // Fallback to local data
      customFeeds.value = await db.feeds
        .where({ user_id: authStore.userId })
        .filter((f) => f.is_custom && !f._deleted)
        .toArray();

      if (customFeeds.value.length === 0 && !isOnline.value) {
        // Only show error if offline and no cached data
        error.value = extractErrorMessage(err);
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchAllFeeds(): Promise<void> {
    await Promise.all([fetchMasterFeeds(), fetchCustomFeeds()]);
  }

  async function getFeed(id: string): Promise<Feed | null> {
    // Try local first
    const feed = await db.feeds.get(id);

    if (!feed && isOnline.value) {
      try {
        const response = await api.get(`/api/v1/feeds/${id}`);
        const serverFeed: Feed = { ...response.data, _synced: true, _deleted: false };
        await db.feeds.put(serverFeed);
        return serverFeed;
      } catch {
        return null;
      }
    }

    return feed ?? null;
  }

  async function createCustomFeed(input: FeedInput): Promise<Feed | null> {
    const authStore = useAuthStore();
    if (!authStore.userId) return null;

    loading.value = true;
    error.value = null;

    const newFeed: Feed = {
      id: uuidv4(),
      user_id: authStore.userId,
      ...input,
      is_custom: 1,
      country_code: authStore.userCountry,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _synced: false,
      _deleted: false,
    };

    try {
      // Save to local database immediately (optimistic)
      await db.feeds.put(newFeed);
      customFeeds.value.push(newFeed);

      if (isOnline.value) {
        // Sync with server
        const response = await api.post('/api/v1/feeds/custom', input);
        const serverFeed: Feed = {
          ...response.data,
          is_custom: 1,
          user_id: authStore.userId,
          country_code: authStore.userCountry,
          _synced: true,
          _deleted: false,
        };

        // Update with server response
        await db.feeds.delete(newFeed.id);
        await db.feeds.put(serverFeed);

        // Update local state
        const index = customFeeds.value.findIndex((f) => f.id === newFeed.id);
        if (index !== -1) {
          customFeeds.value[index] = serverFeed;
        }

        return serverFeed;
      } else {
        // Queue for later sync
        await queueCreate('feed', newFeed.id, input as unknown as Record<string, unknown>);
        return newFeed;
      }
    } catch (err) {
      error.value = extractErrorMessage(err);

      if (!isOnline.value) {
        await queueCreate('feed', newFeed.id, input as unknown as Record<string, unknown>);
        return newFeed;
      }

      // Remove optimistically added feed on error
      await db.feeds.delete(newFeed.id);
      customFeeds.value = customFeeds.value.filter((f) => f.id !== newFeed.id);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateCustomFeed(id: string, input: Partial<FeedInput>): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const existingFeed = await db.feeds.get(id);
      if (!existingFeed || !existingFeed.is_custom) {
        error.value = 'Feed not found or cannot be edited';
        return false;
      }

      const updatedData = {
        ...input,
        updated_at: new Date().toISOString(),
      };

      // Update locally immediately (optimistic)
      await db.feeds.update(id, { ...updatedData, _synced: false });

      // Update local state
      const index = customFeeds.value.findIndex((f) => f.id === id);
      if (index !== -1) {
        customFeeds.value[index] = { ...customFeeds.value[index], ...updatedData, _synced: false };
      }

      if (isOnline.value) {
        // Sync with server
        await api.put(`/api/v1/feeds/custom/${id}`, input);
        await db.feeds.update(id, { _synced: true });

        if (index !== -1) {
          customFeeds.value[index]._synced = true;
        }
      } else {
        // Queue for later sync
        await queueUpdate('feed', id, input as unknown as Record<string, unknown>);
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);

      if (!isOnline.value) {
        await queueUpdate('feed', id, input as unknown as Record<string, unknown>);
        return true;
      }

      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCustomFeed(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const existingFeed = await db.feeds.get(id);
      if (!existingFeed || !existingFeed.is_custom) {
        error.value = 'Feed not found or cannot be deleted';
        return false;
      }

      // Mark as deleted locally (optimistic)
      await db.feeds.update(id, { _deleted: true });
      customFeeds.value = customFeeds.value.filter((f) => f.id !== id);

      if (isOnline.value) {
        // Delete on server
        await api.delete(`/api/v1/feeds/custom/${id}`);
        await db.feeds.delete(id);
      } else {
        // Queue for later sync
        await queueDelete('feed', id);
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);

      if (!isOnline.value) {
        await queueDelete('feed', id);
        return true;
      }

      // Restore on error
      await db.feeds.update(id, { _deleted: false });
      await fetchCustomFeeds();
      return false;
    } finally {
      loading.value = false;
    }
  }

  function searchFeeds(query: string): Feed[] {
    const lowerQuery = query.toLowerCase();
    return allFeeds.value.filter(
      (feed) =>
        feed.name.toLowerCase().includes(lowerQuery) ||
        feed.category.toLowerCase().includes(lowerQuery)
    );
  }

  return {
    // State
    masterFeeds,
    customFeeds,
    loading,
    error,
    // Computed
    allFeeds,
    feedsByCategory,
    categories,
    // Actions
    fetchMasterFeeds,
    fetchCustomFeeds,
    fetchAllFeeds,
    getFeed,
    createCustomFeed,
    updateCustomFeed,
    deleteCustomFeed,
    searchFeeds,
  };
});

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
