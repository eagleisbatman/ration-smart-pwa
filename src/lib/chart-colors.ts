/**
 * Chart color constants — mirrors the SCSS tokens in quasar.variables.scss.
 * Use these in Vue <template> or <script> where SCSS variables are unavailable
 * (SVG attributes, computed style objects, dynamic JS rendering).
 *
 * If you change a value here, update the matching $chart-* variable in
 * src/css/quasar.variables.scss to keep them in sync.
 */
export const CHART = {
  primary: '#1976D2',
  primaryFill: 'rgba(25, 118, 210, 0.08)',
  success: '#4CAF50',
  warning: '#FF9800',
  grid: '#E0E0E0',
  axisText: '#666666',
  axisTextLight: '#9E9E9E',
  baseline: '#CCCCCC',
  gridLight: '#EEEEEE',
} as const;
