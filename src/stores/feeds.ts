import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { api } from 'src/lib/api';
import { db, Feed } from 'src/lib/offline/db';
import { queueCreate, queueUpdate, queueDelete } from 'src/lib/offline/sync-manager';
import { useAuthStore } from './auth';
import { isOnline } from 'src/boot/pwa';
import { extractUserFriendlyError } from 'src/lib/error-messages';
import { applyFeedTranslations } from 'src/lib/feed-translations';
import { i18n } from 'src/boot/i18n';

export interface FeedInput {
  name: string;
  fd_type?: string;
  category: string;
  dm_percentage: number;
  cp_percentage: number;
  tdn_percentage: number;
  ca_percentage?: number;
  p_percentage?: number;
  ndf_percentage?: number;
  // Extended nutrients
  fd_ash?: number;
  fd_ee?: number;
  fd_st?: number;
  fd_adf?: number;
  fd_lg?: number;
  fd_ndin?: number;
  fd_adin?: number;
  fd_npn_cp?: number;
  // Metadata
  price_per_kg?: number;
  image_url?: string;
  season?: string;
}

/**
 * Estimate TDN from available EC2 nutrient data.
 * Uses the Weiss (1999) summative equation commonly applied to ruminant feeds:
 *   TDN ≈ NFC + CP + (EE × 2.25) + ndNDF - 7
 * where NFC = 100 - CP - NDF - EE - Ash, ndNDF ≈ NDF - (NDF × lignin/NDF-factor)
 * Simplified fallback: TDN ≈ 87.84 - (0.70 × ADF)  [Rohweder et al. 1978]
 */
function estimateTdn(raw: Record<string, unknown>): number | undefined {
  const adf = raw.fd_adf as number | undefined;
  const cp = raw.fd_cp as number | undefined;
  const ee = raw.fd_ee as number | undefined;
  const ndf = raw.fd_ndf as number | undefined;
  const ash = raw.fd_ash as number | undefined;
  const lg = raw.fd_lg as number | undefined;

  // Full Weiss equation if all components available
  if (cp != null && ee != null && ndf != null && ash != null && lg != null && ndf > 0) {
    const ndNDF = ndf * (1 - (lg / ndf) * 2.4); // digestible NDF estimate
    const nfc = Math.max(0, 100 - cp - ndf - ee - ash);
    const tdn = nfc * 0.98 + cp * 0.93 + (ee - 1) * 2.25 * 0.97 + ndNDF * 0.75 - 7;
    if (tdn > 0 && tdn <= 100) return Math.round(tdn * 10) / 10;
  }

  // Fallback: ADF-based regression
  if (adf != null && adf > 0) {
    const tdn = 87.84 - 0.70 * adf;
    if (tdn > 0 && tdn <= 100) return Math.round(tdn * 10) / 10;
  }

  return undefined;
}

/**
 * Normalize an EC2 feed API response into a PWA Feed object.
 * Maps fd_* fields to _percentage fields, preserves all extended nutrients.
 */
