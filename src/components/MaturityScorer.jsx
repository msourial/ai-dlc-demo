import React, { useState } from 'react'
import { useClaudeAPI } from '../hooks/useClaudeAPI'
import { Activity, Check, Copy } from 'lucide-react'
import { Card, Button, Badge, SectionHeader, ErrorBox, Spinner } from './UI'
import { buildRepoContext } from '../lib/repoContext'

const SYSTEM_PROMPT = (repo) => `You are the AI-DLC Maturity Assessment Engine for software engineering teams.
Your job is to score a team's AI-DLC adoption maturity and provide a specific improvement roadmap.

Given team assessment responses, produce this EXACT output:

AI-DLC MATURITY ASSESSMENT
============================
Program: ${repo} Engineering
Assessment Date: Current Quarter

OVERALL MATURITY SCORE: [X.X / 5.0]
Maturity Level: [INITIATING (1-2) | DEVELOPING (2-3) | DEFINED (3-4) | OPTIMIZING (4-5)]

DIMENSION SCORES
================
┌──────────────────────────────────┬───────┬────────────────────────┐
│ Dimension                        │ Score │ Level                  │
├──────────────────────────────────┼───────┼────────────────────────┤
│ AI-Assisted Planning             │  X/5  │ [Level]               │
│ AI-Augmented Design & Docs       │  X/5  │ [Level]               │
│ Agent-Assisted Dev & Review      │  X/5  │ [Level]               │
│ AI Risk & Dependency Monitoring  │  X/5  │ [Level]               │
│ AI Executive Reporting           │  X/5  │ [Level]               │
│ GenAI Default Culture            │  X/5  │ [Level]               │
└──────────────────────────────────┴───────┴────────────────────────┘

STRENGTHS 💪
============
▸ [Strength 1 — specific]
▸ [Strength 2 — specific]
▸ [Strength 3 — specific]

GAPS TO ADDRESS 🎯
==================
▸ [Gap 1 — specific, actionable]
▸ [Gap 2 — specific, actionable]
▸ [Gap 3 — specific, actionable]

90-DAY IMPROVEMENT ROADMAP
===========================
SPRINT 1-2: [High-impact quick win]
  Action: [specific action]
  Tool: [specific AI tool or approach]
  Success Metric: [how you'll measure improvement]

SPRINT 3-4: [Second initiative]
  Action: [specific action]
  Tool: [specific AI tool or approach]
  Success Metric: [measurable outcome]

SPRINT 5-6: [Third initiative]
  Action: [specific action]
  Tool: [specific AI tool or approach]
  Success Metric: [measurable outcome]

TARGET STATE (90 days)
=======================
Projected Score: [X.X / 5.0]
Key Changes: [3 bullet points on what will be different]

BENCHMARK
=========
[Compare to where the ${repo} program should be targeting given the team relies on robust modern engineering practices]`

const QUESTIONS = [
  {
    id: 'planning',
    label: 'AI-Assisted Planning',
    question: 'How does your team currently use AI for sprint planning, backlog refinement, or story decomposition?',
    placeholder: 'e.g., We use ChatGPT to draft user stories but not in a structured way...',
  },
  {
    id: 'design',
    label: 'AI-Augmented Design & Docs',
    question: 'How does AI assist with architecture design, technical documentation, or design reviews?',
    placeholder: 'e.g., We sometimes use AI to write ADRs after the fact...',
  },
  {
    id: 'dev',
    label: 'Agent-Assisted Dev & Review',
    question: 'What AI tools do engineers use daily for coding, code review, or testing?',
    placeholder: 'e.g., Some engineers use GitHub Copilot, but it\'s not standardized...',
  },
  {
    id: 'risk',
    label: 'AI Risk & Dependency Monitoring',
    question: 'How does the team use AI to surface risks, track dependencies, or flag blockers proactively?',
    placeholder: 'e.g., We rely on manual Jira updates and weekly standups...',
  },
  {
    id: 'reporting',
    label: 'AI Executive Reporting',
    question: 'How are executive status updates, risk reports, and steering committee materials prepared?',
    placeholder: 'e.g., PM manually compiles from Confluence and Jira each week...',
  },
  {
    id: 'culture',
    label: 'GenAI Default Culture',
    question: 'Is GenAI the default first step for your team, or an occasional add-on?',
    placeholder: 'e.g., Some people use it, but it\'s not expected or measured...',
  },
]

