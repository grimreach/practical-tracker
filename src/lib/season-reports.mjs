function numberValue(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function dateValue(record) {
  const date = new Date(record?.date)
  return Number.isFinite(date.getTime()) ? date : null
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function monthKey(record) {
  const date = dateValue(record)
  if (!date) return 'Unknown'
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function quarterKey(record) {
  const date = dateValue(record)
  if (!date) return 'Unknown'
  return `${date.getUTCFullYear()} Q${Math.floor(date.getUTCMonth() / 3) + 1}`
}

function average(values) {
  const valid = values.map(Number).filter(Number.isFinite)
  if (valid.length === 0) return 0
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length)
}

function matchLabel(match) {
  return match?.matchName || match?.club || 'Untitled match'
}

function loadLabel(entry) {
  return entry?.ammoDescription || entry?.powder || entry?.bulletType || 'Chrono load'
}

function comparePeriodLabels(a, b) {
  if (a.period === 'Unknown') return 1
  if (b.period === 'Unknown') return -1
  return a.period.localeCompare(b.period)
}

/**
 * @param {{ matches?: Array<Record<string, any>>, expenses?: Array<Record<string, any>>, chronoEntries?: Array<Record<string, any>>, maintenanceLogs?: Array<Record<string, any>> }} input
 * @param {'month' | 'quarter'} [period]
 */
export function buildPeriodReports({ matches = [], expenses = [], chronoEntries = [], maintenanceLogs = [] } = {}, period = 'month') {
  const keyFor = period === 'quarter' ? quarterKey : monthKey
  const periods = new Map()

  function ensure(key) {
    if (!periods.has(key)) {
      periods.set(key, {
        period: key,
        matches: 0,
        rounds: 0,
        spend: 0,
        averagePercentile: 0,
        powerFactor: 0,
        maintenanceRounds: 0,
        _percentiles: [],
        _powerFactors: [],
      })
    }
    return periods.get(key)
  }

  for (const match of matches) {
    const report = ensure(keyFor(match))
    const rounds = numberValue(match.roundsUsed)
    report.matches += 1
    report.rounds += rounds
    report.spend += rounds * numberValue(match.ammoCostPerRound)
    if (match.percentile != null) report._percentiles.push(numberValue(match.percentile))
    if (match.powerFactor != null) report._powerFactors.push(numberValue(match.powerFactor))
  }

  for (const expense of expenses) {
    ensure(keyFor(expense)).spend += numberValue(expense.amount)
  }

  for (const entry of chronoEntries) {
    if (entry.powerFactor != null) ensure(keyFor(entry))._powerFactors.push(numberValue(entry.powerFactor))
  }

  for (const log of maintenanceLogs) {
    ensure(keyFor(log)).maintenanceRounds += numberValue(log.roundsFired)
  }

  return [...periods.values()]
    .map((report) => ({
      period: report.period,
      matches: report.matches,
      rounds: report.rounds,
      spend: roundCurrency(report.spend),
      averagePercentile: average(report._percentiles),
      powerFactor: average(report._powerFactors),
      maintenanceRounds: report.maintenanceRounds,
    }))
    .sort(comparePeriodLabels)
}

/**
 * @param {{ matches?: Array<Record<string, any>>, expenses?: Array<Record<string, any>>, chronoEntries?: Array<Record<string, any>> }} input
 */
export function buildSeasonReportCards({ matches = [], expenses = [], chronoEntries = [] } = {}) {
  const scoredMatches = matches.filter((match) => Number.isFinite(Number(match.percentile)))
  const bestMatch = [...scoredMatches].sort((a, b) => numberValue(b.percentile) - numberValue(a.percentile))[0] ?? null
  const worstMatch = [...scoredMatches].sort((a, b) => numberValue(a.percentile) - numberValue(b.percentile))[0] ?? null
  const monthly = buildPeriodReports({ matches, expenses, chronoEntries }, 'month')
  const mostExpensiveMonth = [...monthly].sort((a, b) => b.spend - a.spend)[0] ?? null
  const topLoad = [...chronoEntries]
    .filter((entry) => Number.isFinite(Number(entry.powerFactor)))
    .sort((a, b) => numberValue(b.powerFactor) - numberValue(a.powerFactor))[0] ?? null

  return {
    bestMatch: bestMatch
      ? {
          title: 'Best match',
          label: matchLabel(bestMatch),
          value: `${Math.round(numberValue(bestMatch.percentile))}%`,
          detail: `${numberValue(bestMatch.roundsUsed).toLocaleString()} rounds · ${bestMatch.club || 'No club'}`,
        }
      : null,
    worstMatch: worstMatch
      ? {
          title: 'Hardest match',
          label: matchLabel(worstMatch),
          value: `${Math.round(numberValue(worstMatch.percentile))}%`,
          detail: `${numberValue(worstMatch.roundsUsed).toLocaleString()} rounds · review notes and video`,
        }
      : null,
    mostExpensiveMonth: mostExpensiveMonth
      ? {
          title: 'Most expensive month',
          label: mostExpensiveMonth.period,
          value: `$${mostExpensiveMonth.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          detail: `${mostExpensiveMonth.matches} matches · ${mostExpensiveMonth.rounds.toLocaleString()} match rounds`,
        }
      : null,
    topLoad: topLoad
      ? {
          title: 'Top load',
          label: loadLabel(topLoad),
          value: `${numberValue(topLoad.powerFactor)} PF`,
          detail: `${numberValue(topLoad.avgVelocity).toLocaleString()} fps average velocity`,
        }
      : null,
  }
}

/**
 * @param {{ matches?: Array<Record<string, any>>, expenses?: Array<Record<string, any>>, chronoEntries?: Array<Record<string, any>>, maintenanceLogs?: Array<Record<string, any>> }} input
 */
export function buildTrendChartData(input = {}) {
  return buildPeriodReports(input, 'month').map((period) => ({
    period: period.period,
    Spend: period.spend,
    Rounds: period.rounds,
    Percentile: period.averagePercentile,
    PF: period.powerFactor,
    Maintenance: period.maintenanceRounds,
  }))
}
