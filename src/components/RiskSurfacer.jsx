import React, { useState } from 'react'
import { useClaudeAPI } from '../hooks/useClaudeAPI'
import { AlertTriangle, Search, ExternalLink, CheckCircle, Loader } from 'lucide-react'
import { Card, Button, Badge, SectionHeader, ErrorBox, Spinner } from './UI'
import { buildRepoContext } from '../lib/repoContext'
import { parseRiskReport, createGitHubIssue, hasGitHubToken, detectRiskLabels } from '../services/githubService'

const getSystemPrompt = (repo) => `You are an AI risk intelligence engine for the ${repo} repository.
Your job is to surface, categorize, and prioritize delivery and technical risks with specific mitigations.

When given a scenario, delivery situation, or program description, respond in this EXACT structured format:

RISK INTELLIGENCE REPORT
=========================
Program Area: [area]
Risk Scan Date: [use "Current Sprint"]
Overall Risk Level: [CRITICAL / HIGH / MEDIUM / LOW]

CRITICAL RISKS 🔴
-----------------
[If any exist, list with:]
Risk ID: CR-001
Category: [Technical | Security | Regulatory | Operational | Dependency]
Risk: [Clear one-line risk statement]
Probability: [High/Med/Low]  Impact: [High/Med/Low]
Root Cause: [specific technical or process reason]
Mitigation: [specific, actionable mitigation step]
Owner: [team or role]
Trigger: [what would escalate this risk]

HIGH RISKS 🟠
-------------
[Same format, HR-001, HR-002...]

MEDIUM RISKS 🟡
---------------
[Same format, MR-001, MR-002...]

DEPENDENCY FLAGS 🔗
-------------------
[List 3-4 cross-team or external dependencies that could block delivery]

REGULATORY READINESS 📋
-----------------------
[List 2-3 specific regulatory or compliance checkpoints relevant to crypto custody at a regulated broker-dealer]

AI-DLC RISK MONITORING RECOMMENDATIONS
=======================================
[List 3 specific ways to use AI agents to continuously monitor, surface, or mitigate these risks]

Be specific to a software development, open-source, or standard sync tool environment. Reference relevant frameworks (CI/CD, OAuth, REST/GraphQL specs) where appropriate.`

const SCENARIOS = [
  'Corda DLT node upgrade window closing in 3 weeks — Java/Kotlin smart contract migration 40% behind schedule, Blockchain for Energy Consortium SLA at risk',
  'Paxos API integration for hot wallet reconciliation — KMS key rotation compliance gate not passed, SRE disaster recovery failover test failing for 2 consecutive runs',
  'Multi-sig custody cold/warm wallet architecture review — delegated proof-of-stake parameter tuning blocked by enterprise compliance audit logging requirement',
  'Enterprise-grade SRE/KMS signing gate rollout — HSM throughput bottleneck identified, Blockchain for Energy Consortium nodes require simultaneous upgrade coordination across 7 jurisdictions',
]

const riskColors = {
  'CRITICAL': 'red',
  'HIGH': 'amber',
  'MEDIUM': 'blue',
  'LOW': 'green',
}

function parseRiskLevel(text) {
  if (!text) return null
  const match = text.match(/Overall Risk Level:\s*(CRITICAL|HIGH|MEDIUM|LOW)/i)
  return match ? match[1].toUpperCase() : null
}

