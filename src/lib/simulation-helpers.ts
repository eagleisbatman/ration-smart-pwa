import type { SimulationListItem } from 'src/stores/simulation';

/**
 * Generate a display label for a simulation history item.
 * Uses the custom report_name if set, otherwise falls back to type-based label.
 */
export function reportLabel(
  item: SimulationListItem,
  t: (key: string) => string,
): string {
  if (item.report_name) return item.report_name;
  return item.report_type === 'rec'
    ? t('simulation.recommendationReport')
    : t('simulation.evaluationReport');
}

/**
 * Check whether a simulation result is infeasible/failed.
 */
export function isInfeasible(item: SimulationListItem): boolean {
  const s = (item.solution_status || '').toLowerCase();
  return s.includes('infeasible') || s.includes('failed');
}
