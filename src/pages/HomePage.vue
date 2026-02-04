<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="refreshAll">
      <!-- Welcome Section -->
      <div class="welcome-section q-mb-lg">
        <div class="text-h5 q-mb-xs">Hello, {{ userName }}!</div>
        <div class="text-body2 text-grey-7">
          {{ greeting }}
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-6">
          <q-card flat bordered class="stat-card">
            <q-card-section>
              <div class="text-h4 text-primary">{{ cowCount }}</div>
              <div class="text-caption text-grey-7">Active Cows</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6">
          <q-card flat bordered class="stat-card">
            <q-card-section>
              <div class="text-h4 text-secondary">{{ todayMilk.toFixed(1) }}L</div>
              <div class="text-caption text-grey-7">Today's Milk</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="text-subtitle1 q-mb-sm">Quick Actions</div>
      <div class="row q-col-gutter-sm q-mb-lg">
        <div class="col-4">
          <q-btn
            color="primary"
            class="full-width action-btn"
            unelevated
            stack
            @click="router.push('/logs/new')"
          >
            <q-icon name="water_drop" size="24px" class="q-mb-xs" />
            <span class="text-caption">Log Milk</span>
          </q-btn>
        </div>
        <div class="col-4">
          <q-btn
            color="secondary"
            class="full-width action-btn"
            unelevated
            stack
            @click="router.push('/diet/new')"
          >
            <q-icon name="restaurant" size="24px" class="q-mb-xs" />
            <span class="text-caption">Get Diet</span>
          </q-btn>
        </div>
        <div class="col-4">
          <q-btn
            color="accent"
            class="full-width action-btn"
            unelevated
            stack
            @click="router.push('/cows/new')"
          >
            <q-icon name="add" size="24px" class="q-mb-xs" />
            <span class="text-caption">Add Cow</span>
          </q-btn>
        </div>
      </div>

      <!-- Today's Logs -->
      <div class="text-subtitle1 q-mb-sm">Today's Milk Logs</div>
      <template v-if="loadingLogs">
        <SkeletonList :count="3" />
      </template>
      <template v-else-if="todayLogs.length === 0">
        <q-card flat bordered class="q-mb-lg">
          <q-card-section class="text-center q-py-lg">
            <q-icon name="water_drop" size="40px" color="grey-4" />
            <div class="text-body2 text-grey-7 q-mt-sm">No logs today yet</div>
            <q-btn
              label="Log Now"
              color="primary"
              flat
              class="q-mt-sm"
              @click="router.push('/logs/new')"
            />
          </q-card-section>
        </q-card>
      </template>
      <template v-else>
        <q-list bordered separator class="rounded-borders q-mb-lg">
          <q-item v-for="log in todayLogs" :key="log.id" clickable v-ripple>
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                <q-icon name="pets" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ log.cow_name || 'Unknown Cow' }}</q-item-label>
              <q-item-label caption>
                <span v-if="log.morning_liters">Morning: {{ log.morning_liters }}L</span>
                <span v-if="log.evening_liters" class="q-ml-sm">Evening: {{ log.evening_liters }}L</span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6 text-primary">{{ log.total_liters }}L</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </template>

      <!-- Recent Diet Plans -->
      <div class="text-subtitle1 q-mb-sm">Recent Diets</div>
      <template v-if="loadingDiets">
        <SkeletonCard />
      </template>
      <template v-else-if="recentDiets.length === 0">
        <q-card flat bordered>
          <q-card-section class="text-center q-py-lg">
            <q-icon name="restaurant" size="40px" color="grey-4" />
            <div class="text-body2 text-grey-7 q-mt-sm">No diet plans yet</div>
            <q-btn
              label="Create Diet"
              color="primary"
              flat
              class="q-mt-sm"
              @click="router.push('/diet/new')"
            />
          </q-card-section>
        </q-card>
      </template>
      <template v-else>
        <q-card
          v-for="diet in recentDiets.slice(0, 3)"
          :key="diet.id"
          flat
          bordered
          class="q-mb-sm"
          clickable
          @click="router.push(`/diet/${diet.id}`)"
        >
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-subtitle2">{{ diet.cow_name || 'General Diet' }}</div>
                <div class="text-caption text-grey-7">
                  {{ formatDate(diet.created_at) }}
                </div>
              </div>
              <div class="col-auto">
                <q-chip
                  :color="diet.status === 'completed' ? 'positive' : 'warning'"
                  text-color="white"
                  size="sm"
                >
                  {{ diet.status }}
                </q-chip>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </PullToRefresh>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { useAuthStore } from 'src/stores/auth';
import { useCowsStore } from 'src/stores/cows';
import { useMilkLogsStore } from 'src/stores/milkLogs';
import { useDietsStore } from 'src/stores/diets';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';

const router = useRouter();
const authStore = useAuthStore();
const cowsStore = useCowsStore();
const milkLogsStore = useMilkLogsStore();
const dietsStore = useDietsStore();

const loadingLogs = ref(true);
const loadingDiets = ref(true);

const userName = computed(() => authStore.user?.name || 'Farmer');
const cowCount = computed(() => cowsStore.cowCount);
const todayLogs = computed(() => milkLogsStore.todayLogs);
const todayMilk = computed(() => milkLogsStore.todayTotal);
const recentDiets = computed(() => dietsStore.recentDiets);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning! Ready to check on your herd?';
  if (hour < 17) return 'Good afternoon! How is the milk production today?';
  return 'Good evening! Time to review the day.';
});

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

async function refreshAll(done: () => void) {
  await Promise.all([
    cowsStore.fetchCows(),
    milkLogsStore.fetchLogs(),
    dietsStore.fetchDiets(),
  ]);
  done();
}

onMounted(async () => {
  // Initialize auth store
  await authStore.initialize();

  // Fetch data
  await cowsStore.fetchCows();

  loadingLogs.value = true;
  await milkLogsStore.fetchLogs();
  loadingLogs.value = false;

  loadingDiets.value = true;
  await dietsStore.fetchDiets();
  loadingDiets.value = false;
});
</script>

<style lang="scss" scoped>
.welcome-section {
  padding-top: env(safe-area-inset-top);
}

.stat-card {
  border-radius: 12px;
  text-align: center;
}

.action-btn {
  height: 80px;
  border-radius: 12px;
}

.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
