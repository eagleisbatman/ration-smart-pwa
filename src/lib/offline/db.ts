import Dexie, { Table } from 'dexie';

// Types for database entities
export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  country_code: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Cow {
  id: string;
  user_id: string;
  name: string;
  breed: string;
  weight_kg: number;
  milk_yield_liters: number;
  milk_fat_percentage: number;
  lactation_stage: string;
  age_months?: number;
  body_condition_score?: number;
  is_pregnant: boolean;
  pregnancy_month?: number;
  activity_level: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Local sync status
  _synced: boolean;
  _deleted: boolean;
}

export interface Feed {
  id: string;
  name: string;
  category: string;
  dm_percentage: number;
  cp_percentage: number;
  tdn_percentage: number;
  ca_percentage?: number;
  p_percentage?: number;
  ndf_percentage?: number;
  price_per_kg?: number;
  is_custom: boolean;
  user_id?: string;
  country_code?: string;
  created_at: string;
  updated_at: string;
  // Local sync status
  _synced: boolean;
  _deleted: boolean;
}

export interface Diet {
  id: string;
  user_id: string;
  cow_id?: string;
  cow_name?: string;
  optimization_goal: string;
  status: string;
  input_data: Record<string, unknown>;
  result_data?: Record<string, unknown>;
  total_cost?: number;
  dm_intake?: number;
  created_at: string;
  updated_at: string;
  // Local sync status
  _synced: boolean;
}

export interface MilkLog {
  id: string;
  user_id: string;
  cow_id: string;
  cow_name?: string;
  log_date: string;
  morning_liters?: number;
  evening_liters?: number;
  total_liters: number;
  fat_percentage?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Local sync status
  _synced: boolean;
  _deleted: boolean;
}

export interface Report {
  id: string;
  user_id: string;
  report_type: string;
  title: string;
  parameters: Record<string, unknown>;
  file_url?: string;
  status: string;
  created_at: string;
  // Local cache
  _cached_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type?: string; // university, ngo, cooperative, government
  country_id?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Local sync status
  _synced: boolean;
}

export interface FarmerProfile {
  id: string;
  organization_id?: string;
  managed_by_user_id: string;
  name: string;
  phone?: string;
  village?: string;
  district?: string;
  state?: string;
  country_id?: string;
  total_cattle: number;
  land_acres?: number;
  farming_type?: string; // dairy, mixed, crop
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Local sync status
  _synced: boolean;
  _deleted: boolean;
}

export interface YieldData {
  id: string;
  farmer_profile_id: string;
  cow_profile_id?: string;
  diet_recommendation_id?: string;
  collection_date: string;
  milk_yield_liters?: number;
  fat_percentage?: number;
  snf_percentage?: number;
  collected_by_user_id: string;
  notes?: string;
  created_at: string;
  // Local sync status
  _synced: boolean;
  _deleted: boolean;
}

export interface SyncQueueItem {
  id?: number;
  entity_type: 'cow' | 'feed' | 'diet' | 'milk_log' | 'farmer' | 'yield';
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  created_at: string;
  retry_count: number;
  last_error?: string;
}

export interface AppSettings {
  key: string;
  value: unknown;
}

// Dexie database class
class RationSmartDB extends Dexie {
  users!: Table<User, string>;
  cows!: Table<Cow, string>;
  feeds!: Table<Feed, string>;
  diets!: Table<Diet, string>;
  milkLogs!: Table<MilkLog, string>;
  reports!: Table<Report, string>;
  organizations!: Table<Organization, string>;
  farmerProfiles!: Table<FarmerProfile, string>;
  yieldData!: Table<YieldData, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('RationSmartDB');

    this.version(1).stores({
      users: 'id, email, phone, country_code',
      cows: 'id, user_id, name, breed, is_active, _synced, _deleted, [user_id+is_active]',
      feeds: 'id, user_id, name, category, is_custom, country_code, _synced, _deleted, [user_id+is_custom]',
      diets: 'id, user_id, cow_id, status, created_at, _synced, [user_id+status]',
      milkLogs: 'id, user_id, cow_id, log_date, _synced, _deleted, [user_id+cow_id], [user_id+log_date]',
      reports: 'id, user_id, report_type, status, created_at, _cached_at',
      syncQueue: '++id, entity_type, entity_id, operation, created_at, retry_count',
      settings: 'key',
    });

    // Version 2: Add organization, farmer profiles, and yield data tables
    this.version(2).stores({
      users: 'id, email, phone, country_code, organization_id',
      cows: 'id, user_id, farmer_profile_id, name, breed, is_active, _synced, _deleted, [user_id+is_active], [farmer_profile_id+is_active]',
      feeds: 'id, user_id, name, category, is_custom, country_code, _synced, _deleted, [user_id+is_custom]',
      diets: 'id, user_id, cow_id, status, created_at, _synced, [user_id+status]',
      milkLogs: 'id, user_id, cow_id, log_date, _synced, _deleted, [user_id+cow_id], [user_id+log_date]',
      reports: 'id, user_id, report_type, status, created_at, _cached_at',
      organizations: 'id, name, type, country_id, is_active, _synced',
      farmerProfiles: 'id, organization_id, managed_by_user_id, name, village, district, is_active, _synced, _deleted, [managed_by_user_id+is_active], [organization_id+is_active]',
      yieldData: 'id, farmer_profile_id, cow_profile_id, collection_date, collected_by_user_id, _synced, _deleted, [farmer_profile_id+collection_date]',
      syncQueue: '++id, entity_type, entity_id, operation, created_at, retry_count',
      settings: 'key',
    });
  }

  // Clear all user-specific data (for logout)
  async clearUserData(): Promise<void> {
    await Promise.all([
      this.cows.clear(),
      this.feeds.where('is_custom').equals(1).delete(),
      this.diets.clear(),
      this.milkLogs.clear(),
      this.reports.clear(),
      this.organizations.clear(),
      this.farmerProfiles.clear(),
      this.yieldData.clear(),
      this.syncQueue.clear(),
      this.users.clear(),
    ]);
  }

  // Get pending sync items
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return this.syncQueue.orderBy('created_at').toArray();
  }

  // Add item to sync queue
  async addToSyncQueue(
    entityType: SyncQueueItem['entity_type'],
    entityId: string,
    operation: SyncQueueItem['operation'],
    data: Record<string, unknown>
  ): Promise<number> {
    return this.syncQueue.add({
      entity_type: entityType,
      entity_id: entityId,
      operation,
      data,
      created_at: new Date().toISOString(),
      retry_count: 0,
    });
  }

  // Remove item from sync queue
  async removeFromSyncQueue(id: number): Promise<void> {
    await this.syncQueue.delete(id);
  }

  // Update sync queue item retry count
  async updateSyncQueueRetry(id: number, error: string): Promise<void> {
    await this.syncQueue.update(id, {
      retry_count: (await this.syncQueue.get(id))?.retry_count ?? 0 + 1,
      last_error: error,
    });
  }

  // Get/set app settings
  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const setting = await this.settings.get(key);
    return setting ? (setting.value as T) : defaultValue;
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    await this.settings.put({ key, value });
  }
}

// Export database instance
export const db = new RationSmartDB();