export default function RiskSurfacer({ selectedRepo, repoData, repoInfo, readme }) {
  const [scenario, setScenario] = useState(SCENARIOS[0])
  const [result, setResult] = useState('')
  const { call, loading, error } = useClaudeAPI()

  const [parsedRisks, setParsedRisks] = useState([])
  const [pushingIssues, setPushingIssues] = useState(false)
  const [pushProgress, setPushProgress] = useState({ done: 0, total: 0 })
  const [pushError, setPushError] = useState('')
  const [pushSuccess, setPushSuccess] = useState(null)

  const tokenReady = hasGitHubToken()

  React.useEffect(() => {
    const issueLine = (repoData && repoData.length > 0)
      ? repoData.map(issue => `Issue #${issue.number}: ${issue.title}`).join('\n')
      : ''
    const readmeLine = readme
      ? `README (truncated):\n${readme.slice(0, 2500)}`
      : ''
    if (issueLine || readmeLine) {
      setScenario([issueLine, readmeLine].filter(Boolean).join('\n\n'))
    } else {
      setScenario(`Analyze risk for ${selectedRepo}`)
    }
  }, [repoData, readme, selectedRepo])

  const run = async () => {
    if (!scenario.trim()) return
    setPushError('')
    setPushSuccess(null)
    setParsedRisks([])
    setResult('')

    const context = buildRepoContext(repoInfo, repoData, readme)
    const output = await call(
      getSystemPrompt(selectedRepo),
      `${context}Analyze this scenario for risks:\n\n${scenario}`
    )
    if (!output) return

    setResult(output)

    const risks = parseRiskReport(output)
    setParsedRisks(risks)
  }

  const pushToGitHub = async () => {
    if (parsedRisks.length === 0) return
    setPushingIssues(true)
    setPushProgress({ done: 0, total: parsedRisks.length })
    setPushError('')
    setPushSuccess(null)

    const created = []
    for (let i = 0; i < parsedRisks.length; i++) {
      try {
        const risk = parsedRisks[i]
        const issue = await createGitHubIssue({
          title: `[${selectedRepo}] ${risk.id}: ${risk.risk}`,
          body: `**Risk ID:** ${risk.id}\n**Category:** ${risk.category}\n**Risk:** ${risk.risk}\n**Probability:** ${risk.probability}\n**Impact:** ${risk.impact}\n**Root Cause:** ${risk.rootCause}\n**Mitigation:** ${risk.mitigation}\n**Owner:** ${risk.owner}\n**Trigger:** ${risk.trigger}`,
          labels: ['ai-dlc', 'risk-intel'],
        })
        created.push(issue)
      } catch (err) {
        setPushError(`Failed to create issue "${parsedRisks[i].id}: ${parsedRisks[i].risk}": ${err.message}`)
        break
      }
      setPushProgress({ done: i + 1, total: parsedRisks.length })
    }

    setPushingIssues(false)
    if (created.length > 0) {
      setPushSuccess(created)
    }
  }

  const riskLevel = parseRiskLevel(result)

  const renderOutput = () => {
    if (!result) return null
    const lines = result.split('\n')
    return (
      <div className="animate-in" style={{ marginTop: '16px' }}>
        {riskLevel && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            background: riskLevel === 'CRITICAL' ? 'rgba(255,77,106,0.08)' :
                        riskLevel === 'HIGH' ? 'rgba(245,166,35,0.08)' :
                        riskLevel === 'MEDIUM' ? 'rgba(99,140,255,0.08)' : 'rgba(0,208,132,0.08)',
            border: `1px solid ${riskLevel === 'CRITICAL' ? 'rgba(255,77,106,0.3)' :
                                  riskLevel === 'HIGH' ? 'rgba(245,166,35,0.3)' :
                                  riskLevel === 'MEDIUM' ? 'rgba(99,140,255,0.3)' : 'rgba(0,208,132,0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            marginBottom: '12px',
          }}>
            <span style={{ display: 'flex', color: riskLevel === 'CRITICAL' ? 'var(--accent-red)' : riskLevel === 'HIGH' ? 'var(--accent-amber)' : riskLevel === 'MEDIUM' ? 'var(--accent-blue)' : 'var(--accent-green)' }}>
              <AlertTriangle size={18} />
            </span>
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
              Overall Risk Level:
            </span>
            <Badge color={riskColors[riskLevel] || 'gray'}>{riskLevel}</Badge>
          </div>
        )}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--accent-red)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
          fontSize: '13px',
          lineHeight: 1.75,
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          maxHeight: '520px',
          overflowY: 'auto',
        }}>
          {result}
        </div>
      </div>
    )
  }

  const riskLevelBadge = (level) => {
    const color = level === 'HIGH' ? 'amber' : level === 'MEDIUM' ? 'blue' : 'green'
    return <Badge color={color}>{level}</Badge>
  }

  return (
    <div>
      <SectionHeader
        icon={<AlertTriangle size={20} />}
        title="Risk Surfacer"
        subtitle="Describe a delivery scenario — AI identifies, categorizes, and prioritizes risks with specific mitigations for software delivery."
      />

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Delivery Scenario
            </label>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {SCENARIOS.map((s, i) => (
              <button
                key={i}
                onClick={() => setScenario(s)}
                style={{
                  background: scenario === s ? 'rgba(255,77,106,0.08)' : 'var(--bg-input)',
                  border: `1px solid ${scenario === s ? 'rgba(255,77,106,0.4)' : 'var(--border)'}`,
                  color: scenario === s ? 'var(--accent-red)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {s.length > 65 ? s.slice(0, 65) + '…' : s}
              </button>
            ))}
          </div>

          <textarea
            value={scenario}
            onChange={e => setScenario(e.target.value)}
            placeholder="Describe the program state, delivery situation, or area you want risk-scanned..."
            rows={4}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button onClick={run} disabled={loading || !scenario.trim()} variant="danger" style={{ background: loading ? undefined : 'var(--accent-red)' }}>
            {loading ? <Spinner size={14} /> : <Search size={14} />}
            {loading ? 'Scanning risks…' : 'Surface risks with AI'}
          </Button>
          {result && (
            <Button variant="ghost" size="sm" onClick={() => { setResult(''); setScenario(''); setParsedRisks([]); setPushSuccess(null); setPushError('') }}>
              Clear
            </Button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <Badge color="red">Risk Intelligence</Badge>
            <Badge color="amber">Governance</Badge>
          </div>
        </div>

        <ErrorBox message={error} />
        {renderOutput()}

        {parsedRisks.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Parsed Risks ({parsedRisks.length})
              </label>
              <Button
                onClick={pushToGitHub}
                disabled={pushingIssues}
                style={{ background: tokenReady ? 'var(--accent-green)' : 'var(--text-muted)' }}
              >
                {pushingIssues ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ExternalLink size={14} />}
                {pushingIssues ? `Pushing ${pushProgress.done}/${pushProgress.total}…` : tokenReady ? `Push ${parsedRisks.length} Risks to GitHub` : 'GitHub Token Not Set'}
              </Button>
            </div>

            {!tokenReady && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(245,166,35,0.08)',
                border: '1px solid rgba(245,166,35,0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
              }}>
                <AlertTriangle size={14} />
                <span>
                  <strong>VITE_GITHUB_TOKEN</strong> not configured. Add a <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>GitHub PAT</a> to your <code style={{ background: 'rgba(245,166,35,0.15)', padding: '1px 4px', borderRadius: '3px' }}>.env</code> file with <code style={{ background: 'rgba(245,166,35,0.15)', padding: '1px 4px', borderRadius: '3px' }}>repo</code> scope.
                </span>
              </div>
            )}

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}>
              {parsedRisks.map((risk, i) => {
                const hasRiskLabels = detectRiskLabels(risk.risk).length > 0
                return (
                  <div key={i} style={{
                    padding: '10px 14px',
                    borderBottom: i < parsedRisks.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: hasRiskLabels ? 'var(--accent-red)' : 'var(--text-muted)',
                      minWidth: '56px',
                      paddingTop: '2px',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {risk.id}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {risk.risk}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent-blue)' }}>{risk.category}</span>
                        <span>Owner: {risk.owner || '—'}</span>
                        {riskLevelBadge(risk.probability)}
                      </div>
                    </div>
                    {hasRiskLabels && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        background: 'rgba(255,77,106,0.08)',
                        color: 'var(--accent-red)',
                        border: '1px solid rgba(255,77,106,0.3)',
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
            border: '1px solid rgba(99,140,255,0.3)',
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
              {pushSuccess.length} GitHub issue{pushSuccess.length !== 1 ? 's' : ''} created successfully
            </div>
            <a
              href="https://github.com/msourial/GenoSync/issues"
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
              Open msourial/GenoSync issues →
            </a>
          </div>
        )}
      </Card>
    </div>
  )
}
