import { useState } from 'react'

const OPENROUTER_API_KEY =
  import.meta.env.VITE_OPENROUTER_API_KEY
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'openrouter/free'

export function useClaudeAPI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const call = async (systemPrompt, userMessage) => {
    setLoading(true)
    setError(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'AI-DLC Command Center',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.1,
          max_tokens: 2000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
      })

      clearTimeout(timeout)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `API ${res.status}`)
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new Error('Empty response')
      return content
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out — try again')
      } else {
        setError(err.message)
      }
      return null
    } finally {
      setLoading(false)
    }
  }

  return { call, loading, error }
}
