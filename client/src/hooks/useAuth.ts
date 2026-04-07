import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
const normalizedApiBaseUrl = configuredApiBaseUrl.replace(/\/$/, '')

const API = axios.create({
  baseURL: normalizedApiBaseUrl,
  withCredentials: true,
})

function resolveApiOrigin() {
  if (typeof window !== 'undefined') {
    return new URL(normalizedApiBaseUrl, window.location.origin).origin
  }

  if (/^https?:\/\//i.test(normalizedApiBaseUrl)) {
    return new URL(normalizedApiBaseUrl).origin
  }

  return 'http://localhost:3001'
}

const API_ORIGIN = resolveApiOrigin()

function buildPortfolioUrl(portfolioId?: string | null, cacheBust?: string | number | null) {
  if (!portfolioId) return ''

  const baseUrl = new URL(`/p/${portfolioId}`, API_ORIGIN).toString()
  if (cacheBust === undefined || cacheBust === null || cacheBust === '') {
    return baseUrl
  }
  return `${baseUrl}?v=${encodeURIComponent(String(cacheBust))}`
}

interface User {
  id: string
  name: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const res = await API.get('/auth/me')
      setUser(res.data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    const res = await API.post('/auth/login', { email, password })
    setUser(res.data.user)
    return res.data
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await API.post('/auth/register', { name, email, password })
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    await API.post('/auth/logout')
    setUser(null)
  }

  return { user, loading, login, register, logout, checkAuth }
}

export { API, API_ORIGIN, buildPortfolioUrl }
