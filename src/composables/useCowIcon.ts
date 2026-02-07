/**
 * Composable for using the custom cow icon throughout the app.
 *
 * Usage:
 * 1. With q-icon: <q-icon :name="cowIcon" />
 * 2. With icon prop: <q-btn :icon="cowIcon" />
 * 3. In navigation items: { icon: cowIcon, ... }
 *
 * The cow icon is a simple, recognizable cow head silhouette
 * designed to work at small sizes (24x24) in Material Design context.
 */
export function useCowIcon() {
  // Path to cow icon in public folder - works with Quasar's img: prefix
  const cowIcon = 'img:/icons/cow.svg';

  return {
    cowIcon,
  };
}

// Export the icon path directly for simple imports
export const COW_ICON = 'img:/icons/cow.svg';
