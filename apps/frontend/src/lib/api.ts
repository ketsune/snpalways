// Prefix for all backend calls. Leave VITE_API_BASE_URL unset locally to go through the Vite dev proxy.
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalized}`
}
