const DEFAULT_NEXT = '/studio';

/**
 * Only same-site relative paths are allowed. This blocks protocol-relative
 * values like `//evil.com` and backslash tricks used for open redirects.
 */
export const safeNextPath = (value: string | null | undefined): string => {
  if (!value) return DEFAULT_NEXT;
  if (!value.startsWith('/')) return DEFAULT_NEXT;
  if (value.startsWith('//') || value.startsWith('/\\')) return DEFAULT_NEXT;
  if (value.includes('\\')) return DEFAULT_NEXT;
  return value;
};

export const withNext = (path: string, next: string): string => {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}next=${encodeURIComponent(next)}`;
};
