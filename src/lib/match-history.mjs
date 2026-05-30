/**
 * Match history helpers are intentionally framework-free so they can be tested with node:test.
 */

export const MATCH_SORTS = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  percentile: 'Best percentile',
  rounds: 'Most rounds',
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase()
}

function matchSearchText(match) {
  return [
    match.matchName,
    match.club,
    match.discipline,
    match.division,
    match.tier,
    match.notes,
    ...(match.stages ?? []).flatMap((stage) => [stage.stageName, stage.notes, stage.youtubeUrl]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function dateValue(match) {
  return new Date(match.date).getTime()
}

function compareNullableNumberDesc(a, b, fallback = 0) {
  return (b ?? fallback) - (a ?? fallback)
}

export function filterAndSortMatches(matches, filters) {
  const query = normalize(filters.query)

  return [...matches]
    .filter((match) => {
      const matchesQuery = !query || matchSearchText(match).includes(query)
      const matchesDiscipline = filters.discipline === 'ALL' || match.discipline === filters.discipline
      const matchesTier = filters.tier === 'ALL' || match.tier === filters.tier
      return matchesQuery && matchesDiscipline && matchesTier
    })
    .sort((a, b) => {
      if (filters.sort === 'oldest') return dateValue(a) - dateValue(b)
      if (filters.sort === 'percentile') {
        return compareNullableNumberDesc(a.percentile, b.percentile) || dateValue(b) - dateValue(a)
      }
      if (filters.sort === 'rounds') return b.roundsUsed - a.roundsUsed || dateValue(b) - dateValue(a)
      return dateValue(b) - dateValue(a)
    })
}

export function getMatchFilterSummary(visibleCount, totalCount, filters) {
  const active = []
  const query = filters.query.trim()

  if (query) active.push(`search “${query}”`)
  if (filters.discipline !== 'ALL') active.push(filters.discipline)
  if (filters.tier !== 'ALL') active.push(filters.tier)

  if (active.length === 0) return `${totalCount} ${totalCount === 1 ? 'match' : 'matches'} logged`

  return `${visibleCount} of ${totalCount} matches visible · ${active.join(' · ')}`
}
