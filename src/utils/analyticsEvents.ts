export const ANALYTICS_UPDATED_EVENT = 'pantrypal:analytics-updated'

export function dispatchAnalyticsUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ANALYTICS_UPDATED_EVENT))
}
