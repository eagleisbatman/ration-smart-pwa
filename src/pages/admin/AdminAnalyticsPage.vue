<template>
  <q-page padding>
    <!-- Breadcrumb navigation for drill-down -->
    <div v-if="breadcrumbs.length > 1" class="row items-center q-mb-md q-gutter-xs">
      <template v-for="(bc, i) in breadcrumbs" :key="i">
        <q-btn
          v-if="i < breadcrumbs.length - 1"
          :label="bc.label"
          flat
          dense
          no-caps
          color="primary"
          @click="navigateTo(bc)"
        />
        <span v-if="i < breadcrumbs.length - 1" class="text-grey-6">/</span>
        <span v-if="i === breadcrumbs.length - 1" class="text-subtitle2 text-weight-medium">{{ bc.label }}</span>
      </template>
    </div>

    <!-- Summary cards -->
    <div v-if="store.summary" class="row q-col-gutter-sm q-mb-lg">
      <div v-for="stat in summaryCards" :key="stat.label" class="col-6 col-sm-3">
        <q-card flat bordered>
          <q-card-section class="text-center q-py-sm">
            <div class="text-h5 text-primary">{{ stat.value }}</div>
            <div class="text-caption text-grey-7">{{ stat.label }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="32px" />
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="text-center text-negative q-pa-xl">
      {{ store.error }}
    </div>

    <!-- Super Admin: Country list -->
    <template v-else-if="view === 'global'">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('admin.perCountryBreakdown') }}</div>
      <q-list separator>
        <q-item
          v-for="c in store.countryBreakdowns"
          :key="c.country_id"
          clickable
          @click="drillIntoCountry(c.country_id, c.country_name)"
        >
          <q-item-section>
            <q-item-label>{{ c.country_name }}</q-item-label>
            <q-item-label caption>
              {{ c.org_count }} {{ $t('admin.orgCount') }} ·
              {{ c.user_count }} {{ $t('admin.userCount') }} ·
              {{ c.farmer_count }} {{ $t('admin.farmerCount') }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
      <div v-if="store.countryBreakdowns.length === 0" class="text-center text-grey-6 q-pa-lg">
        {{ $t('admin.noData') }}
      </div>
    </template>

    <!-- Country Admin / drill-down: Org list -->
    <template v-else-if="view === 'country'">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('admin.perOrgBreakdown') }}</div>
      <q-list separator>
        <q-item
          v-for="o in store.orgBreakdowns"
          :key="o.organization_id"
          clickable
          @click="drillIntoOrg(o.organization_id, o.organization_name)"
        >
          <q-item-section>
            <q-item-label>{{ o.organization_name }}</q-item-label>
            <q-item-label caption>
              {{ o.ew_count }} {{ $t('admin.ewCount') }} ·
              {{ o.farmer_count }} {{ $t('admin.farmerCount') }} ·
              {{ o.cow_count }} {{ $t('admin.cowCount') }} ·
              {{ o.diet_count }} {{ $t('admin.dietCount') }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
      <div v-if="store.orgBreakdowns.length === 0" class="text-center text-grey-6 q-pa-lg">
        {{ $t('admin.noData') }}
      </div>
    </template>

    <!-- Org Admin / drill-down: EW activity table -->
    <template v-else-if="view === 'org'">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('admin.perEwBreakdown') }}</div>
      <q-markup-table flat bordered separator="horizontal" class="q-mb-md">
        <thead>
          <tr>
            <th class="text-left">{{ $t('admin.name') }}</th>
            <th class="text-right">{{ $t('admin.farmerCount') }}</th>
            <th class="text-right">{{ $t('admin.cowCount') }}</th>
            <th class="text-right">{{ $t('admin.dietCount') }}</th>
            <th class="text-right">{{ $t('admin.milkLogCount') }}</th>
            <th class="text-left">{{ $t('admin.lastActive') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ew in store.ewActivities" :key="ew.user_id">
            <td>
              <div>{{ ew.name }}</div>
              <div class="text-caption text-grey-6">{{ ew.email || ew.phone_number || '' }}</div>
            </td>
            <td class="text-right">{{ ew.farmer_count }}</td>
            <td class="text-right">{{ ew.cow_count }}</td>
            <td class="text-right">{{ ew.diet_count }}</td>
            <td class="text-right">{{ ew.milk_log_count }}</td>
            <td>{{ formatDate(ew.last_active) }}</td>
          </tr>
        </tbody>
      </q-markup-table>
      <div v-if="store.ewActivities.length === 0" class="text-center text-grey-6 q-pa-lg">
        {{ $t('admin.noData') }}
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminAnalyticsStore } from 'src/stores/admin-analytics';
import { useAuthStore } from 'src/stores/auth';
import { useI18n } from 'vue-i18n';

const store = useAdminAnalyticsStore();
const authStore = useAuthStore();
const { t } = useI18n();

type ViewLevel = 'global' | 'country' | 'org';

interface Breadcrumb {
  label: string;
  level: ViewLevel;
  id?: string;
}

const view = ref<ViewLevel>('org');
const breadcrumbs = ref<Breadcrumb[]>([]);

const summaryCards = computed(() => {
  const s = store.summary;
  if (!s) return [];
  const cards: { label: string; value: number }[] = [];

  if (s.total_countries !== undefined) cards.push({ label: t('admin.countryName'), value: s.total_countries });
  if (s.total_orgs !== undefined) cards.push({ label: t('admin.totalOrgs'), value: s.total_orgs });
  if (s.total_ews !== undefined) cards.push({ label: t('admin.totalEws'), value: s.total_ews });
  if (s.total_users !== undefined) cards.push({ label: t('admin.totalUsers'), value: s.total_users });
  cards.push({ label: t('admin.totalFarmers'), value: s.total_farmers });
  cards.push({ label: t('admin.totalCows'), value: s.total_cows });
  if (s.total_diets !== undefined) cards.push({ label: t('admin.totalDiets'), value: s.total_diets });
  if (s.total_milk_logs !== undefined) cards.push({ label: t('admin.totalMilkLogs'), value: s.total_milk_logs });

  return cards;
});

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

async function drillIntoCountry(countryId: string, countryName: string) {
  view.value = 'country';
  breadcrumbs.value.push({ label: countryName, level: 'country', id: countryId });
  await store.fetchCountryAnalytics(countryId);
}

async function drillIntoOrg(orgId: string, orgName: string) {
  view.value = 'org';
  breadcrumbs.value.push({ label: orgName, level: 'org', id: orgId });
  await store.fetchOrgAnalytics(orgId);
}

async function navigateTo(bc: Breadcrumb) {
  // Remove everything after this breadcrumb
  const idx = breadcrumbs.value.indexOf(bc);
  breadcrumbs.value = breadcrumbs.value.slice(0, idx + 1);
  view.value = bc.level;

  if (bc.level === 'global') {
    await store.fetchGlobalAnalytics();
  } else if (bc.level === 'country' && bc.id) {
    await store.fetchCountryAnalytics(bc.id);
  } else if (bc.level === 'org' && bc.id) {
    await store.fetchOrgAnalytics(bc.id);
  }
}

onMounted(async () => {
  if (authStore.isSuperAdmin) {
    view.value = 'global';
    breadcrumbs.value = [{ label: t('admin.perCountryBreakdown'), level: 'global' }];
    await store.fetchGlobalAnalytics();
  } else if (authStore.isCountryAdmin) {
    // Country admin sees their country's orgs
    const countryId = authStore.user?.country_id;
    if (countryId) {
      view.value = 'country';
      breadcrumbs.value = [{ label: t('admin.perOrgBreakdown'), level: 'country', id: countryId }];
      await store.fetchCountryAnalytics(countryId);
    }
  } else if (authStore.isOrgAdmin) {
    // Org admin sees their org's EW activity
    const orgId = authStore.user?.organization_id;
    if (orgId) {
      view.value = 'org';
      breadcrumbs.value = [{ label: t('admin.perEwBreakdown'), level: 'org', id: orgId }];
      await store.fetchOrgAnalytics(orgId);
    }
  }
});
</script>
