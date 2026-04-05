import { useState, useEffect, useRef } from 'react'
import { API } from './useAuth'

interface AIFeedback {
  issues: Array<{ type: string; message: string }>
  rewrite: string
  wordCount: number
}

export function useAIFeedback(fieldName: string, profession: string) {
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState<AIFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (text.length < 10) {
      setFeedback(null)
      return
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await API.post('/ai/analyze-field', { text, fieldName, profession })
        setFeedback(res.data)
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }, 800)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [text, fieldName, profession])

  return { text, setText, feedback, loading }
}
