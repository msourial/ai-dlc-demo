import React, { useState } from 'react'
import { Key, CheckCircle, AlertTriangle, X, ShieldAlert, Loader } from 'lucide-react'
import { getGitHubToken, setGitHubToken } from '../services/githubService'

export default function TokenModal({ isOpen, onClose }) {
  const [tokenInput, setTokenInput] = useState(getGitHubToken())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  if (!isOpen) return null

  const handleSave = () => {
    setGitHubToken(tokenInput)
    onClose()
  }

  const handleTest = async () => {
    const tokenToTest = tokenInput.trim()
    if (!tokenToTest) {
      setTestResult({ error: 'Token is empty.' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenToTest}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })
      if (res.ok) {
        const user = await res.json()
        setTestResult({ success: true, login: user.login })
        setGitHubToken(tokenToTest)
      } else {
        const err = await res.json()
        setTestResult({ error: err.message || `HTTP ${res.status}` })
      }
    } catch (err) {
      setTestResult({ error: err.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '480px',
        padding: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Key size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              GitHub Personal Access Token
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Required to push issues to GitHub repositories
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
            GitHub PAT (repo scope)
          </label>
          <input
            type="password"
            value={tokenInput}
            onChange={e => { setTokenInput(e.target.value); setTestResult(null) }}
            placeholder="ghp_... or github_pat_..."
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
            }}
          />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
            Generate a token on <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>GitHub Settings → Personal Access Tokens</a> with <code style={{ background: 'rgba(96,165,250,0.18)', padding: '1px 4px', borderRadius: '3px' }}>repo</code> scope.
          </p>
        </div>

        {testResult?.success && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--accent-green-dim)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}>
            <CheckCircle size={16} />
            <span>Valid token! Authenticated as <strong>@{testResult.login}</strong></span>
          </div>
        )}

        {testResult?.error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(251,113,133,0.1)',
            border: '1px solid rgba(251,113,133,0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}>
            <ShieldAlert size={16} />
            <span>Authentication Failed: {testResult.error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleTest}
            disabled={testing || !tokenInput.trim()}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 500,
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {testing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={14} />}
            {testing ? 'Testing…' : 'Test Token'}
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'var(--accent-blue)',
              border: 'none',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Save Token
          </button>
        </div>
      </div>
    </div>
  )
}
