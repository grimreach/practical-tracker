function numberValue(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function sortByNewest(records) {
  return [...(records ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value)))
  if (valid.length === 0) return 0
  return Math.round(valid.reduce((sum, value) => sum + Number(value), 0) / valid.length)
}

export function formatMaintenanceSignal(log) {
  if (!log) {
    return {
      label: 'No data',
      tone: 'empty',
      detail: 'Log a cleaning or inspection to start maintenance tracking.',
      roundsSinceClean: 0,
    }
  }

  const roundsSinceClean = numberValue(log.totalRoundsSinceClean)
  if (roundsSinceClean >= 1000) {
    return {
      label: 'Service due',
      tone: 'due',
      detail: `${roundsSinceClean.toLocaleString()} rounds since clean. Schedule service before the next match.`,
      roundsSinceClean,
    }
  }

  if (roundsSinceClean >= 600) {
    return {
      label: 'Watchlist',
      tone: 'watchlist',
      detail: `${roundsSinceClean.toLocaleString()} rounds since clean. Inspect wear parts soon.`,
      roundsSinceClean,
    }
  }

  return {
    label: 'Healthy',
    tone: 'healthy',
    detail: `${roundsSinceClean.toLocaleString()} rounds since clean. No immediate maintenance signal.`,
    roundsSinceClean,
  }
}

function matchDisplayName(match) {
  return match.matchName || match.club || 'Untitled match'
}

export function getRecentVideoStages(matches, limit = 3) {
  return sortByNewest(matches)
    .flatMap((match) =>
      [...(match.stages ?? [])]
        .filter((stage) => Boolean(stage.youtubeUrl))
        .sort((a, b) => numberValue(a.stageNum) - numberValue(b.stageNum))
        .map((stage) => ({
          ...stage,
          matchId: match.id,
          matchLabel: matchDisplayName(match),
          matchDate: match.date,
          club: match.club,
        })),
    )
    .slice(0, limit)
}

/**
 * @param {{
 *   matches?: Array<Record<string, any>>,
 *   expenses?: Array<Record<string, any>>,
 *   chronoEntries?: Array<Record<string, any>>,
 *   maintenanceLogs?: Array<Record<string, any>>,
 * }} input
 */
export function buildSeasonOverview({ matches = [], expenses = [], chronoEntries = [], maintenanceLogs = [] }) {
  const recentMatches = sortByNewest(matches).slice(0, 3)
  const latestChrono = sortByNewest(chronoEntries)[0] ?? null
  const latestMaintenance = sortByNewest(maintenanceLogs)[0] ?? null
  const totalMatchAmmoSpend = matches.reduce(
    (sum, match) => sum + numberValue(match.roundsUsed) * numberValue(match.ammoCostPerRound),
    0,
  )
  const totalExpenseSpend = expenses.reduce((sum, expense) => sum + numberValue(expense.amount), 0)
  const recentVideoStages = getRecentVideoStages(matches, 3)
  const maintenanceSignal = formatMaintenanceSignal(latestMaintenance)

  const nextActions = []
  if (maintenanceSignal.tone === 'due') {
    nextActions.push({
      title: 'Service due before the next match',
      detail: maintenanceSignal.detail,
      priority: 'high',
    })
  }
  if (!latestChrono) {
    nextActions.push({
      title: 'Add a chrono string',
      detail: 'Capture current load velocity and power factor before relying on match PF.',
      priority: 'medium',
    })
  }
  if (recentVideoStages.length === 0 && matches.length > 0) {
    nextActions.push({
      title: 'Attach stage video',
      detail: 'Add YouTube links to recent stages so review is tied to match notes.',
      priority: 'medium',
    })
  }
  if (expenses.length === 0) {
    nextActions.push({
      title: 'Log recent spend',
      detail: 'Add match fees, ammo, parts, or travel so season cost stays honest.',
      priority: 'low',
    })
  }
  if (nextActions.length === 0) {
    nextActions.push({
      title: 'Review the latest match pattern',
      detail: 'Compare recent stage notes against your spend, PF, and maintenance signals.',
      priority: 'low',
    })
  }

  return {
    matchesShot: matches.length,
    totalRounds: matches.reduce((sum, match) => sum + numberValue(match.roundsUsed), 0),
    totalSpend: roundCurrency(totalMatchAmmoSpend + totalExpenseSpend),
    averagePercentile: average(matches.map((match) => match.percentile).filter((value) => value != null)),
    currentPowerFactor: latestChrono?.powerFactor ?? recentMatches.find((match) => match.powerFactor != null)?.powerFactor ?? 0,
    maintenanceSignal,
    recentMatches,
    recentVideoStages,
    nextActions: nextActions.slice(0, 3),
  }
}
