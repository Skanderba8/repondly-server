/**
 * Pure utility functions for the system health monitor.
 * These are extracted for testability (property-based tests).
 */

/**
 * Classifies an HTTP status code as online or offline.
 * Returns { online: true } for 2xx codes, { online: false } otherwise.
 */
export function classifyHttpStatus(statusCode: number): { online: boolean } {
  return { online: statusCode >= 200 && statusCode <= 299 }
}

/**
 * Returns a color based on a resource usage percentage.
 * green  : pct < 70
 * yellow : 70 <= pct < 90
 * red    : pct >= 90
 */
export function getMetricColor(pct: number): 'green' | 'yellow' | 'red' {
  if (pct >= 90) return 'red'
  if (pct >= 70) return 'yellow'
  return 'green'
}

/**
 * Returns a color based on the number of days remaining before SSL expiry.
 * green  : days > 30
 * yellow : 7 < days <= 30
 * red    : days <= 7
 */
export function sslColor(days: number): 'green' | 'yellow' | 'red' {
  if (days <= 7) return 'red'
  if (days <= 30) return 'yellow'
  return 'green'
}
