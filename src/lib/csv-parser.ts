/**
 * Simple CSV parser utility - no external dependencies.
 * Handles quoted values, commas within quotes, and trims whitespace.
 */

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Parse a single CSV line respecting quoted fields.
 * Handles commas inside quotes and escaped quotes ("").
 */
function parseLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ""
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      current += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (char === ',') {
        fields.push(current.trim());
        current = '';
        i++;
        continue;
      }
      current += char;
      i++;
    }
  }

  // Push the last field
  fields.push(current.trim());

  return fields;
}

/**
 * Parse CSV text into an array of objects.
 * The first row is treated as headers (keys for each row object).
 */
export function parseCSV(text: string): ParsedCSV {
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into lines, filter out empty trailing lines
  const lines = normalized.split('\n').filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = j < values.length ? values[j] : '';
    }

    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Read a File object as text.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ---------- Validation Helpers ----------

/**
 * Check if a value is non-empty after trimming.
 */
export function isNonEmpty(value: string | undefined | null): boolean {
  return !!value && value.trim().length > 0;
}

/**
 * Validate a phone number: digits, optional leading +, optional spaces/dashes.
 * Returns true if valid or empty (phone is optional).
 */
export function isValidPhone(value: string | undefined | null): boolean {
  if (!value || value.trim().length === 0) return true; // optional field
  const cleaned = value.trim();
  return /^\+?[\d\s\-()]{6,15}$/.test(cleaned);
}

/**
 * Common column name aliases that map to FarmerInput fields.
 * Used for auto-detection of CSV column mapping.
 */
export const FARMER_FIELD_ALIASES: Record<string, string[]> = {
  name: ['name', 'farmer name', 'farmer_name', 'fullname', 'full name', 'full_name'],
  phone: ['phone', 'phone number', 'phone_number', 'mobile', 'mobile number', 'mobile_number', 'contact', 'telephone'],
  village: ['village', 'village name', 'village_name', 'town', 'locality'],
  district: ['district', 'district name', 'district_name', 'county'],
  state: ['state', 'state name', 'state_name', 'province', 'region'],
};

/**
 * Auto-detect mapping of CSV headers to farmer fields.
 * Returns a Record where key is the CSV header and value is the farmer field name (or empty string if no match).
 */
export function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedFields = new Set<string>();

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();
    let matched = false;

    for (const [field, aliases] of Object.entries(FARMER_FIELD_ALIASES)) {
      if (usedFields.has(field)) continue;

      if (aliases.includes(normalizedHeader)) {
        mapping[header] = field;
        usedFields.add(field);
        matched = true;
        break;
      }
    }

    if (!matched) {
      mapping[header] = '';
    }
  }

  return mapping;
}

/**
 * Generate a CSV template string for farmer import.
 */
export function generateTemplate(): string {
  const headers = ['Name', 'Phone', 'Village', 'District', 'State'];
  const sampleRows = [
    ['Ravi Kumar', '+91 9876543210', 'Ambala', 'Ambala', 'Haryana'],
    ['Sunita Devi', '+91 9123456789', 'Karnal', 'Karnal', 'Haryana'],
  ];

  const lines = [headers.join(',')];
  for (const row of sampleRows) {
    lines.push(row.map((val) => (val.includes(',') ? `"${val}"` : val)).join(','));
  }

  return lines.join('\n');
}

/**
 * Trigger download of a string as a file.
 */
export function downloadAsFile(content: string, filename: string, mimeType = 'text/csv'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
