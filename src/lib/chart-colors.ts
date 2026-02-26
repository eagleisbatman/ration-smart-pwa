/**
 * Chart color constants — theme-aware light and dark palettes.
 *
 * Use `useChartColors()` in components for reactive dark-mode + theme-aware colors.
 * The static `CHART` export is kept for backward compatibility (current theme, light mode).
 */
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { getCurrentTheme, currentThemeId } from './themes';

/** Reactive chart colors — automatically switches with Quasar dark mode and theme */
export function useChartColors() {
  const $q = useQuasar();
  return computed(() => {
    // Access currentThemeId.value to make this reactive to theme changes
    void currentThemeId.value;
    const theme = getCurrentTheme();
    return $q.dark.isActive ? theme.chart.dark : theme.chart.light;
  });
}

/** Static export (current theme, light mode) — prefer useChartColors() in components */
export const CHART = getCurrentTheme().chart.light;
