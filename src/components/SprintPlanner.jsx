import React, { useState } from 'react'
import { useClaudeAPI } from '../hooks/useClaudeAPI'
import { LayoutDashboard, Zap, ExternalLink, CheckCircle, AlertTriangle, Loader } from 'lucide-react'
import { Card, Button, Badge, SectionHeader, ErrorBox, Spinner } from './UI'
import { buildRepoContext } from '../lib/repoContext'
import { getProjectEpics } from '../lib/projectDefaults'
import { createGitHubIssue, parseTasksFromDecomposition, hasGitHubToken, detectRiskLabels } from '../services/githubService'

const getSystemPrompt = (repo) => `You are an AI project planner for ${repo}.
Decompose the given epic into numbered tasks.

Output format:
SPRINT DECOMPOSITION
Epic: [name]
Estimated Sprints: [N]
Teams Involved: [list]

PHASE 1 — [name] (Sprint 1-N)
[Task 1.1] [task name]
  Owner: [team]
  Dependency: [none/dependency description]
  AI Assist: [how GenAI can help]
  Risk: [LOW/MED/HIGH] — [one-line risk]

CRITICAL PATH
AI-DLC ACCELERATION OPPORTUNITIES
READINESS GATES`

export default function SprintPlanner({ selectedRepo, repoData, repoInfo, readme, onOpenTokenModal }) {
  const exampleEpics = getProjectEpics(selectedRepo, repoInfo)
  const [epic, setEpic] = useState(exampleEpics[0])
  const [result, setResult] = useState('')
  const { call, loading, error } = useClaudeAPI()

  const [parsedTasks, setParsedTasks] = useState([])
  const [pushingIssues, setPushingIssues] = useState(false)
  const [pushProgress, setPushProgress] = useState({ done: 0, total: 0 })
  const [pushError, setPushError] = useState('')
  const [pushSuccess, setPushSuccess] = useState(null)

  const tokenReady = hasGitHubToken()

  React.useEffect(() => {
    const repoName = selectedRepo.includes('/') ? selectedRepo.split('/')[1] : selectedRepo
    const otherRepo = repoName === 'GenoSync' ? 'Skyfall' : 'GenoSync'
    const filteredIssues = (repoData || []).filter(issue => !issue.title.startsWith(`[${otherRepo}]`))

    if (filteredIssues && filteredIssues.length > 0) {
      setEpic(filteredIssues.map(issue => `- #${issue.number}: ${issue.title}`).join('\n'))
    } else {
      const epics = getProjectEpics(selectedRepo, repoInfo)
      setEpic(epics[0])
    }
  }, [repoData, selectedRepo, repoInfo])

  const run = async () => {
    if (!epic.trim()) return
    setPushError('')
    setPushSuccess(null)
    setParsedTasks([])
    setResult('')

    const context = buildRepoContext(repoInfo, repoData, readme)
    const repoName = selectedRepo.includes('/') ? selectedRepo.split('/')[1] : selectedRepo
    const output = await call(
      getSystemPrompt(repoName),
      `${context}Please decompose this epic:\n\n${epic}`
    )
    if (!output) return

    setResult(output)

    const tasks = parseTasksFromDecomposition(output)
    setParsedTasks(tasks)
  }

  const pushToGitHub = async () => {
    if (!tokenReady) {
      if (onOpenTokenModal) onOpenTokenModal()
      return
    }
    if (parsedTasks.length === 0) return
    setPushingIssues(true)
    setPushProgress({ done: 0, total: parsedTasks.length })
    setPushError('')
    setPushSuccess(null)

    const created = []
    for (let i = 0; i < parsedTasks.length; i++) {
      try {
        const repoName = selectedRepo.includes('/') ? selectedRepo.split('/')[1] : selectedRepo
        const issue = await createGitHubIssue({
          title: `[${repoName}] ${parsedTasks[i].title}`,
          body: `**Epic:** ${epic.split('\n')[0]}\n\n**Phase Task:** ${parsedTasks[i].body}\n\n**Owner:** ${parsedTasks[i].owner || 'TBD'}\n**Dependency:** ${parsedTasks[i].dependency || 'None'}\n**Risk Level:** ${parsedTasks[i].risk || 'LOW'}`,
          labels: ['ai-dlc', 'sprint-plan'],
        }, selectedRepo)
        created.push(issue)
      } catch (err) {
        setPushError(`Failed to create issue "${parsedTasks[i].title}": ${err.message}`)
        if (err.message.includes('401') && onOpenTokenModal) {
          onOpenTokenModal()
        }
        break
      }
      setPushProgress({ done: i + 1, total: parsedTasks.length })
    }

    setPushingIssues(false)
    if (created.length > 0) {
      setPushSuccess(created)
    }
  }

  return (
    <div>
      <SectionHeader
        icon={<LayoutDashboard size={20} />}
        title="AI Sprint Planner"
        subtitle="Paste a program epic — AI decomposes it into sequenced tasks, owners, dependencies, and AI-DLC acceleration points."
      />

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Epic / Initiative
            </label>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Try an example →</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {exampleEpics.map((e, i) => (
              <button
                key={i}
                onClick={() => setEpic(e)}
                style={{
                  background: epic === e ? 'var(--accent-blue-dim)' : 'var(--bg-input)',
                  border: `1px solid ${epic === e ? 'var(--accent-blue)' : 'var(--border)'}`,
                  color: epic === e ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {e.length > 55 ? e.slice(0, 55) + '…' : e}
              </button>
            ))}
          </div>

          <textarea
            value={epic}
            onChange={e => setEpic(e.target.value)}
            placeholder="Describe the epic or initiative to decompose..."
            rows={4}
            style={{ width: '100%', fontFamily: 'var(--font-sans)' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button onClick={run} disabled={loading || !epic.trim()}>
            {loading ? <Spinner size={14} /> : <Zap size={14} />}
            {loading ? 'Decomposing…' : 'Decompose with AI-DLC'}
          </Button>
          {result && (
            <Button variant="ghost" size="sm" onClick={() => { setResult(''); setEpic(''); setParsedTasks([]); setPushSuccess(null); setPushError('') }}>
              Clear
            </Button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <Badge color="blue">Sprint Planning</Badge>
            <Badge color="purple">AI-Assisted</Badge>
          </div>
        </div>

        {error && <ErrorBox message={error} />}

        {parsedTasks.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Parsed Tasks ({parsedTasks.length})
              </label>
              <Button
                onClick={pushToGitHub}
                disabled={pushingIssues}
                style={{ background: tokenReady ? 'var(--accent-green)' : 'var(--text-muted)' }}
              >
                {pushingIssues ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ExternalLink size={14} />}
                {pushingIssues ? `Pushing ${pushProgress.done}/${pushProgress.total}…` : tokenReady ? `Push ${parsedTasks.length} Issues to GitHub` : 'GitHub Token Not Set'}
              </Button>
            </div>

            {!tokenReady && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={14} />
                  <span>
                    <strong>GitHub Token</strong> not configured or invalid. Provide a GitHub PAT with <code style={{ background: 'rgba(251,191,36,0.18)', padding: '1px 4px', borderRadius: '3px' }}>repo</code> scope to push issues.
                  </span>
                </div>
                {onOpenTokenModal && (
                  <button
                    onClick={onOpenTokenModal}
                    style={{
                      background: 'var(--accent-amber)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Configure Token
                  </button>
                )}
              </div>
            )}

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}>
              {parsedTasks.map((task, i) => {
                const hasRisk = detectRiskLabels(task.body).length > 0
                return (
                  <div key={i} style={{
                    padding: '10px 14px',
                    borderBottom: i < parsedTasks.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: hasRisk ? 'var(--accent-red)' : 'var(--text-muted)',
                      minWidth: '40px',
                      paddingTop: '2px',
                    }}>
                      {task.risk || '—'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {hasRisk && <span style={{ color: 'var(--accent-red)', marginRight: '4px' }}>⚠</span>}
                        {task.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                        <span>Owner: {task.owner || 'TBD'}</span>
                        <span>Dep: {task.dependency || 'None'}</span>
                      </div>
                    </div>
                    {hasRisk && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        background: 'rgba(251,113,133,0.1)',
                        color: 'var(--accent-red)',
                        border: '1px solid rgba(251,113,133,0.3)',
                        whiteSpace: 'nowrap',
                      }}>
                        risk:critical
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {pushingIssues && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'var(--accent-blue-dim)',
            border: '1px solid rgba(96,165,250,0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Creating GitHub issues… {pushProgress.done}/{pushProgress.total}
          </div>
        )}

        {pushError && <ErrorBox message={pushError} />}

        {pushSuccess && (
          <div style={{
            marginTop: '12px',
            padding: '14px 16px',
            background: 'var(--accent-green-dim)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            color: 'var(--accent-green)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <CheckCircle size={16} />
              {pushSuccess.length} GitHub issue{pushSuccess.length !== 1 ? 's' : ''} created successfully
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
      </Card>
    </div>
  )
}
