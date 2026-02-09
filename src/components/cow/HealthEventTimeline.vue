<template>
  <div>
    <!-- Section Header -->
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">{{ $t('health.title') }}</div>
      <q-badge
        v-if="events.length > 0"
        color="primary"
        class="q-ml-sm"
        :label="events.length"
      />
      <q-space />
      <q-btn
        flat
        dense
        size="sm"
        icon="add"
        color="primary"
        :label="$t('health.addEvent')"
        @click="showAddDialog = true"
      />
    </div>

    <!-- Upcoming Due Dates -->
    <q-card
      v-if="upcomingEvents.length > 0"
      flat
      bordered
      class="q-mb-md bg-orange-1"
    >
      <q-card-section class="q-py-sm">
        <div class="text-caption text-orange-9 text-weight-medium q-mb-xs">
          <q-icon name="schedule" size="14px" class="q-mr-xs" />
          {{ $t('health.upcoming') }}
        </div>
        <div
          v-for="event in upcomingEvents"
          :key="event.id"
          class="text-body2 q-py-xs"
        >
          <span class="text-weight-medium">{{ event.title }}</span>
          <span class="text-grey-7"> &mdash; {{ formatDate(event.next_due_date!) }}</span>
        </div>
      </q-card-section>
    </q-card>

    <!-- Empty State -->
    <q-card v-if="events.length === 0 && !loading" flat bordered class="text-center q-pa-lg">
      <q-icon name="medical_services" size="48px" color="grey-5" />
      <div class="text-body1 text-grey-7 q-mt-sm">{{ $t('health.noEvents') }}</div>
      <div class="text-caption text-grey-5">{{ $t('health.noEventsHint') }}</div>
      <q-btn
        class="q-mt-md"
        color="primary"
        unelevated
        :label="$t('health.addEvent')"
        icon="add"
        @click="showAddDialog = true"
      />
    </q-card>

    <!-- Loading State -->
    <div v-if="loading" class="q-pa-md text-center">
      <q-spinner-dots size="32px" color="primary" />
    </div>

    <!-- Timeline -->
    <q-timeline v-if="events.length > 0" color="primary" layout="dense">
      <q-timeline-entry
        v-for="event in events"
        :key="event.id"
        :icon="getEventIcon(event.event_type)"
        :color="getEventColor(event.event_type)"
      >
        <template v-slot:subtitle>
          {{ formatDate(event.event_date) }}
        </template>
        <template v-slot:title>
          <div class="row items-center no-wrap">
            <span>{{ event.title }}</span>
            <q-chip
              size="xs"
              :color="getEventColor(event.event_type)"
              text-color="white"
              class="q-ml-sm"
              dense
            >
              {{ getEventTypeLabel(event.event_type) }}
            </q-chip>
          </div>
        </template>

        <div v-if="event.description" class="text-body2 text-grey-7 q-mt-xs">
          {{ event.description }}
        </div>

        <div class="row q-gutter-sm q-mt-xs" v-if="event.veterinarian || event.cost">
          <q-chip
            v-if="event.veterinarian"
            size="sm"
            icon="person"
            color="grey-3"
            text-color="grey-8"
            dense
          >
            {{ event.veterinarian }}
          </q-chip>
          <q-chip
            v-if="event.cost != null && event.cost > 0"
            size="sm"
            icon="payments"
            color="grey-3"
            text-color="grey-8"
            dense
          >
            {{ formatCurrency(event.cost) }}
          </q-chip>
        </div>

        <div v-if="event.next_due_date" class="text-caption text-orange-8 q-mt-xs">
          <q-icon name="schedule" size="12px" class="q-mr-xs" />
          {{ $t('health.nextDueDate') }}: {{ formatDate(event.next_due_date) }}
        </div>

        <!-- Edit / Delete actions -->
        <div class="q-mt-xs">
          <q-btn
            flat
            dense
            size="sm"
            icon="edit"
            color="grey-7"
            @click="onEdit(event)"
          />
          <q-btn
            flat
            dense
            size="sm"
            icon="delete"
            color="grey-7"
            @click="onDelete(event)"
          />
        </div>
      </q-timeline-entry>
    </q-timeline>

    <!-- Health Event Dialog -->
    <HealthEventDialog
      v-model="showAddDialog"
      :cow-id="cowId"
      :edit-event="editingEvent"
      @saved="loadEvents"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { format, parseISO, isFuture } from 'date-fns';
