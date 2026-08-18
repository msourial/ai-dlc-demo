import React, { useState } from 'react'
import { useClaudeAPI } from '../hooks/useClaudeAPI'
import { Presentation, Sparkles, Copy, ExternalLink, CheckCircle, AlertTriangle, Loader } from 'lucide-react'
import { Card, Button, Badge, SectionHeader, ErrorBox, Spinner } from './UI'
import { buildRepoContext } from '../lib/repoContext'
import { getProjectStatusPresets } from '../lib/projectDefaults'
import { createGitHubIssue, hasGitHubToken, detectRiskLabels } from '../services/githubService'

const SYSTEM_PROMPT = (repo) => `You are the AI executive communications engine for the ${repo} repository.
Your job is to transform raw program status into precise, decision-oriented executive briefings that senior leaders can act on.

Generate a polished executive update in this EXACT format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${repo} — EXECUTIVE BRIEFING
Project ${repo} | Engineering Leadership
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROGRAM STATUS: [🟢 ON TRACK | 🟡 AT RISK | 🔴 OFF TRACK]
Reporting Period: [derive from input]
Next Milestone: [key upcoming milestone with date]

EXECUTIVE SUMMARY (2 sentences max)
[Concise, decision-focused summary of where the program stands and what matters most right now]

OUTCOMES THIS PERIOD
▸ [Outcome 1 — focus on delivery, not activity]
▸ [Outcome 2]
▸ [Outcome 3]

RISKS REQUIRING LEADERSHIP ATTENTION
⚠ [Risk 1]: [mitigation or decision needed]
⚠ [Risk 2]: [mitigation or decision needed]

DECISIONS REQUIRED FROM LEADERSHIP
□ [Decision 1] — needed by [date/timeframe] — [consequence of delay]
□ [Decision 2] — needed by [date/timeframe]

PROGRAM METRICS
┌─────────────────────────┬─────────────┬──────────┐
│ Metric                  │ This Period │ Trend    │
├─────────────────────────┼─────────────┼──────────┤
│ Milestones              │ X/Y on time │ [↑↓→]   │
│ Critical risks open     │ N           │ [↑↓→]   │
│ Blockers resolved       │ N           │ [↑↓→]   │
│ Readiness gates passed  │ X/Y         │ [↑↓→]   │
└─────────────────────────┴─────────────┴──────────┘

NEXT PERIOD FOCUS
1. [Top priority]
2. [Second priority]
3. [Third priority]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prepared with AI-DLC Executive Reporting Engine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tone: precise, direct, outcome-focused. No fluff. Leaders should be able to read this in 90 seconds and know exactly what's happening and what they need to do.`

