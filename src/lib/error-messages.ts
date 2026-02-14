import { i18n } from 'src/boot/i18n';

/** Map raw backend error details to user-friendly i18n keys */
const ERROR_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /phone.*already/i, key: 'errors.phoneAlreadyRegistered' },
  { pattern: /email.*already|unique.*email/i, key: 'errors.emailAlreadyRegistered' },
  { pattern: /not found/i, key: 'errors.notFound' },
  { pattern: /permission|forbidden/i, key: 'errors.forbidden' },
  { pattern: /unauthorized/i, key: 'errors.unauthorized' },
  { pattern: /integrity|constraint|duplicate/i, key: 'errors.duplicateEntry' },
  { pattern: /validation|invalid/i, key: 'errors.validation' },
  { pattern: /timeout|timed out/i, key: 'errors.timeout' },
  { pattern: /network|ERR_NETWORK|ECONNREFUSED/i, key: 'errors.network' },
];

/**
 * Extract a user-friendly error message from an API error.
 * Matches raw backend `detail` strings against known patterns
 * and returns i18n-translated messages. Falls back to a generic message.
 */
export function extractUserFriendlyError(err: unknown): string {
  const t = i18n.global.t;

  // Extract raw message from error
  let raw = '';
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { detail?: string; message?: string } } }).response;
    raw = resp?.data?.detail || resp?.data?.message || '';
  }
  if (!raw && err instanceof Error) {
    raw = err.message;
  }

  // Try to match against known patterns
  if (raw) {
    for (const { pattern, key } of ERROR_PATTERNS) {
      if (pattern.test(raw)) {
        return t(key);
      }
    }
  }

  // Fallback
  return t('errors.generic');
}
