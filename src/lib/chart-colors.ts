/**
 * Chart color constants — light and dark palettes.
 *
 * Use `useChartColors()` in components for reactive dark-mode-aware colors.
 * The static `CHART` export is kept for backward compatibility (light mode only).
 */
import { computed } from 'vue';
import { useQuasar } from 'quasar';

const LIGHT = {
  primary: '#18181B',
  primaryFill: 'rgba(24, 24, 27, 0.08)',
  success: '#4CAF50',
  warning: '#FF9800',
  grid: '#E0E0E0',
  axisText: '#666666',
  axisTextLight: '#9E9E9E',
  baseline: '#CCCCCC',
  gridLight: '#EEEEEE',
} as const;

const DARK = {
  primary: '#E4E4E7',
  primaryFill: 'rgba(228, 228, 231, 0.12)',
  success: '#66BB6A',
  warning: '#FFA726',
  grid: 'rgba(255, 255, 255, 0.1)',
  axisText: 'rgba(255, 255, 255, 0.5)',
  axisTextLight: 'rgba(255, 255, 255, 0.35)',
  baseline: 'rgba(255, 255, 255, 0.15)',
  gridLight: 'rgba(255, 255, 255, 0.06)',
} as const;

/** Reactive chart colors — automatically switches with Quasar dark mode */
export function useChartColors() {
  const $q = useQuasar();
  return computed(() => ($q.dark.isActive ? DARK : LIGHT));
}

/** Static export (light mode only) — prefer useChartColors() in components */
export const CHART = LIGHT;
