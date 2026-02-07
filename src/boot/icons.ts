import { boot } from 'quasar/wrappers';
import CowIcon from 'src/components/icons/CowIcon.vue';

/**
 * Custom icon boot file for RationSmart.
 *
 * Registers custom icons to be used throughout the app.
 *
 * Usage:
 * - For q-icon: <q-icon :name="COW_ICON" /> or <q-icon name="img:/icons/cow.svg" />
 * - For icon props: <q-btn :icon="COW_ICON" />
 * - Import: import { COW_ICON } from 'src/boot/icons'
 * - Component: <CowIcon :size="24" />
 */

// Icon paths for use with Quasar's icon system
// Format: img:/path/to/icon.svg (must be in public folder)
export const COW_ICON = 'img:/icons/cow.svg';

export default boot(({ app }) => {
  // Register CowIcon component globally for direct use
  app.component('CowIcon', CowIcon);
});
