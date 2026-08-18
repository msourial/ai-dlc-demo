import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, GitBranch } from 'lucide-react'

// A custom dropdown matching the dark UI theme, replacing the native <select>.
// Props:
//   repos      — array of { name, description, fullName } (fullName used as value)
//   value      — currently selected fullName
//   onChange   — (fullName) => void
export default function RepoDropdown({ repos, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef(null)
  const menuRef = useRef(null)

  const selected = repos.find(r => r.fullName === value) || repos[0]

  // Close on any outside click.
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Reset highlight to the active entry whenever the menu opens.
  useEffect(() => {
    if (open) {
      const idx = repos.findIndex(r => r.fullName === value)
      setHighlighted(idx >= 0 ? idx : 0)
    }
  }, [open, repos, value])

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (!open || !menuRef.current) return
    const el = menuRef.current.children[highlighted]
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  }, [highlighted, open])

  const select = (fullName) => {
    onChange(fullName)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted(h => (h + 1) % repos.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted(h => (h - 1 + repos.length) % repos.length)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (repos[highlighted]) select(repos[highlighted].fullName)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      default:
        break
    }
  }

  const triggerValue = selected ? selected.name : ''

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: open ? 'var(--bg-card-hover)' : 'var(--bg-input)',
          border: `1px solid ${open ? 'var(--accent-blue)' : 'var(--border)'}`,
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-sm)',
          padding: '7px 10px',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all var(--transition)',
          boxShadow: open ? '0 0 0 3px rgba(99,140,255,0.1)' : 'none',
        }}
      >
        <GitBranch size={13} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
        <span style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {triggerValue}
        </span>
        <ChevronDown size={13} style={{
          flexShrink: 0,
          color: 'var(--text-muted)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform var(--transition)',
        }} />
      </button>

      {open && (
        <ul
          ref={menuRef}
          role="listbox"
          aria-activedescendant={`repo-opt-${highlighted}`}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 200,
            margin: 0,
            padding: '4px',
            listStyle: 'none',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
            maxHeight: '240px',
            overflowY: 'auto',
          }}
        >
          {repos.map((repo, i) => {
            const isActive = repo.fullName === value
            const isHover = i === highlighted
            return (
              <li
                key={repo.fullName}
                id={`repo-opt-${i}`}
                role="option"
                aria-selected={isActive}
                onClick={() => select(repo.fullName)}
                onMouseEnter={() => setHighlighted(i)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: isActive
                    ? 'var(--accent-blue-dim)'
                    : isHover
                      ? 'var(--bg-card-hover)'
                      : 'transparent',
                  transition: 'background var(--transition)',
                }}
              >
                <span style={{
                  marginTop: '1px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: `1.5px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-strong)'}`,
                  background: isActive ? 'var(--accent-blue)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isActive && <Check size={10} color="#fff" strokeWidth={3} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {repo.name}
                  </span>
                  {repo.description && (
                    <span style={{
                      display: 'block',
                      marginTop: '2px',
                      fontSize: '10.5px',
                      lineHeight: 1.4,
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {repo.description}
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
