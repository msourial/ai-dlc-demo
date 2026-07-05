import React, { useState } from 'react'
import { useClaudeAPI } from '../hooks/useClaudeAPI'
import { Link2, AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2, ExternalLink, CheckCircle, Loader } from 'lucide-react'
import { Card, Button, Badge, SectionHeader, ErrorBox, Spinner } from './UI'
import { buildRepoContext } from '../lib/repoContext'
import { parseDependencyReport, createGitHubIssue, hasGitHubToken, detectRiskLabels } from '../services/githubService'

const SYSTEM_PROMPT = `You are an AI dependency tracking engine for the GenoSync repository.
Your job is to analyze a set of cross-team dependencies and produce a structured dependency map with risk flags.

Respond in this EXACT format:

DEPENDENCY ANALYSIS
===================
Program: GenoSync Core
Total Dependencies: [N]
Blocking Now: [N]  At Risk: [N]  On Track: [N]

DEPENDENCY MAP
==============
[For each dependency found or inferred, use this format:]

DEP-001
From Team: [team providing the dependency]
To Team: [team blocked waiting for it]
Deliverable: [specific artifact, API, approval, or decision]
Status: [BLOCKING | AT RISK | ON TRACK | COMPLETE]
Due: [Sprint N or date]
Impact if Late: [specific downstream impact]
Escalation Path: [who to escalate to]
AI-Flag: [specific action AI monitoring could take to catch slippage early]

[Continue DEP-002, DEP-003...]

CRITICAL PATH ANALYSIS
=======================
[Identify the longest chain of dependencies and why it's the critical path]

RECOMMENDED ACTIONS
===================
1. [Most urgent action]
2. [Second action]
3. [Third action]

AI MONITORING SETUP
===================
[Describe 3 specific AI agent monitors that should be set up to track these dependencies automatically — what signal they watch, what threshold triggers an alert, and who gets notified]

Be specific to a software development project with teams like: Frontend, Backend API, Database, DevOps, QA, and external vendors.`

const DEFAULT_DEPS = `Corda DLT smart contract team waiting on Java/Kotlin code audit from external security vendor — needed for node upgrade go-live, due Sprint 14
Paxos API ingestion pipeline blocked by KMS key vault certification — 2 weeks delayed, SRE team awaiting hardware security module (HSM) delivery
Blockchain for Energy Consortium requires signed compliance attestation before cross-jurisdiction node deployment — legal review in progress, no ETA
SRE/KMS signing gate depends on HSM throughput benchmark completion — currently 3 weeks behind schedule
Enterprise compliance audit logging pipeline requires architecture sign-off from Office of the CRO — not yet scheduled
Multi-sig hot wallet reconciliation depends on Paxos API v2 contract finalization — external dependency, unknown timeline
Cold wallet failover drill requires coordinated SRE disaster recovery runbook sign-off from 3 separate regulated entities — blocking Q3 go-live gate
Java smart contract parameter tuning blocked by delegated proof-of-stake consortium vote — 2 of 5 consortium members have not ratified`

function parseStatus(status) {
  const s = (status || '').toUpperCase()
  if (s.includes('BLOCKING')) return 'BLOCKING'
  if (s.includes('AT RISK')) return 'AT RISK'
  if (s.includes('ON TRACK')) return 'ON TRACK'
  if (s.includes('COMPLETE')) return 'COMPLETE'
  return 'UNKNOWN'
}

const STATUS_COLORS = {
  BLOCKING: '#dc2626',
  'AT RISK': '#d97706',
  'ON TRACK': '#16a34a',
  COMPLETE: '#0d9488',
}

const STATUS_ICONS = {
  BLOCKING: <AlertOctagon size={14} />,
  'AT RISK': <AlertTriangle size={14} />,
  'ON TRACK': <CheckCircle size={14} />,
  COMPLETE: <CheckCircle2 size={14} />,
}

