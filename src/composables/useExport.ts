import { useI18n } from 'vue-i18n';

export interface DietExportData {
  cowName: string;
  date: string;
  goal: string;
  feeds: Array<{ name: string; amount: number; cost: string }>;
  totalCost: string;
  dmIntake: number;
  status: string;
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
      text += `  - ${feed.name}: ${feed.amount}kg (${feed.cost})\n`;
    }
    text += `\n${t('export.totalCost')}: ${diet.totalCost}`;
    text += `\n${t('export.dmIntake')}: ${diet.dmIntake}kg`;
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
   * Print diet by opening a new window with formatted HTML and triggering the print dialog.
   * The user can also "Save as PDF" from the browser print dialog.
   */
  function printDiet(diet: DietExportData): void {
    const html = generatePrintHTML(diet);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
      font-weight: 600;
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
      <div class="meta-label">${t('export.dmIntake')}</div>
      <div class="meta-value">${diet.dmIntake} kg</div>
    </div>
  </div>

  <h2>${t('export.feeds')}</h2>
  <table>
    <thead>
      <tr>
        <th>${t('export.feeds')}</th>
        <th>${diet.feeds.length > 0 ? 'Amount' : ''}</th>
        <th>${diet.feeds.length > 0 ? 'Cost' : ''}</th>
      </tr>
    </thead>
    <tbody>
      ${feedRows}
    </tbody>
  </table>

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
