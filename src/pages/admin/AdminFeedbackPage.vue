<template>
  <q-page padding>
    <!-- Stats Card -->
    <q-card v-if="stats" flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('admin.feedback.overview') }}</div>
        <div class="row q-col-gutter-md">
          <div class="col-6 col-sm-3 text-center">
            <div class="text-h5 text-weight-bold text-primary">{{ stats.total_count ?? 0 }}</div>
            <div class="text-caption text-grey-6">{{ $t('admin.feedback.totalResponses') }}</div>
          </div>
          <div class="col-6 col-sm-3 text-center">
            <div class="text-h5 text-weight-bold text-amber-8">{{ avgRating }}</div>
            <div class="text-caption text-grey-6">{{ $t('admin.feedback.avgRating') }}</div>
          </div>
          <div v-for="star in 5" :key="star" class="col text-center" style="min-width: 50px">
            <div class="text-body2 text-weight-medium">{{ ratingDist(star) }}</div>
            <q-rating :model-value="star" :max="5" readonly size="12px" color="amber" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Loading -->
    <template v-if="adminStore.loading && feedbackList.length === 0">
      <q-skeleton v-for="i in 4" :key="i" height="80px" class="q-mb-sm" />
    </template>

    <!-- Feedback List -->
    <q-card v-else-if="feedbackList.length > 0" flat bordered>
      <q-list separator>
        <q-item v-for="(fb, idx) in feedbackList" :key="idx">
          <q-item-section>
            <q-item-label class="row items-center q-gutter-xs">
              <span class="text-weight-medium">{{ fb.user_name || fb.name || 'Anonymous' }}</span>
              <q-badge v-if="fb.feedback_type || fb.type" :label="String(fb.feedback_type || fb.type)" color="grey-6" />
            </q-item-label>
            <q-item-label v-if="fb.rating" caption>
              <q-rating :model-value="Number(fb.rating)" :max="5" readonly size="14px" color="amber" />
            </q-item-label>
            <q-item-label v-if="fb.feedback_text || fb.text" class="text-body2 q-mt-xs">
              {{ fb.feedback_text || fb.text }}
            </q-item-label>
            <q-item-label caption class="text-grey-5 q-mt-xs">
              {{ formatDate(String(fb.created_at || '')) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Empty -->
    <div v-else class="text-center q-pa-lg text-grey-5">
      {{ $t('admin.feedback.noFeedback') }}
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from 'src/stores/admin';

const adminStore = useAdminStore();
const feedbackList = ref<Record<string, unknown>[]>([]);
const stats = ref<Record<string, unknown> | null>(null);

const avgRating = computed(() => {
  const avg = Number(stats.value?.average_rating || stats.value?.avg_rating || 0);
  return avg > 0 ? avg.toFixed(1) : '–';
});

function ratingDist(star: number): number {
  const dist = stats.value?.rating_distribution as Record<string, number> | undefined;
  if (!dist) return 0;
  return dist[String(star)] || 0;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

onMounted(async () => {
  const [fbResult, statsResult] = await Promise.all([
    adminStore.fetchFeedback(100),
    adminStore.fetchFeedbackStats(),
  ]);
  feedbackList.value = fbResult;
  stats.value = statsResult;
});
</script>
