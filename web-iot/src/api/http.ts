const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) throw new Error(`GET ${path} failed`)
  return response.json() as Promise<T>
}

export function wsUrl() {
  const fromEnv = import.meta.env.VITE_WS_URL
  if (fromEnv) return fromEnv
  return API_BASE.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws'
}
