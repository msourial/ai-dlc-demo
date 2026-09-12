import React from 'react'
import { AlertCircle } from 'lucide-react'

export function Card({ children, style = {}, className = '' }) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '24px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Button({ children, onClick, disabled, variant = 'primary', size = 'md', style = {} }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all var(--transition)',
    fontSize: size === 'sm' ? '12px' : '13px',
    padding: size === 'sm' ? '6px 12px' : '10px 18px',
  }
  const variants = {
    primary: {
      background: 'var(--accent-blue)',
      color: '#fff',
      boxShadow: '0 4px 14px rgba(96,165,250,0.28)',
    },
    secondary: {
      background: 'var(--bg-input)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    },
    danger: {
      background: 'var(--accent-red)',
      color: '#fff',
      boxShadow: '0 4px 14px rgba(251,113,133,0.25)',
    },
  }
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (!disabled) {
          if (variant === 'primary') {
            e.currentTarget.style.background = '#86b7ff'
            e.currentTarget.style.boxShadow = '0 4px 18px rgba(96,165,250,0.4)'
          }
          if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--accent-blue)'
          if (variant === 'ghost') e.currentTarget.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          if (variant === 'primary') {
            e.currentTarget.style.background = 'var(--accent-blue)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(96,165,250,0.28)'
          }
          if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--border)'
          if (variant === 'ghost') e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      {children}
    </button>
  )
}

export function Badge({ children, color = 'blue' }) {
  const colors = {
    blue: { bg: 'var(--accent-blue-dim)', text: 'var(--accent-blue)', border: 'rgba(96,165,250,0.28)' },
    green: { bg: 'var(--accent-green-dim)', text: 'var(--accent-green)', border: 'rgba(52,211,153,0.28)' },
    amber: { bg: 'var(--accent-amber-dim)', text: 'var(--accent-amber)', border: 'rgba(251,191,36,0.28)' },
    red: { bg: 'var(--accent-red-dim)', text: 'var(--accent-red)', border: 'rgba(251,113,133,0.28)' },
    purple: { bg: 'var(--accent-purple-dim)', text: 'var(--accent-purple)', border: 'rgba(167,139,250,0.3)' },
    teal: { bg: 'var(--accent-teal-dim)', text: 'var(--accent-teal)', border: 'rgba(45,212,191,0.28)' },
    gray: { bg: 'rgba(138,155,196,0.1)', text: 'var(--text-secondary)', border: 'rgba(138,155,196,0.22)' },
  }
  const c = colors[color] || colors.blue
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 8px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 500,
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size,
      height: size,
      border: `2px solid var(--border)`,
      borderTopColor: 'var(--accent-blue)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}

export function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
      <span className="thinking-dot" />
      <span className="thinking-dot" />
      <span className="thinking-dot" />
    </span>
  )
}

export function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-blue)' }}>{icon}</span>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.015em' }}>{title}</h2>
      </div>
      {subtitle && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginLeft: '30px' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function OutputBox({ content, style = {} }) {
  if (!content) return null
  return (
    <div
      className="animate-in"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent-blue)',
        borderRadius: 'var(--radius-sm)',
        padding: '16px 20px',
        fontSize: '13px',
        lineHeight: 1.7,
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap',
        fontFamily: 'var(--font-sans)',
        marginTop: '16px',
        maxHeight: '500px',
        overflowY: 'auto',
        ...style,
      }}
    >
      {content}
    </div>
  )
}

export function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '12px',
      padding: '10px 14px',
      background: 'var(--accent-red-dim)',
      border: '1px solid rgba(251,113,133,0.3)',
      borderRadius: 'var(--radius-sm)',
      fontSize: '12px',
      color: 'var(--accent-red)',
    }}>
      <AlertCircle size={14} /> {message}
    </div>
  )
}