function normalizeEc2Feed(raw: Record<string, unknown>, countryCode?: string): Feed {
  const category = (raw.fd_category || raw.category || '') as string;
  return {
    // Identity
    id: (raw.feed_id || raw.id || '') as string,
    name: (raw.fd_name || raw.name || '') as string,
    fd_name: (raw.fd_name || '') as string,
    fd_type: (raw.fd_type || '') as string,
    fd_code: (raw.fd_code || '') as string,
    fd_category: category,
    category,
    // Primary nutrients — map EC2 fd_* → PWA _percentage
    dm_percentage: (raw.fd_dm ?? raw.dm_percentage ?? 0) as number,
    cp_percentage: (raw.fd_cp ?? raw.cp_percentage ?? 0) as number,
    tdn_percentage: (raw.tdn_percentage ?? estimateTdn(raw) ?? 0) as number,
    ndf_percentage: (raw.fd_ndf ?? raw.ndf_percentage) as number | undefined,
    ca_percentage: (raw.fd_ca ?? raw.ca_percentage) as number | undefined,
    p_percentage: (raw.fd_p ?? raw.p_percentage) as number | undefined,
    // Extended nutrients (pass-through)
    fd_ash: raw.fd_ash as number | undefined,
    fd_ee: raw.fd_ee as number | undefined,
    fd_st: raw.fd_st as number | undefined,
    fd_adf: raw.fd_adf as number | undefined,
    fd_lg: raw.fd_lg as number | undefined,
    fd_ndin: raw.fd_ndin as number | undefined,
    fd_adin: raw.fd_adin as number | undefined,
    fd_cf: raw.fd_cf as number | undefined,
    fd_nfe: raw.fd_nfe as number | undefined,
    fd_hemicellulose: raw.fd_hemicellulose as number | undefined,
    fd_cellulose: raw.fd_cellulose as number | undefined,
    fd_npn_cp: raw.fd_npn_cp as number | undefined,
    // Metadata
    season: (raw.fd_season || raw.season || '') as string,
    fd_country_id: raw.fd_country_id as string | undefined,
    fd_country_name: raw.fd_country_name as string | undefined,
    is_custom: (raw.is_custom ?? 0) as number,
    country_code: countryCode,
    created_at: (raw.created_at || new Date().toISOString()) as string,
    updated_at: (raw.updated_at || new Date().toISOString()) as string,
    _synced: true,
    _deleted: false,
  };
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

  // Cache TTL: refresh from API if cache is older than 1 hour
  const CACHE_TTL_MS = 60 * 60 * 1000;

  /** Load feeds from IndexedDB cache instantly (no network). */
  async function loadFromCache(): Promise<void> {
    const cached = await db.feeds
      .where('is_custom')
      .equals(0)
      .filter((f) => !f._deleted)
      .toArray();
    if (cached.length > 0) {
      masterFeeds.value = cached;
    }
  }

  /** Check if feed cache is stale (older than TTL). */
  async function isCacheStale(): Promise<boolean> {
    const ts = await db.getSetting('feeds_last_fetched');
    if (!ts) return true;
    return Date.now() - Number(ts) > CACHE_TTL_MS;
  }

  /**
   * Fetch master feeds from EC2.
   * EC2 endpoint: GET /feeds/?country_id={UUID}&limit=2000
   * Requires country_id UUID, not country_code.
   */
  async function fetchMasterFeeds(countryCode?: string): Promise<void> {
    const authStore = useAuthStore();
    const country = countryCode || authStore.userCountry;

    // 1. Load from IndexedDB cache first (instant)
    await loadFromCache();
    const hadCachedData = masterFeeds.value.length > 0;

    // 2. If we have cached data and it's fresh, skip network
    if (hadCachedData && !(await isCacheStale())) {
      return;
    }

    // 3. Fetch from API (show loading only if no cached data)
    if (!hadCachedData) {
      loading.value = true;
    }
    error.value = null;

    try {
      if (isOnline.value) {
        // Ensure countries loaded so we can resolve country_code → country_id UUID
        await authStore.ensureCountriesLoaded();

        // Find country_id UUID from country_code (alpha-2)
        const { toAlpha2 } = await import('src/services/api-adapter');
        const countryObj = authStore.countries.find(
          c => toAlpha2(c.country_code) === country
        );
        const countryId = countryObj?.id;

        const params: Record<string, unknown> = { limit: 2000 };
        if (countryId) {
          params.country_id = countryId;
        }

        const response = await api.get('/feeds/', { params });

        const rawFeeds = Array.isArray(response.data) ? response.data : [];
        const feeds = rawFeeds.map((raw: Record<string, unknown>) => normalizeEc2Feed(raw, country));

        // Update local database
        if (feeds.length > 0) {
          await db.feeds.bulkPut(feeds);
          await db.setSetting('feeds_last_fetched', Date.now());
        }
      }

      // Reload from local database
      masterFeeds.value = await db.feeds
        .where('is_custom')
        .equals(0)
        .filter((f) => !f._deleted)
        .toArray();
      applyFeedTranslations(masterFeeds.value, i18n.global.locale.value);
    } catch (err) {
      // Fallback to local data
      masterFeeds.value = await db.feeds
        .where('is_custom')
        .equals(0)
        .filter((f) => !f._deleted)
        .toArray();
      applyFeedTranslations(masterFeeds.value, i18n.global.locale.value);

      if (masterFeeds.value.length === 0) {
        error.value = extractUserFriendlyError(err);
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch custom feeds.
   * EC2 doesn't have a "list custom feeds" endpoint, so we rely on IndexedDB cache.
   * Custom feeds are synced individually via create/update operations.
   */
  async function fetchCustomFeeds(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.userId) return;

    // Load from IndexedDB cache only (EC2 has no bulk list endpoint for custom feeds)
    customFeeds.value = await db.feeds
      .where({ user_id: authStore.userId, is_custom: 1 })
      .filter((f) => !f._deleted)
      .toArray();
  }

  async function fetchAllFeeds(): Promise<void> {
    await Promise.all([fetchMasterFeeds(), fetchCustomFeeds()]);
  }

  async function getFeed(id: string): Promise<Feed | null> {
    // Try local first
    const feed = await db.feeds.get(id);

    if (!feed && isOnline.value) {
      try {
        // EC2: GET /feeds/{feed_id}
        const response = await api.get(`/feeds/${id}`);
        const serverFeed = normalizeEc2Feed(response.data);
        await db.feeds.put(serverFeed);
        return serverFeed;
      } catch {
        return null;
      }
    }

    return feed ?? null;
  }

  /**
   * Create a custom feed on EC2.
   * EC2 endpoint: POST /insert-custom-feed/
   * EC2 expects: {user_id, country_id, feed_insert: true, feed_details: {...}}
   */
  async function createCustomFeed(input: FeedInput): Promise<Feed | null> {
    const authStore = useAuthStore();
    if (!authStore.userId) {
      error.value = 'Not authenticated. Please log in again.';
      return null;
    }

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
        // Resolve country_id UUID
        const { toAlpha2 } = await import('src/services/api-adapter');
        const countryObj = authStore.countries.find(
          c => toAlpha2(c.country_code) === authStore.userCountry
        );

        // EC2 /insert-custom-feed/ expects InsertCustomFeedRequest
        const response = await api.post('/insert-custom-feed/', {
          user_id: authStore.userId,
          country_id: countryObj?.id || '',
          feed_insert: true,
          feed_details: {
            feed_name: input.name,
            feed_type: input.fd_type || 'Concentrate',
            feed_category: input.category,
            fd_dm: input.dm_percentage,
            fd_cp: input.cp_percentage,
            fd_ndf: input.ndf_percentage,
            fd_ca: input.ca_percentage,
            fd_p: input.p_percentage,
            fd_ash: input.fd_ash,
            fd_ee: input.fd_ee,
            fd_st: input.fd_st,
            fd_adf: input.fd_adf,
            fd_lg: input.fd_lg,
            fd_ndin: input.fd_ndin,
            fd_adin: input.fd_adin,
            fd_npn_cp: input.fd_npn_cp,
          },
        });

        const serverFeedDetails = response.data?.feed_details || response.data;
        const serverFeed = normalizeEc2Feed(
          { ...serverFeedDetails, is_custom: 1 },
          authStore.userCountry,
        );
        serverFeed.user_id = authStore.userId;
        // Preserve local ID if server didn't return one
        if (!serverFeed.id) serverFeed.id = newFeed.id;

        // Update with server response
        await db.feeds.delete(newFeed.id);
        await db.feeds.put(serverFeed);

        const index = customFeeds.value.findIndex((f) => f.id === newFeed.id);
        if (index !== -1) {
          customFeeds.value[index] = serverFeed;
        }

        return serverFeed;
      } else {
        await queueCreate('feed', newFeed.id, input as unknown as Record<string, unknown>);
        return newFeed;
      }
    } catch (err) {
      error.value = extractUserFriendlyError(err);

      if (!isOnline.value) {
        await queueCreate('feed', newFeed.id, input as unknown as Record<string, unknown>);
        return newFeed;
      }

      await db.feeds.delete(newFeed.id);
      customFeeds.value = customFeeds.value.filter((f) => f.id !== newFeed.id);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update a custom feed on EC2.
   * EC2 endpoint: POST /update-custom-feed/
   * EC2 expects: {user_id, country_id, feed_id, feed_insert: false, feed_details: {...}}
   */
  async function updateCustomFeed(id: string, input: Partial<FeedInput>): Promise<boolean> {
    const authStore = useAuthStore();
    loading.value = true;
    error.value = null;

    try {
      const existingFeed = await db.feeds.get(id);
      if (!existingFeed || existingFeed.is_custom !== 1) {
        error.value = 'Feed not found or cannot be edited';
        return false;
      }

      const updatedData = {
        ...input,
        updated_at: new Date().toISOString(),
      };

      // Update locally immediately (optimistic)
      await db.feeds.update(id, { ...updatedData, _synced: false });

      const index = customFeeds.value.findIndex((f) => f.id === id);
      if (index !== -1) {
        customFeeds.value[index] = { ...customFeeds.value[index], ...updatedData, _synced: false };
      }

      if (isOnline.value) {
        const { toAlpha2 } = await import('src/services/api-adapter');
        const countryObj = authStore.countries.find(
          c => toAlpha2(c.country_code) === authStore.userCountry
        );

        // EC2 /update-custom-feed/ expects UpdateCustomFeedRequest
        await api.post('/update-custom-feed/', {
          user_id: authStore.userId,
          country_id: countryObj?.id || '',
          feed_id: id,
          feed_insert: false,
          feed_details: {
            feed_name: input.name || existingFeed.name || existingFeed.fd_name,
            feed_type: input.fd_type || existingFeed.fd_type || 'Concentrate',
            feed_category: input.category || existingFeed.category || existingFeed.fd_category,
            fd_dm: input.dm_percentage ?? existingFeed.dm_percentage,
            fd_cp: input.cp_percentage ?? existingFeed.cp_percentage,
            fd_ndf: input.ndf_percentage ?? existingFeed.ndf_percentage,
            fd_ca: input.ca_percentage ?? existingFeed.ca_percentage,
            fd_p: input.p_percentage ?? existingFeed.p_percentage,
            fd_ash: input.fd_ash ?? existingFeed.fd_ash,
            fd_ee: input.fd_ee ?? existingFeed.fd_ee,
            fd_st: input.fd_st ?? existingFeed.fd_st,
            fd_adf: input.fd_adf ?? existingFeed.fd_adf,
            fd_lg: input.fd_lg ?? existingFeed.fd_lg,
            fd_ndin: input.fd_ndin ?? existingFeed.fd_ndin,
            fd_adin: input.fd_adin ?? existingFeed.fd_adin,
            fd_npn_cp: input.fd_npn_cp ?? existingFeed.fd_npn_cp,
          },
        });

        await db.feeds.update(id, { _synced: true });
        if (index !== -1) {
          customFeeds.value[index]._synced = true;
        }
      } else {
        await queueUpdate('feed', id, input as unknown as Record<string, unknown>);
      }

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);

      if (!isOnline.value) {
        await queueUpdate('feed', id, input as unknown as Record<string, unknown>);
        return true;
      }

      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a custom feed on EC2.
   * EC2 endpoint: DELETE /feeds/delete-feed/{feed_id}
   */
  async function deleteCustomFeed(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const existingFeed = await db.feeds.get(id);
      if (!existingFeed || existingFeed.is_custom !== 1) {
        error.value = 'Feed not found or cannot be deleted';
        return false;
      }

      // Mark as deleted locally (optimistic)
      await db.feeds.update(id, { _deleted: true });
      customFeeds.value = customFeeds.value.filter((f) => f.id !== id);

      if (isOnline.value) {
        await api.delete(`/feeds/delete-feed/${id}`);
        await db.feeds.delete(id);
      } else {
        await queueDelete('feed', id);
      }

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);

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
        (feed.fd_name && feed.fd_name.toLowerCase().includes(lowerQuery)) ||
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
