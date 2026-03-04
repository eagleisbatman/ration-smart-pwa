/**
 * Composable for using the custom cow icon throughout the app.
 *
 * Usage:
 * 1. With q-icon: <q-icon :name="cowIcon" />
 * 2. With icon prop: <q-btn :icon="cowIcon" />
 * 3. In navigation items: { icon: cowIcon, ... }
 */
export function useCowIcon() {
  const cowIcon = 'img:/icons/cow.svg';
  return { cowIcon };
}

export const COW_ICON = 'img:/icons/cow.svg';