import { db, HealthEvent } from 'src/lib/offline/db';
import { api } from 'src/boot/axios';
import { isOnline } from 'src/boot/pwa';
import { queueDelete } from 'src/lib/offline/sync-manager';
import { useCurrency } from 'src/composables/useCurrency';
import HealthEventDialog from './HealthEventDialog.vue';

const props = defineProps<{
  cowId: string;
}>();

const { t } = useI18n();
const $q = useQuasar();
const { formatCurrency } = useCurrency();

const events = ref<HealthEvent[]>([]);
const loading = ref(false);
const showAddDialog = ref(false);
const editingEvent = ref<HealthEvent | null>(null);

const upcomingEvents = computed(() => {
  return events.value.filter(
    (e) => e.next_due_date && isFuture(parseISO(e.next_due_date))
  );
});

defineExpose({
  eventCount: computed(() => events.value.length),
});

function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    vaccination: 'vaccines',
    treatment: 'medication',
    illness: 'sick',
    deworming: 'bug_report',
    checkup: 'stethoscope',
    other: 'event_note',
  };
  return icons[type] || 'event_note';
}

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    vaccination: 'green',
    treatment: 'blue',
    illness: 'red',
    deworming: 'orange',
    checkup: 'purple',
    other: 'grey',
  };
  return colors[type] || 'grey';
}

function getEventTypeLabel(type: string): string {
  const key = `health.types.${type}`;
  return t(key);
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function onEdit(event: HealthEvent) {
  editingEvent.value = event;
  showAddDialog.value = true;
}

function onDelete(event: HealthEvent) {
  $q.dialog({
    title: t('health.deleteEvent'),
    message: t('health.deleteConfirm'),
    cancel: { flat: true, label: t('common.cancel') },
    ok: { color: 'negative', label: t('common.delete') },
  }).onOk(async () => {
    try {
      if (event.id) {
        // Mark as deleted locally
        await db.healthEvents.update(event.id, { _deleted: true });

        if (isOnline.value) {
          // Soft-delete on server
          try {
            await api.delete(`/api/v1/health-events/${event.id}`);
            await db.healthEvents.delete(event.id);
          } catch (err) {
            console.warn('[HealthEventTimeline] Server delete failed, queued for sync:', err);
            await queueDelete('health_event', event.id);
          }
        } else {
          await queueDelete('health_event', event.id);
        }
      }
      $q.notify({
        type: 'positive',
        message: t('health.eventDeleted'),
        icon: 'check_circle',
      });
      await loadEvents();
    } catch (err) {
      console.error('[HealthEventTimeline] Failed to delete event:', err);
      $q.notify({
        type: 'negative',
        message: t('errors.generic'),
      });
    }
  });
}

async function loadEvents() {
  loading.value = true;
  editingEvent.value = null;
  try {
    // Fetch from backend when online and cache locally
    if (isOnline.value) {
      try {
        const response = await api.get(`/api/v1/health-events/cow/${props.cowId}`);
        const serverEvents = (Array.isArray(response.data) ? response.data : []) as HealthEvent[];

        // Cache in IndexedDB (backend uses cow_profile_id, frontend uses cow_id)
        for (const evt of serverEvents) {
          const mapped = evt as HealthEvent & { cow_profile_id?: string };
          await db.healthEvents.put({
            ...mapped,
            cow_id: mapped.cow_id || mapped.cow_profile_id || props.cowId,
            _synced: true,
            _deleted: false,
          });
        }
      } catch (err) {
        console.warn('[HealthEventTimeline] Failed to fetch from server, using local cache:', err);
      }
    }

    // Load from local database
    events.value = await db.healthEvents
      .where('cow_id')
      .equals(props.cowId)
      .filter((e) => !e._deleted)
      .reverse()
      .sortBy('event_date');

    // Sort descending by event_date
    events.value.sort((a, b) => {
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    });
  } catch (err) {
    console.error('[HealthEventTimeline] Failed to load events:', err);
    events.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadEvents();
});
</script>
