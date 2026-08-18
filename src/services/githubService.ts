export function getGitHubToken(): string {
  const localToken = typeof window !== 'undefined' ? localStorage.getItem('ai_dlc_github_token') : ''
  if (localToken && localToken.trim()) return localToken.trim()
  return (import.meta.env.VITE_GITHUB_TOKEN ?? '').trim()
}

export function setGitHubToken(token: string) {
  if (typeof window !== 'undefined') {
    if (token.trim()) {
      localStorage.setItem('ai_dlc_github_token', token.trim())
    } else {
      localStorage.removeItem('ai_dlc_github_token')
    }
  }
}

export function hasGitHubToken(): boolean {
  const token = getGitHubToken()
  return !!token && token !== 'YOUR_GITHUB_TOKEN_HERE'
}

export interface GitHubIssuePayload {
  title: string
  body: string
  labels: string[]
}

export interface GitHubIssueResponse {
  html_url: string
  number: number
  title: string
  state: string
}

const RISK_KEYWORDS = ['KMS', 'SRE', 'Compliance', 'Paxos', 'Custody', 'HSM', 'gate', 'audit', 'Security', 'Risk', 'Blocker', 'Auth', 'Performance', 'Sync', 'Failover', 'Vulnerability']

export function detectRiskLabels(body: string): string[] {
  const labels: string[] = []
  for (const kw of RISK_KEYWORDS) {
    if (body.includes(kw)) {
      labels.push('risk:critical', 'gate:compliance')
      break
    }
  }
  return labels
}

export function buildRiskWarningBanner(body: string): string {
  const hasRisk = detectRiskLabels(body).length > 0
  if (!hasRisk) return body
  const banner = [
    '<!-- RISK WARNING -->',
    '> **⚠️ Compliance / Infrastructure Risk Detected**',
    '> This task touches sensitive infrastructure.',
    '> Automated labels `risk:critical` and `gate:compliance` have been applied.',
    '> Review the mitigation requirements below before closing.',
    '',
    '---',
    '',
  ].join('\n')
  return banner + body
}

export async function createGitHubIssue(
  payload: GitHubIssuePayload,
  repoFullName: string = 'msourial/GenoSync'
): Promise<GitHubIssueResponse> {
  const token = getGitHubToken()
  if (!token || token === 'YOUR_GITHUB_TOKEN_HERE') {
    throw new Error('GitHub PAT is not set — click "Configure GitHub Token" to enter a Personal Access Token with repo scope.')
  }

  const apiBase = `https://api.github.com/repos/${repoFullName}`

  const res = await fetch(`${apiBase}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      title: payload.title,
      body: buildRiskWarningBanner(payload.body),
      labels: [...new Set([...payload.labels, ...detectRiskLabels(payload.body)])],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    if (res.status === 401) {
      throw new Error(`GitHub API Error 401: Invalid or expired GitHub Token ("Bad Credentials"). Please click "Configure Token" to update your GitHub PAT with "repo" scope.`)
    }
    throw new Error(`GitHub API error ${res.status}: ${errBody}`)
  }

  return res.json()
}

export type TaskBlock = {
  title: string
  body: string
  owner: string
  dependency: string
  risk: string
}

export function parseTasksFromDecomposition(output: string): TaskBlock[] {
  const tasks: TaskBlock[] = []
  const lines = output.split('\n')

  let current: Partial<TaskBlock> | null = null

  const taskHeaderRe = /^\[Task\s+\d+\.\d+\]\s+(.+)/i

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const headerMatch = line.match(taskHeaderRe)
    if (headerMatch) {
      if (current && current.title) {
        tasks.push(current as TaskBlock)
      }
      current = { title: headerMatch[1], body: line, owner: '', dependency: '', risk: '' }
      continue
    }

    if (!current) continue

    current.body += '\n' + line

    const ownerMatch = line.match(/Owner:\s*(.+)/i)
    if (ownerMatch) current.owner = ownerMatch[1].trim()

    const depMatch = line.match(/Dependency:\s*(.+)/i)
    if (depMatch) current.dependency = depMatch[1].trim()

    const riskMatch = line.match(/Risk:\s*(LOW|MED|HIGH|CRITICAL)/i)
    if (riskMatch) current.risk = riskMatch[1].toUpperCase()
  }

  if (current && current.title) {
    tasks.push(current as TaskBlock)
  }

  return tasks
}

export type RiskItem = {
  id: string
  category: string
  risk: string
  probability: string
  impact: string
  rootCause: string
  mitigation: string
  owner: string
  trigger: string
}

export function parseRiskReport(output: string): RiskItem[] {
  const items: RiskItem[] = []
  const blocks = output.split(/(?=Risk ID:\s*(CR|HR|MR)-\d+)/i)

  for (const block of blocks) {
    const idMatch = block.match(/Risk ID:\s*((CR|HR|MR)-\d+)/i)
    if (!idMatch) continue

    const extract = (re: RegExp) => {
      const m = block.match(re)
      return m ? m[1].trim() : ''
    }

    items.push({
      id: idMatch[1].toUpperCase(),
      category: extract(/Category:\s*(.+)/i),
      risk: extract(/Risk:\s*(.+)/i),
      probability: extract(/Probability:\s*(High|Med|Low)/i),
      impact: extract(/Impact:\s*(High|Med|Low)/i),
      rootCause: extract(/Root Cause:\s*(.+)/i),
      mitigation: extract(/Mitigation:\s*(.+)/i),
      owner: extract(/Owner:\s*(.+)/i),
      trigger: extract(/Trigger:\s*(.+)/i),
    })
  }

  return items
}

export type DepItem = {
  id: string
  fromTeam: string
  toTeam: string
  deliverable: string
  status: string
  due: string
  impact: string
  escalation: string
}

export function parseDependencyReport(output: string): DepItem[] {
  const items: DepItem[] = []
  const blocks = output.split(/(?=DEP-\d+)/)

  for (const block of blocks) {
    const idMatch = block.match(/^(DEP-\d+)/m)
    if (!idMatch) continue

    const extract = (re: RegExp) => {
      const m = block.match(re)
      return m ? m[1].trim() : ''
    }

    items.push({
      id: idMatch[1].toUpperCase(),
      fromTeam: extract(/From Team:\s*(.+)/i),
      toTeam: extract(/To Team:\s*(.+)/i),
      deliverable: extract(/Deliverable:\s*(.+)/i),
      status: extract(/Status:\s*(.+)/i),
      due: extract(/Due:\s*(.+)/i),
      impact: extract(/Impact if Late:\s*(.+)/i),
      escalation: extract(/Escalation Path:\s*(.+)/i),
    })
  }

  return items
}
