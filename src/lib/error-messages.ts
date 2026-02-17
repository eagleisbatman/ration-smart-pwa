import { i18n } from 'src/boot/i18n';

/** HTTP status codes where the backend provides user-friendly messages directly */
const PASSTHROUGH_STATUS_CODES = new Set([401, 400]);

/** Map raw backend error details to user-friendly i18n keys */
const ERROR_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /phone.*already/i, key: 'errors.phoneAlreadyRegistered' },
  { pattern: /email.*already|unique.*email/i, key: 'errors.emailAlreadyRegistered' },
  { pattern: /permission|forbidden/i, key: 'errors.forbidden' },
  { pattern: /integrity|constraint|duplicate/i, key: 'errors.duplicateEntry' },
  { pattern: /timeout|timed out/i, key: 'errors.timeout' },
  { pattern: /network|ERR_NETWORK|ECONNREFUSED/i, key: 'errors.network' },
];

/**
 * Extract a user-friendly error message from an API error.
 *
 * For auth errors (401) and validation errors (400), the backend already
 * returns user-friendly messages (e.g. "PIN is incorrect. Please try again.")
 * so we pass them through directly instead of replacing with generic text.
 *
 * For other errors, matches raw backend `detail` strings against known patterns
 * and returns i18n-translated messages. Falls back to a generic message.
 */
export function extractUserFriendlyError(err: unknown): string {
  const t = i18n.global.t;

  // Extract raw message and status code from error
  let raw = '';
  let statusCode = 0;
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { status?: number; data?: { detail?: string; message?: string } } }).response;
    raw = resp?.data?.detail || resp?.data?.message || '';
    statusCode = resp?.status || 0;
  }
  if (!raw && err instanceof Error) {
    raw = err.message;
  }

  if (!raw) {
    return t('errors.generic');
  }

  // For auth/validation errors, pass through the backend message directly
  // (backend provides specific messages like "PIN is incorrect" or "User not found")
  if (PASSTHROUGH_STATUS_CODES.has(statusCode)) {
    return raw.replace(/\n/g, ' ');
  }

  // Try to match against known patterns
  for (const { pattern, key } of ERROR_PATTERNS) {
    if (pattern.test(raw)) {
      return t(key);
    }
  }

  // Fallback
  return t('errors.generic');
}
