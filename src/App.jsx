import React, { useState, useEffect } from 'react'
import SprintPlanner from './components/SprintPlanner'
import RiskSurfacer from './components/RiskSurfacer'
import ExecBriefing from './components/ExecBriefing'
import DependencyTracker from './components/DependencyTracker'
import MaturityScorer from './components/MaturityScorer'
import RepoDropdown from './components/RepoDropdown'

import { LayoutDashboard, AlertTriangle, Presentation, Link2, Activity, Hexagon, RefreshCw } from 'lucide-react'

// Source-of-truth list of tracked repos. `fullName` is the GitHub `owner/repo`
// value used for API calls; `name` is the short label shown in the dropdown.
const REPOSITORIES = [
  { name: 'GenoSync', fullName: 'msourial/GenoSync' },
  { name: 'Skyfall', fullName: 'msourial/Skyfall' },
]

const gh = (url) =>
  fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  }).then((r) => (r.ok ? r.json() : null))

const TABS = [
  { id: 'sprint', label: 'Sprint Planner', icon: <LayoutDashboard size={16} />, short: 'Sprint' },
  { id: 'risk', label: 'Risk Surfacer', icon: <AlertTriangle size={16} />, short: 'Risk' },
  { id: 'exec', label: 'Exec Briefing', icon: <Presentation size={16} />, short: 'Briefing' },
  { id: 'deps', label: 'Dependency Tracker', icon: <Link2 size={16} />, short: 'Deps' },
  { id: 'maturity', label: 'DLC Maturity', icon: <Activity size={16} />, short: 'Maturity' },
]

