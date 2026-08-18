// Project-aware default presets, scenarios, epics, and dependencies.
// Keeps the application grounded in the actual selected repository (GenoSync, Skyfall, etc.)

export function getRepoName(selectedRepo) {
  if (!selectedRepo) return 'Project'
  if (selectedRepo.includes('/')) {
    return selectedRepo.split('/')[1]
  }
  return selectedRepo
}

// Generate project-aware example epics for Sprint Planner
export function getProjectEpics(selectedRepo, repoInfo) {
  const name = getRepoName(selectedRepo)
  const desc = repoInfo?.description || `${name} development and release management`

  if (name.toLowerCase().includes('geno')) {
    return [
      `Epic: Implement ${name} real-time state synchronization engine with conflict resolution, automated retry gates, and TypeScript type-safe client SDK.`,
      `Epic: Build ${name} distributed caching pipeline, offline storage persistence, and WebSocket transport security controls.`,
      `Epic: Upgrade ${name} API gateway authentication, zero-downtime release automation, and SRE failover monitoring.`,
    ]
  } else if (name.toLowerCase().includes('skyfall')) {
    return [
      `Epic: Overhaul ${name} frontend UI design system, mobile-friendly layout architecture, and DevTools diagnostic integrations.`,
      `Epic: Optimize ${name} client bundle size, dynamic component code-splitting, and Web Vitals performance benchmarks.`,
      `Epic: Implement ${name} accessibility compliance (WCAG 2.1 AA), keyboard navigation flow, and automated UI visual regression testing.`,
    ]
  }

  return [
    `Epic: ${desc} — Core architecture refactoring, SRE automated testing gates, and API contract finalization.`,
    `Epic: ${name} pipeline security audit, OAuth token management, and infrastructure monitoring integration.`,
    `Epic: ${name} cross-service communication framework and automated continuous integration workflow.`,
  ]
}

// Generate project-aware delivery scenarios for Risk Surfacer
export function getProjectScenarios(selectedRepo) {
  const name = getRepoName(selectedRepo)

  if (name.toLowerCase().includes('geno')) {
    return [
      `${name} state synchronization engine throughput bottleneck — WebSocket payload serialization 30% behind schedule, high concurrency SLA at risk`,
      `${name} API authentication & security gate compliance review — OAuth2 refresh token rotation failing SRE disaster recovery failover test`,
      `${name} conflict resolution & offline storage sync — IndexedDB schema migration blocked by enterprise audit logging requirement`,
      `${name} SRE/KMS signing gate rollout — throughput bottleneck identified across multi-region sync node deployments`,
    ]
  } else if (name.toLowerCase().includes('skyfall')) {
    return [
      `${name} UI component library migration — responsive breakpoint layout testing 40% behind schedule, release milestone at risk`,
      `${name} bundle size & performance optimization — Webpack tree-shaking & code-splitting blocked by third-party vendor script`,
      `${name} browser DevTools diagnostic integration — memory leak surfacing gate failing performance audit for 2 consecutive runs`,
      `${name} accessibility & WCAG 2.1 compliance audit — keyboard navigation and screen reader tags incomplete for core dashboard views`,
    ]
  }

  return [
    `${name} core module upgrade window closing in 3 weeks — code migration 40% behind schedule, delivery SLA at risk`,
    `${name} API integration pipeline — security compliance gate not passed, SRE disaster recovery failover test failing`,
    `${name} architecture review — delegated parameter tuning blocked by enterprise compliance audit requirement`,
    `${name} enterprise SRE rollout — throughput bottleneck identified, requires simultaneous coordination across active nodes`,
  ]
}

// Generate project-aware status presets for Executive Briefing
export function getProjectStatusPresets(selectedRepo) {
  const name = getRepoName(selectedRepo)

  return [
    {
      label: 'On Track',
      value: `Sprint 14 of 22. ${name} core module upgrade completed on schedule — passed all unit test suites with 98% coverage. Ingestion pipeline deployed to staging. 4 of 6 planned milestones delivered. Security compliance gate approved by SRE. Team on track for Q3 enterprise go-live.`,
    },
    {
      label: 'At Risk',
      value: `Sprint 8 of 22. ${name} architecture approved but API v2 contract not finalized — 1.5 sprint delay to core sync logic. SRE failover test failed on throughput threshold (56% of required TPS). Security gate certification delayed awaiting environment verification.`,
    },
    {
      label: 'Off Track',
      value: `Sprint 16 of 22. Critical: ${name} core release blocked — 3 of 7 deployment environments have not ratified configuration changes. Key rotation caused a 4-hour staging outage. Performance benchmark failed for third consecutive run. Escalation to Steering Committee underway.`,
    },
  ]
}

// Generate project-aware cross-team dependencies for Dependency Tracker
export function getProjectDependencies(selectedRepo) {
  const name = getRepoName(selectedRepo)

  if (name.toLowerCase().includes('geno')) {
    return `${name} real-time sync team waiting on security code audit from external vendor — needed for node upgrade go-live, due Sprint 14
${name} WebSocket ingestion pipeline blocked by KMS key vault certification — 2 weeks delayed, SRE team awaiting infrastructure provisioning
${name} state persistence engine requires signed compliance attestation before cross-region node deployment — legal review in progress, no ETA
SRE/KMS signing gate depends on throughput benchmark completion — currently 3 weeks behind schedule
Enterprise compliance audit logging pipeline requires architecture sign-off from Security Lead — not yet scheduled
${name} conflict resolution logic depends on API v2 contract finalization — external dependency, unknown timeline`
  } else if (name.toLowerCase().includes('skyfall')) {
    return `${name} UI component team waiting on Design System token spec from UX team — needed for dashboard redesign, due Sprint 14
${name} bundle optimization pipeline blocked by third-party analytics script — 2 weeks delayed awaiting vendor patch
${name} DevTools diagnostic integration requires API telemetry payload spec — backend team review in progress, no ETA
Responsive UI layout gate depends on cross-browser automated visual regression suite — currently 2 weeks behind schedule
Accessibility (WCAG 2.1) audit requires formal sign-off from Design Standards Committee — not yet scheduled
${name} mobile navigation refactor depends on user authorization context refactor — blocking release gate`
  }

  return `${name} core development team waiting on security code audit from external vendor — needed for release go-live, due Sprint 14
${name} ingestion pipeline blocked by compliance certification — 2 weeks delayed, SRE team awaiting environment setup
${name} integration layer requires signed compliance attestation before deployment — legal review in progress, no ETA
SRE signing gate depends on throughput benchmark completion — currently 3 weeks behind schedule
Enterprise compliance audit logging pipeline requires architecture sign-off — not yet scheduled
${name} component reconciliation depends on API v2 contract finalization — external dependency, unknown timeline`
}
