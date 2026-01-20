import axios, { AxiosError, AxiosRequestConfig } from 'axios'

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const RAW_PREFIX = import.meta.env.VITE_API_PREFIX
const DEFAULT_PREFIX = 'v1'
const normalizedBase = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL : `${RAW_BASE_URL}/`
const normalizedPrefix = RAW_PREFIX ? RAW_PREFIX.replace(/^\/|\/$/g, '') : DEFAULT_PREFIX
const baseHasPrefix =
  normalizedPrefix.length > 0 && normalizedBase.endsWith(`${normalizedPrefix}/`)
const API_BASE_URL = `${normalizedBase}${baseHasPrefix ? '' : `${normalizedPrefix}/`}`

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = refreshHttp
      .post('auth/token/refresh/', { refresh: refreshToken })
      .then((res) => {
        const newAccess = res.data?.access
        if (newAccess) {
          localStorage.setItem('access_token', newAccess)
          return newAccess
        }
        return null
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${newToken}`
        return http(original)
      }
      logout()
    }
    return Promise.reject(error)
  },
)

export async function login(username: string, password: string): Promise<void> {
  const res = await http.post('auth/token/', { username, password })
  localStorage.setItem('access_token', res.data.access)
  localStorage.setItem('refresh_token', res.data.refresh)
}

export function logout(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