function Header({ activeTab, setActiveTab, repos, selectedRepo, setSelectedRepo, repoLoading }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '14px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}>
              <Hexagon size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                AI-DLC Command Center
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '2px', minWidth: '160px' }}>
                <RepoDropdown
                  repos={repos}
                  value={selectedRepo}
                  onChange={setSelectedRepo}
                />
              </div>
            </div>
          </div>

          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            {repoLoading && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '10px', color: 'var(--text-muted)',
              }}>
                <RefreshCw size={10} style={{ animation: 'spin 0.7s linear infinite' }} />
                syncing repo data
              </span>
            )}
            <span style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: 'var(--accent-green)',
              display: 'inline-block',
              animation: 'pulse-glow 2s ease infinite',
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OpenRouter AI powered</span>
          </div>
        </div>

        <nav style={{
          display: 'flex',
          gap: '2px',
          marginTop: '12px',
          overflowX: 'auto',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                borderRadius: '0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                marginBottom: '-1px',
              }}
              onMouseEnter={e => {
                if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <span style={{ fontSize: '14px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '16px 24px',
      marginTop: '40px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        AI-DLC Command Center · Built to demonstrate AI-Centric Development Life Cycle principles ·
        Powered by OpenRouter Gemma Model ·{' '}
        <a
          href="https://github.com/msourial"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}
        >
          github.com/msourial
        </a>
      </p>
    </footer>
  )
}

function WelcomeBanner({ onDismiss, selectedRepo, repoInfo, repoData, repoLoading }) {
  const description = repoInfo?.description
  const stars = repoInfo?.stargazers_count
  const language = repoInfo?.language
  const issueCount = Array.isArray(repoData) ? repoData.length : 0

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,140,255,0.08) 0%, rgba(167,139,250,0.06) 100%)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      marginBottom: '24px',
      position: 'relative',
    }}>
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px',
        }}
      >✕</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{ flexShrink: 0, color: 'var(--accent-blue)' }}>
          <Hexagon size={28} strokeWidth={2} />
        </div>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {selectedRepo} Development Repository
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>
            This tool operationalizes the <strong style={{ color: 'var(--accent-blue)' }}>AI-Centric Development Life Cycle (AI-DLC)</strong> across the {selectedRepo} repository —
            embedding GenAI into planning, risk management, dependency tracking, and release communication. Live data is pulled from GitHub (metadata, recent issues, README).
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {repoLoading && (
              <span style={{
                padding: '3px 8px', background: 'var(--accent-blue-dim)',
                color: 'var(--accent-blue)', borderRadius: '12px', fontSize: '11px',
                border: '1px solid rgba(99,140,255,0.2)',
              }}>Syncing with GitHub…</span>
            )}
            {!repoLoading && description && (
              <span style={{
                padding: '3px 8px', background: 'var(--accent-purple-dim)',
                color: 'var(--accent-purple)', borderRadius: '12px', fontSize: '11px',
                border: '1px solid rgba(167,139,250,0.25)', maxWidth: '100%',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={description}>“{description}”</span>
            )}
            {!repoLoading && language && (
              <span style={{
                padding: '3px 8px', background: 'var(--accent-green-dim)',
                color: 'var(--accent-green)', borderRadius: '12px', fontSize: '11px',
                border: '1px solid rgba(0,208,132,0.25)',
              }}>{language}</span>
            )}
            {!repoLoading && typeof stars === 'number' && (
              <span style={{
                padding: '3px 8px', background: 'var(--accent-amber-dim)',
                color: 'var(--accent-amber)', borderRadius: '12px', fontSize: '11px',
                border: '1px solid rgba(245,166,35,0.25)',
              }}>★ {stars}</span>
            )}
            {!repoLoading && (
              <span style={{
                padding: '3px 8px', background: 'var(--accent-teal-dim)',
                color: 'var(--accent-teal)', borderRadius: '12px', fontSize: '11px',
                border: '1px solid rgba(20,184,166,0.25)',
              }}>{issueCount} recent issues</span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              'AI-assisted planning & decomposition',
              'Agent-driven risk surfacing',
              'AI executive reporting',
              'Dependency intelligence',
              'DLC maturity scoring',
            ].map(tag => (
              <span key={tag} style={{
                padding: '3px 8px',
                background: 'var(--accent-blue-dim)',
                color: 'var(--accent-blue)',
                borderRadius: '12px',
                fontSize: '11px',
                border: '1px solid rgba(99,140,255,0.2)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('sprint')
  const [showBanner, setShowBanner] = useState(true)
  const [selectedRepo, setSelectedRepo] = useState(REPOSITORIES[0].fullName)

  // Richer per-repo payload: live metadata + recent issues + README excerpt.
  const [repoInfo, setRepoInfo] = useState(null) // { fullName, name, description, stars, language, updatedAt }
  const [repoData, setRepoData] = useState([])   // recent issues
  const [readme, setReadme] = useState('')        // README markdown (truncated)
  const [repoLoading, setRepoLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setRepoLoading(true)
      const [info, issues, readmeRes] = await Promise.all([
        gh(`https://api.github.com/repos/${selectedRepo}`),
        gh(`https://api.github.com/repos/${selectedRepo}/issues?per_page=5&state=all`),
        fetch(`https://api.github.com/repos/${selectedRepo}/readme`, {
          headers: { Accept: 'application/vnd.github.raw+json' },
        }),
      ])
      if (cancelled) return
      setRepoInfo(info)
      setRepoData(Array.isArray(issues) ? issues : [])
      const readmeText = readmeRes && readmeRes.ok ? await readmeRes.text() : ''
      setReadme(readmeText.slice(0, 4000))
      setRepoLoading(false)
    }
    load().catch(() => {
      if (!cancelled) setRepoLoading(false)
    })
    return () => { cancelled = true }
  }, [selectedRepo])

  // Build the dropdown list: start from REPOSITORIES, enrich descriptions
  // with live metadata once it's loaded.
  const repos = REPOSITORIES.map((r) => {
    const live = repoInfo && repoInfo.fullName === r.fullName ? repoInfo : null
    return {
      name: r.name,
      fullName: r.fullName,
      description: (live && live.description) || '',
    }
  })

  const renderTab = () => {
    const props = { selectedRepo, repoData, repoInfo, readme }
    switch (activeTab) {
      case 'sprint': return <SprintPlanner {...props} />
      case 'risk': return <RiskSurfacer {...props} />
      case 'exec': return <ExecBriefing {...props} />
      case 'deps': return <DependencyTracker {...props} />
      case 'maturity': return <MaturityScorer {...props} />
      default: return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        repos={repos}
        selectedRepo={selectedRepo}
        setSelectedRepo={setSelectedRepo}
        repoLoading={repoLoading}
      />
      <main style={{ flex: 1, maxWidth: '1100px', margin: '0 auto', padding: '28px 24px', width: '100%' }}>
        {showBanner && (
          <WelcomeBanner
            onDismiss={() => setShowBanner(false)}
            selectedRepo={selectedRepo}
            repoInfo={repoInfo}
            repoData={repoData}
            repoLoading={repoLoading}
          />
        )}
        {renderTab()}
      </main>
      <Footer />
    </div>
  )
}
