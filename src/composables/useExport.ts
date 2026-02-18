import { useI18n } from 'vue-i18n';

/**
 * Print HTML content using a hidden iframe with fallback to file download.
 * Works on iOS Safari, Android Chrome, and desktop browsers.
 * The user can "Save as PDF" from the browser print dialog.
 */
export function printHTML(html: string, fallbackFilename: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;
  const doc = iframe.contentDocument ?? iframeWindow?.document;

  if (!doc || !iframeWindow) {
    downloadAsFile(html, fallbackFilename);
    try { document.body.removeChild(iframe); } catch { /* already removed */ }
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Give the browser time to render styles before triggering print
  setTimeout(() => {
    try {
      iframeWindow.focus();
      iframeWindow.print();
    } catch {
      downloadAsFile(html, fallbackFilename);
    }
    // Clean up iframe after print dialog closes
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch { /* noop */ }
    }, 1000);
  }, 300);
}

/**
 * Download HTML string as a file (fallback when print is unavailable).
 */
function downloadAsFile(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export interface NutrientExport {
  label: string;
  supplied: string;
  requirement: string;
  unit: string;
}

export interface DietExportData {
  cowName: string;
  date: string;
  goal: string;
  feeds: Array<{ name: string; amount: number; cost: string }>;
  totalCost: string;
  dmIntake: number;
  status: string;
  nutrients?: NutrientExport[];
}

export function useExport() {
  const { t } = useI18n();

  /**
   * Format diet data as plain text summary suitable for sharing
   */
  function formatDietText(diet: DietExportData): string {
    let text = `${t('export.dietPlan')}: ${diet.cowName}\n`;
    text += `${diet.date}\n`;
    text += `${t('export.goal')}: ${diet.goal}\n\n`;
    text += `${t('export.feeds')}:\n`;
    for (const feed of diet.feeds) {
      text += `  - ${feed.name}: ${feed.amount} kg/day (${feed.cost})\n`;
    }
    text += `\n${t('export.totalCost')}: ${diet.totalCost}/day`;
    text += `\nDry Matter Intake: ${diet.dmIntake} kg/day`;
    if (diet.nutrients && diet.nutrients.length > 0) {
      text += `\n\n${t('diet.nutrientBalance')}:`;
      for (const n of diet.nutrients) {
        text += `\n  ${n.label}: ${n.supplied} / ${n.requirement} ${n.unit}`;
      }
    }
    text += `\n\n${t('export.generatedBy')}`;
    return text;
  }

  /**
   * Share content using the Web Share API (works on mobile for WhatsApp, email, etc.)
   * Falls back to clipboard copy if Web Share API is not available.
   */
  async function shareContent(title: string, text: string): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return true;
      } catch (e) {
        // AbortError means user cancelled the share dialog -- not a real error
        if ((e as Error).name !== 'AbortError') {
          console.error('Share failed:', e);
        }
        return false;
      }
    }
    // Fallback: copy to clipboard
    return copyToClipboard(text);
  }

  /**
   * Share via WhatsApp directly using the wa.me deep link
   */
  function shareViaWhatsApp(text: string): void {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  /**
   * Copy text to clipboard with fallback for older browsers
   */
  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for older browsers using deprecated execCommand
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Print diet by rendering HTML in a hidden iframe and triggering the print dialog.
   * Falls back to downloading the HTML file if printing is unavailable (e.g. iOS PWA).
   */
  function printDiet(diet: DietExportData): void {
    const html = generatePrintHTML(diet);
    printHTML(html, `diet-${diet.cowName}-${diet.date}.html`);
  }

  /**
   * Generate a clean, printable HTML document for a diet plan.
   * Uses inline styles so no external CSS is needed.
   */
  function generatePrintHTML(diet: DietExportData): string {
    const feedRows = diet.feeds
      .map(
        (feed, i) => `
      <tr style="${i % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${feed.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${feed.amount} kg</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${feed.cost}</td>
      </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t('export.dietPlan')} - ${diet.cowName}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #333;
      max-width: 700px;
      margin: 0 auto;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 3px solid #1976d2;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      color: #1976d2;
      margin: 0 0 4px 0;
      font-size: 22px;
    }
    .header .app-name {
      color: #666;
      font-size: 13px;
      margin: 0;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .meta-item {
      background: #f5f5f5;
      padding: 10px 16px;
      border-radius: 6px;
      flex: 1;
      min-width: 140px;
    }
    .meta-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-value {
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }
    h2 {
      font-size: 16px;
      color: #444;
      margin: 24px 0 12px 0;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      background-color: #1976d2;
      color: white;
      padding: 10px 12px;
      text-align: left;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:not(:first-child) {
      text-align: right;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${t('export.dietPlan')}: ${diet.cowName}</h1>
    <p class="app-name">RationSmart</p>
  </div>

  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">${t('export.goal')}</div>
      <div class="meta-value">${diet.goal}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">${t('export.totalCost')}</div>
      <div class="meta-value">${diet.totalCost}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Dry Matter Intake</div>
      <div class="meta-value">${diet.dmIntake} kg/day</div>
    </div>
  </div>

  <h2>${t('export.feeds')}</h2>
  <table>
    <thead>
      <tr>
        <th>${t('export.feeds')}</th>
        <th>${diet.feeds.length > 0 ? t('export.amount') : ''}</th>
        <th>${diet.feeds.length > 0 ? t('export.cost') : ''}</th>
      </tr>
    </thead>
    <tbody>
      ${feedRows}
    </tbody>
  </table>

  ${diet.nutrients && diet.nutrients.length > 0 ? `
  <h2>${t('diet.nutrientBalance')}</h2>
  <table>
    <thead>
      <tr>
        <th>Nutrient</th>
        <th>Supplied</th>
        <th>Required</th>
        <th>Unit</th>
      </tr>
    </thead>
    <tbody>
      ${diet.nutrients.map((n, i) => `
      <tr style="${i % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${n.label}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${n.supplied}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${n.requirement}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${n.unit}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    <p>${diet.date}</p>
    <p>${t('export.generatedBy')}</p>
  </div>
</body>
</html>`;
  }

  return {
    formatDietText,
    shareContent,
    shareViaWhatsApp,
    copyToClipboard,
    printDiet,
  };
}
