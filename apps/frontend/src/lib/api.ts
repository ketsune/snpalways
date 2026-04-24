// Prefix for all backend calls. Leave VITE_API_BASE_URL unset locally to go through the Vite dev proxy.
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalized}`
}

// Drop-in replacement for fetch() that automatically attaches the service key header.
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const serviceKey = import.meta.env.SECRET_SERVICE_KEY ?? ''
  const headers = new Headers(init?.headers)
  if (serviceKey) headers.set('x-service-key', serviceKey)
  return fetch(apiUrl(path), { ...init, headers })
}
