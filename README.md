# AI-DLC Command Center
### Crypto Custody & Blockchain Program — AI-Centric Development Life Cycle

> A production-grade tool that operationalizes **AI-DLC** across a regulated crypto custody program — embedding GenAI into planning, risk surfacing, dependency tracking, and executive communication.

[![Built with Claude](https://img.shields.io/badge/Powered%20by-Claude%20Sonnet-blue?style=flat-square)](https://anthropic.com)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev)

---

## What is AI-DLC?

The **AI-Centric Development Life Cycle** embeds GenAI as the default accelerator across every phase of program delivery — not as an add-on, but as the operating model:

| Phase | Traditional | AI-DLC |
|-------|-------------|--------|
| Planning | Manual story refinement | AI-assisted decomposition & sequencing |
| Design | Async reviews | AI-augmented design docs + instant review |
| Risk | Weekly risk meetings | Continuous AI risk monitoring |
| Dependencies | Jira chasing | AI-flagged blocker detection |
| Reporting | PM compiles manually | AI-generated executive briefings |

---

## Modules

### 📋 Sprint Planner
Paste a program epic → AI decomposes it into sequenced tasks with owners, dependencies, risk flags, and specific AI acceleration opportunities. Built for crypto custody specifics: HSM integration, cold storage vaults, OFAC screening, key management.

### ⚠️ Risk Surfacer
Describe a delivery scenario → AI surfaces and categorizes risks (Technical, Security, Regulatory, Operational) with probability/impact scoring, mitigations, and escalation paths. References OCC, FINRA, SOC2, and OFAC frameworks.

### 📊 Executive Briefing Generator
Paste raw notes (Slack, Jira, standup bullets) → AI produces a Schwab-style executive update with outcomes, risk flags, decisions required, and program metrics. Audience-aware: C-Suite, Steering Committee, OCC/Regulator.

### 🔗 Dependency Tracker
List cross-team dependencies → AI maps them, identifies critical path, flags blockers, and designs AI agent monitors for continuous tracking across Crypto Custody, Blockchain Platform, SRE, Security, Legal, and Operations teams.

### 📈 AI-DLC Maturity Scorer
Answer 6 questions about current team practices → AI scores maturity across 6 AI-DLC dimensions and delivers a 90-day improvement roadmap with specific tools, actions, and success metrics.

---

## Tech Stack

- **Frontend**: React 18 + Vite
- **AI Engine**: OpenRouter API (`openai/gpt-4o-mini`) via the `chat/completions` endpoint
- **Data**: Live GitHub metadata, issues, and READMEs per selected repo
- **Styling**: Pure CSS with design tokens (dark-mode native)
- **No framework dependencies** beyond React + Lucide icons

---

## Setup

```bash
git clone https://github.com/msourial/ai-dlc-command-center
cd ai-dlc-command-center
npm install
npm run dev
```

Create a `.env` file (see `.env.example`) with your keys:

```env
# OpenRouter API key — https://openrouter.ai/settings/keys
VITE_OPENROUTER_API_KEY=sk-or-v1-...
# GitHub Personal Access Token with "repo" scope — https://github.com/settings/tokens
VITE_GITHUB_TOKEN=github_pat_...
```

> **Security note**: Keys prefixed with `VITE_` are compiled into the client bundle and visible in the browser. Use this demo only with throwaway/rotatable keys, and never commit real secrets. The GitHub token can also be entered at runtime via the **GitHub Token** button (stored in `localStorage`).

---

## Architecture

```
src/
├── App.jsx                    # Navigation + layout shell + GitHub repo syncing
├── hooks/
│   └── useClaudeAPI.js        # OpenRouter API client hook (gpt-4o-mini)
├── lib/
│   ├── projectDefaults.js     # Project-aware example epics/scenarios/deps
│   └── repoContext.js         # Builds "repository context" from live GitHub data
├── services/
│   └── githubService.ts       # GitHub issue creation, label sync, output parsers
└── components/
    ├── UI.jsx                 # Shared design system components
    ├── RepoDropdown.jsx       # Custom repo picker
    ├── TokenModal.jsx         # GitHub PAT configuration modal
    ├── SprintPlanner.jsx      # Module 1: AI sprint decomposition
    ├── RiskSurfacer.jsx       # Module 2: Risk intelligence engine
    ├── ExecBriefing.jsx       # Module 3: Executive briefing generator
    ├── DependencyTracker.jsx  # Module 4: Dependency map + AI monitors
    └── MaturityScorer.jsx     # Module 5: AI-DLC maturity assessment
```

---

## Why this matters for crypto custody programs

Schwab's crypto custody platform operates under strict regulatory oversight (OCC, SEC, FINRA) with zero tolerance for unplanned outages or compliance gaps. AI-DLC addresses the specific challenges of this environment:

- **Speed without risk**: AI-assisted planning compresses sprint ceremonies while improving dependency clarity
- **Proactive governance**: Risk surfacing catches regulatory gaps before they become audit findings
- **Reduced coordination overhead**: Dependency tracking frees engineers from status meetings
- **Executive confidence**: Consistent, AI-generated briefings give leadership real-time program visibility

---

*Built to demonstrate AI-DLC principles in practice. Every module maps directly to an accountability in the Schwab Crypto Technical Project Manager role.*
