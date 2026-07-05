// Build a "Repository context" block from live GitHub data (metadata, README,
// recent issues) to inject into AI prompts. Keeping the model grounded in the
// actual repo it's analyzing stops it from hallucinating generic content.
//
// `readme` is expected to already be truncated by the caller (see App.jsx).
export function buildRepoContext(repoInfo, repoData, readme) {
  const parts = []
  if (repoInfo && (repoInfo.fullName || repoInfo.description)) {
    const head = repoInfo.fullName || repoInfo.name || 'the repository'
    parts.push(`Repository: ${head}` + (repoInfo.description ? ` — ${repoInfo.description}` : ''))
  }
  if (readme) parts.push(`README excerpt:\n${readme}`)
  if (repoData && repoData.length) {
    parts.push(`Recent issues:\n${repoData
      .map(i => `- #${i.number}: ${i.title}`)
      .join('\n')}`)
  }
  if (!parts.length) return ''
  return `Repository context (pulled from GitHub):\n${parts.join('\n\n')}\n\n`
}
