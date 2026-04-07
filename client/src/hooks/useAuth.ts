import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
})

const API_ORIGIN =
  typeof API.defaults.baseURL === 'string'
    ? API.defaults.baseURL.replace(/\/api\/?$/, '')
    : 'http://localhost:3001'

function buildPortfolioUrl(portfolioId?: string | null, cacheBust?: string | number | null) {
  if (!portfolioId) return ''
  const baseUrl = `${API_ORIGIN}/p/${portfolioId}`
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