export default function DependencyTracker({ repoInfo, readme }) {
  const [deps, setDeps] = useState(DEFAULT_DEPS)
  const [result, setResult] = useState('')
  const [parsedDeps, setParsedDeps] = useState([])
  const [pushing, setPushing] = useState(false)
  const [pushResults, setPushResults] = useState([])
  const [pushError, setPushError] = useState('')
  const { call, loading, error } = useClaudeAPI()

  const selectedRepo = repoInfo?.fullName || repoInfo?.name || 'Repository'

  const run = async () => {
    if (!deps.trim()) return
    setPushResults([])
    setPushError('')
    const context = buildRepoContext(repoInfo, null, readme)
    const output = await call(
      SYSTEM_PROMPT,
      `${context}Analyze these cross-team dependencies:\n\n${deps}`
    )
    if (output) {
      setResult(output)
      setParsedDeps(parseDependencyReport(output))
    }
  }

  const pushToGitHub = async () => {
    setPushing(true)
    setPushResults([])
    setPushError('')
    const results = []
    for (const dep of parsedDeps) {
      try {
        const body = [
          `## ${dep.id}: ${dep.deliverable}`,
          '',
          `**From Team:** ${dep.fromTeam}`,
          `**To Team:** ${dep.toTeam}`,
          `**Deliverable:** ${dep.deliverable}`,
          `**Status:** ${dep.status}`,
          `**Due:** ${dep.due}`,
          `**Impact if Late:** ${dep.impact}`,
          `**Escalation Path:** ${dep.escalation}`,
          '',
          `---`,
          `_Generated by AI Dependency Tracker_`,
        ].join('\n')
        const res = await createGitHubIssue({
          title: `[${selectedRepo}] ${dep.id}: ${dep.deliverable}`,
          body,
          labels: ['ai-dlc', 'dependency-tracker'],
        })
        results.push(res)
      } catch (err) {
        setPushError(err.message)
        break
      }
    }
    setPushResults(results)
    setPushing(false)
  }

  const statusCounts = result ? {
    blocking: (result.match(/BLOCKING/g) || []).length,
    atRisk: (result.match(/AT RISK/g) || []).length,
    onTrack: (result.match(/ON TRACK/g) || []).length,
    complete: (result.match(/COMPLETE/g) || []).length,
  } : null

  return (
    <div>
      <SectionHeader
        icon={<Link2 size={20} />}
        title="Dependency Tracker"
        subtitle="List cross-team dependencies in plain language — AI maps them, flags blockers, identifies critical path, and sets up AI monitoring."
      />

      <Card>
        {statusCounts && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginBottom: '20px',
          }}>
            {[
              { label: 'Blocking', count: statusCounts.blocking, color: 'red', icon: <AlertOctagon size={24} color="var(--accent-red)" /> },
              { label: 'At Risk', count: statusCounts.atRisk, color: 'amber', icon: <AlertTriangle size={24} color="var(--accent-amber)" /> },
              { label: 'On Track', count: statusCounts.onTrack, color: 'green', icon: <AlertCircle size={24} color="var(--accent-green)" /> },
              { label: 'Complete', count: statusCounts.complete, color: 'teal', icon: <CheckCircle2 size={24} color="var(--accent-teal)" /> },
            ].map(({ label, count, color, icon }) => (
              <div key={label} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{count}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
            Cross-Team Dependencies (one per line)
          </label>
          <textarea
            value={deps}
            onChange={e => setDeps(e.target.value)}
            rows={9}
            style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button onClick={run} disabled={loading || !deps.trim()} style={{ background: 'var(--accent-teal)' }}>
            {loading ? <Spinner size={14} /> : <Link2 size={14} />}
            {loading ? 'Mapping dependencies…' : 'Map & analyze with AI'}
          </Button>
          {result && (
            <Button variant="ghost" size="sm" onClick={() => { setResult(''); setParsedDeps([]); setPushResults([]); setPushError('') }}>
              Clear results
            </Button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <Badge color="teal">Critical Path</Badge>
            <Badge color="amber">Blocker Detection</Badge>
          </div>
        </div>

        <ErrorBox message={error} />

        {result && (
          <div className="animate-in" style={{ marginTop: '16px' }}>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent-teal)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px 20px',
              fontSize: '12.5px',
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-mono)',
              maxHeight: '540px',
              overflowY: 'auto',
            }}>
              {result}
            </div>
          </div>
        )}

        {parsedDeps.length > 0 && (
          <div className="animate-in" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Parsed Dependencies ({parsedDeps.length})
              </h3>
              <Button
                onClick={pushToGitHub}
                disabled={pushing}
                style={hasGitHubToken() ? { background: '#16a34a', color: '#fff' } : { background: '#6b7280', color: '#fff' }}
              >
                {pushing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ExternalLink size={14} />}
                {pushing ? 'Pushing...' : `Push ${parsedDeps.length} Dependencies to GitHub`}
              </Button>
            </div>

            {!hasGitHubToken() && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#92400e',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertTriangle size={14} />
                <span>GitHub token not set. Add <code style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>VITE_GITHUB_TOKEN</code> to your <code style={{ background: '#fde68a', padding: '2px 6px', borderRadius: '4px' }}>.env</code> file to enable pushing issues.</span>
              </div>
            )}

            {pushError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #dc2626',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#991b1b',
                marginBottom: '12px',
              }}>
                <strong>Push error:</strong> {pushError}
              </div>
            )}

            {pushResults.length > 0 && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #16a34a',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#166534',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <CheckCircle2 size={16} />
                <span>Successfully pushed {pushResults.length} {pushResults.length === 1 ? 'issue' : 'issues'} to GitHub.</span>
                {pushResults.map(r => (
                  <a key={r.number} href={r.html_url} target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', textDecoration: 'underline', marginLeft: '4px' }}>
                    #{r.number}
                  </a>
                ))}
              </div>
            )}

            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>DEP</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>From Team</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>To Team</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Deliverable</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedDeps.map((dep, i) => {
                    const status = parseStatus(dep.status)
                    return (
                      <tr key={dep.id} style={{ borderBottom: i < parsedDeps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{dep.id}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{dep.fromTeam}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{dep.toTeam}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-primary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.deliverable}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: STATUS_COLORS[status] ? `${STATUS_COLORS[status]}20` : '#6b728020',
                            color: STATUS_COLORS[status] || '#6b7280',
                          }}>
                            {STATUS_ICONS[status] || <AlertCircle size={14} />}
                            {status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
