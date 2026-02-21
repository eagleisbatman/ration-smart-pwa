/**
 * Global back-navigation override.
 *
 * Pages with in-page drill-down (e.g. analytics breadcrumb navigation)
 * set a handler here. MainLayout's goBack() calls it first; if it
 * returns true the default router.back() is skipped.
 */
import { ref } from 'vue';

export const backOverride = ref<(() => boolean) | null>(null);