export default function MaturityScorer({ selectedRepo, repoInfo, readme }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState('')
  const { call, loading, error } = useClaudeAPI()

  const repoName = selectedRepo ? (selectedRepo.split('/')[1] || selectedRepo) : (repoInfo?.fullName || repoInfo?.name || 'Repository')

  const setAnswer = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }))

  const answeredCount = Object.values(answers).filter(v => v.trim()).length

  const run = async () => {
    const compiled = QUESTIONS.map(q =>
      `${q.label}:\nQuestion: ${q.question}\nAnswer: ${answers[q.id] || '(not answered)'}`
    ).join('\n\n')
    const context = buildRepoContext(repoInfo, null, readme)
    const output = await call(
      SYSTEM_PROMPT(repoName),
      `${context}Team assessment responses:\n\n${compiled}`
    )
    if (output) setResult(output)
  }

  const scoreMatch = result.match(/OVERALL MATURITY SCORE:\s*([\d.]+)\s*\/\s*5/)
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : null

  return (
    <div>
      <SectionHeader
        icon={<Activity size={20} />}
        title="AI-DLC Maturity Scorer"
        subtitle="Answer 6 questions about your team's current practices — AI scores your AI-DLC maturity and builds a 90-day improvement roadmap."
      />

      <Card>
        {!result ? (
          <>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              {QUESTIONS.map((q, i) => (
                <div key={q.id} style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${answers[q.id]?.trim() ? 'rgba(0,208,132,0.25)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  transition: 'border-color 0.2s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: answers[q.id]?.trim() ? 'var(--accent-green)' : 'var(--bg-input)',
                      border: `1px solid ${answers[q.id]?.trim() ? 'var(--accent-green)' : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#fff',
                      flexShrink: 0,
                      fontWeight: 700,
                    }}>
                      {answers[q.id]?.trim() ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {q.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>
                    {q.question}
                  </p>
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={e => setAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    rows={2}
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button onClick={run} disabled={loading || answeredCount < 3}>
                {loading ? <Spinner size={14} /> : <Activity size={14} />}
                {loading ? 'Scoring maturity…' : `Score AI-DLC maturity (${answeredCount}/6 answered)`}
              </Button>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <Badge color="green">Maturity Model</Badge>
                <Badge color="blue">90-day roadmap</Badge>
              </div>
            </div>
            {answeredCount < 3 && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Answer at least 3 dimensions to run the assessment.
              </p>
            )}
          </>
        ) : (
          <>
            {score && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '16px 20px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
              }}>
                <div style={{ textAlign: 'center', minWidth: '80px' }}>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 700,
                    color: score >= 4 ? 'var(--accent-green)' : score >= 3 ? 'var(--accent-blue)' : score >= 2 ? 'var(--accent-amber)' : 'var(--accent-red)',
                    lineHeight: 1,
                  }}>
                    {score.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>out of 5.0</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: '8px',
                    background: 'var(--bg-input)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(score / 5) * 100}%`,
                      background: score >= 4 ? 'var(--accent-green)' : score >= 3 ? 'var(--accent-blue)' : score >= 2 ? 'var(--accent-amber)' : 'var(--accent-red)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>Initiating</span><span>Developing</span><span>Defined</span><span>Optimizing</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent-green)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px 20px',
              fontSize: '12.5px',
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-mono)',
              maxHeight: '560px',
              overflowY: 'auto',
            }}>
              {result}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <Button variant="secondary" size="sm" onClick={() => { setResult(''); }}>
                ← Reassess
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(result)}>
                <Copy size={14} /> Copy report
              </Button>
            </div>
          </>
        )}

        <ErrorBox message={error} />
      </Card>
    </div>
  )
}
