import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useCurrency } from './useCurrency';

interface FeedItem {
  feed_name?: string;
  name?: string;
  quantity_as_fed?: number;
  quantity?: number;
  price_per_kg?: number;
  cost?: number;
}

interface ReportData {
  title: string;
  simulationName?: string;
  totalCost?: number;
  dmIntake?: number;
  milkProduction?: number;
  feeds: FeedItem[];
  warnings?: string[];
  recommendations?: string[];
  reportId?: string;
  simulationId?: string;
}

function toNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Composable for sharing and printing simulation reports.
 * Uses Web Share API (mobile) with clipboard fallback (desktop),
 * and window.print() for PDF generation.
 */
export function useReportShare() {
  const { t } = useI18n();
  const $q = useQuasar();
  const { formatCurrency } = useCurrency();

  function buildTextSummary(data: ReportData): string {
    const lines: string[] = [];

    lines.push(`📋 ${data.title}`);
    if (data.simulationName) lines.push(`  ${data.simulationName}`);
    lines.push('');

    // Summary stats
    if (data.totalCost != null) {
      lines.push(`💰 ${t('simulation.recommendation.dailyCost')}: ${formatCurrency(data.totalCost)}`);
    }
    if (data.dmIntake != null) {
      lines.push(`📊 ${t('simulation.recommendation.dmIntake')}: ${data.dmIntake.toFixed(1)} ${t('common.units.kg')}`);
    }
    if (data.milkProduction != null) {
      lines.push(`🥛 ${t('simulation.recommendation.milkProduction')}: ${data.milkProduction.toFixed(1)} ${t('common.units.liters')}`);
    }

    // Feed breakdown
    if (data.feeds.length > 0) {
      lines.push('');
      lines.push(`── ${t('simulation.recommendation.feedBreakdown')} ──`);
      for (const feed of data.feeds) {
        const name = feed.feed_name || feed.name || '–';
        const qty = toNum(feed.quantity_as_fed ?? feed.quantity);
        const cost = feed.cost != null
          ? toNum(feed.cost)
          : qty * toNum(feed.price_per_kg);
        lines.push(`  • ${name}: ${qty.toFixed(2)} kg — ${formatCurrency(cost)}`);
      }
    }

    // Warnings
    if (data.warnings && data.warnings.length > 0) {
      lines.push('');
      lines.push(`⚠️ ${t('simulation.recommendation.warnings')}:`);
      for (const w of data.warnings) {
        lines.push(`  • ${w}`);
      }
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      lines.push('');
      lines.push(`💡 ${t('simulation.recommendation.recommendations')}:`);
      for (const r of data.recommendations) {
        lines.push(`  • ${r}`);
      }
    }

    lines.push('');
    lines.push('— RationSmart');

    return lines.join('\n');
  }

  async function shareReport(data: ReportData): Promise<void> {
    const text = buildTextSummary(data);

    // Try Web Share API (available on mobile browsers)
    if (navigator.share) {
      try {
        await navigator.share({ title: data.title, text });
        return;
      } catch (err) {
        // User cancelled or share failed — fall through to clipboard
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      $q.notify({
        type: 'positive',
        message: t('simulation.report.copiedToClipboard'),
        icon: 'content_copy',
        timeout: 2000,
      });
    } catch {
      $q.notify({
        type: 'negative',
        message: t('errors.generic'),
        timeout: 2000,
      });
    }
  }

  function printReport(): void {
    window.print();
  }

  return { shareReport, printReport, buildTextSummary };
}
