export function isConfiguredExternalLink(value) {
  return typeof value === 'string'
    && /^https?:\/\//i.test(value)
    && !/(?:example\.com|your-username|your-profile)/i.test(value)
}

export function isConfiguredEmail(value) {
  return typeof value === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    && !/(?:example\.com|your-email)/i.test(value)
}