export default function ExecBriefing({ selectedRepo, repoInfo, readme, onOpenTokenModal }) {
  const statusPresets = getProjectStatusPresets(selectedRepo)
  const [statusInput, setStatusInput] = useState(statusPresets[0].value)
  const [audience, setAudience] = useState('C-Suite (CTO, COO, CRO)')
  const [result, setResult] = useState('')
  const { call, loading, error } = useClaudeAPI()

  React.useEffect(() => {
    const presets = getProjectStatusPresets(selectedRepo)
    setStatusInput(presets[0].value)
  }, [selectedRepo])

  const [pushingIssues, setPushingIssues] = useState(false)
  const [pushProgress, setPushProgress] = useState({ done: 0, total: 0 })
  const [pushError, setPushError] = useState('')
  const [pushSuccess, setPushSuccess] = useState(null)

  const tokenReady = hasGitHubToken()

  const run = async () => {
    if (!statusInput.trim()) return
    setPushError('')
    setPushSuccess(null)
    const context = buildRepoContext(repoInfo, null, readme)
    const prompt = `${context}Audience: ${audience}\n\nProgram status notes:\n${statusInput}`
    const output = await call(SYSTEM_PROMPT(selectedRepo), prompt)
    if (output) setResult(output)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result)
  }

  const pushToGitHub = async () => {
    if (!tokenReady) {
      if (onOpenTokenModal) onOpenTokenModal()
      return
    }
    if (!result) return
    setPushingIssues(true)
    setPushProgress({ done: 0, total: 1 })
    setPushError('')
    setPushSuccess(null)

    try {
      const repoName = selectedRepo.includes('/') ? selectedRepo.split('/')[1] : selectedRepo
      const issue = await createGitHubIssue({
        title: `[${repoName}] Executive Briefing — ${new Date().toLocaleDateString()}`,
        body: result,
        labels: ['ai-dlc', 'exec-briefing'],
      }, selectedRepo)
      setPushProgress({ done: 1, total: 1 })
      setPushingIssues(false)
      setPushSuccess([issue])
    } catch (err) {
      setPushError(`Failed to create briefing: ${err.message}`)
      if (err.message.includes('401') && onOpenTokenModal) {
        onOpenTokenModal()
      }
      setPushingIssues(false)
    }
  }

  return (
    <div>
      <SectionHeader
        icon={<Presentation size={20} />}
        title="Executive Briefing Generator"
        subtitle="Paste raw program notes — AI transforms them into a professional executive update focused on outcomes, risks, and decisions."
      />

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '16px', alignItems: 'start' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Raw Status Notes
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {statusPresets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setStatusInput(p.value)}
                  style={{
                    background: statusInput === p.value ? 'var(--accent-blue-dim)' : 'var(--bg-input)',
                    border: `1px solid ${statusInput === p.value ? 'var(--accent-blue)' : 'var(--border)'}`,
                    color: statusInput === p.value ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <textarea
              value={statusInput}
              onChange={e => setStatusInput(e.target.value)}
              placeholder="Paste bullet points, Slack notes, Jira summaries — anything raw..."
              rows={5}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Audience
            </label>
            <select
              value={audience}
              onChange={e => setAudience(e.target.value)}
              style={{ width: '100%' }}
            >
              <option>C-Suite (CTO, COO, CRO)</option>
              <option>Program Steering Committee</option>
              <option>Engineering Leadership</option>
              <option>Board Risk Committee</option>
              <option>Regulator / OCC</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button onClick={run} disabled={loading || !statusInput.trim()}>
            {loading ? <Spinner size={14} /> : <Sparkles size={14} />}
            {loading ? 'Generating briefing…' : 'Generate executive briefing'}
          </Button>
          {result && (
            <>
              <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                <Copy size={14} /> Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setResult(''); setStatusInput(''); setPushSuccess(null); setPushError('') }}>
                Clear
              </Button>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <Badge color="purple">AI-DLC Reporting</Badge>
            <Badge color="teal">Executive Ready</Badge>
          </div>
        </div>

        <ErrorBox message={error} />

        {result && (
          <div className="animate-in" style={{ marginTop: '16px' }}>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent-purple)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px 24px',
              fontSize: '12.5px',
              lineHeight: 1.85,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-mono)',
              maxHeight: '560px',
              overflowY: 'auto',
            }}>
              {result}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                onClick={pushToGitHub}
                disabled={pushingIssues}
                style={{ background: tokenReady ? 'var(--accent-green)' : 'var(--text-muted)' }}
              >
                {pushingIssues ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ExternalLink size={14} />}
                {pushingIssues ? `Pushing ${pushProgress.done}/${pushProgress.total}…` : tokenReady ? 'Push Briefing to GitHub' : 'GitHub Token Not Set'}
              </Button>
            </div>

            {!tokenReady && (
              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                background: 'rgba(245,166,35,0.08)',
                border: '1px solid rgba(245,166,35,0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertTriangle size={14} />
                <span>
                  <strong>VITE_GITHUB_TOKEN</strong> not configured. Add a <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>GitHub PAT</a> to your <code style={{ background: 'rgba(245,166,35,0.15)', padding: '1px 4px', borderRadius: '3px' }}>.env</code> file with <code style={{ background: 'rgba(245,166,35,0.15)', padding: '1px 4px', borderRadius: '3px' }}>repo</code> scope.
                </span>
              </div>
            )}

            {pushingIssues && (
              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                background: 'var(--accent-blue-dim)',
                border: '1px solid rgba(99,140,255,0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Creating GitHub issue… {pushProgress.done}/{pushProgress.total}
              </div>
            )}

            {pushError && <ErrorBox message={pushError} />}

            {pushSuccess && (
              <div style={{
                marginTop: '12px',
                padding: '14px 16px',
                background: 'var(--accent-green-dim)',
                border: '1px solid rgba(0,208,132,0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                color: 'var(--accent-green)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <CheckCircle size={16} />
                  Briefing pushed to GitHub
                </div>
                <a
                  href={`https://github.com/${selectedRepo}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--accent-blue)',
                    textDecoration: 'underline',
                    fontSize: '12px',
                  }}
                >
                  <ExternalLink size={14} />
                  Open {selectedRepo} issues →
                </a>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
