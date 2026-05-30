import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildPeriodReports,
  buildSeasonReportCards,
  buildTrendChartData,
} from '../src/lib/season-reports.mjs'

const matches = [
  { id: 'm1', date: '2026-01-15T00:00:00.000Z', club: 'Alpha', matchName: 'January USPSA', percentile: 80, roundsUsed: 120, ammoCostPerRound: 0.25, powerFactor: 130 },
  { id: 'm2', date: '2026-01-28T00:00:00.000Z', club: 'Beta', matchName: 'January Steel', percentile: 60, roundsUsed: 80, ammoCostPerRound: 0.30, powerFactor: 128 },
  { id: 'm3', date: '2026-02-10T00:00:00.000Z', club: 'Gamma', matchName: 'February Major', percentile: 92, roundsUsed: 160, ammoCostPerRound: 0.27, powerFactor: 134 },
]

const expenses = [
  { id: 'e1', date: '2026-01-02T00:00:00.000Z', amount: 70 },
  { id: 'e2', date: '2026-02-06T00:00:00.000Z', amount: 250 },
]

const chronoEntries = [
  { id: 'c1', date: '2026-01-20T00:00:00.000Z', ammoDescription: '147gr coated', avgVelocity: 890, powerFactor: 131 },
  { id: 'c2', date: '2026-02-15T00:00:00.000Z', ammoDescription: '124gr match', avgVelocity: 1100, powerFactor: 136 },
]

const maintenanceLogs = [
  { id: 'l1', date: '2026-01-31T00:00:00.000Z', roundsFired: 200 },
  { id: 'l2', date: '2026-02-28T00:00:00.000Z', roundsFired: 160 },
]

test('builds monthly reports for spend, rounds, percentile, PF, and maintenance intervals', () => {
  const reports = buildPeriodReports({ matches, expenses, chronoEntries, maintenanceLogs })

  assert.deepEqual(reports, [
    { period: '2026-01', matches: 2, rounds: 200, spend: 124, averagePercentile: 70, powerFactor: 130, maintenanceRounds: 200 },
    { period: '2026-02', matches: 1, rounds: 160, spend: 293.2, averagePercentile: 92, powerFactor: 135, maintenanceRounds: 160 },
  ])
})

test('builds quarterly reports from the same season data', () => {
  const reports = buildPeriodReports({ matches, expenses, chronoEntries, maintenanceLogs }, 'quarter')

  assert.deepEqual(reports, [
    { period: '2026 Q1', matches: 3, rounds: 360, spend: 417.2, averagePercentile: 77, powerFactor: 132, maintenanceRounds: 360 },
  ])
})

test('surfaces best, hardest, most expensive, and top load report cards', () => {
  const cards = buildSeasonReportCards({ matches, expenses, chronoEntries })

  assert.equal(cards.bestMatch.label, 'February Major')
  assert.equal(cards.bestMatch.value, '92%')
  assert.equal(cards.worstMatch.label, 'January Steel')
  assert.equal(cards.mostExpensiveMonth.label, '2026-02')
  assert.equal(cards.mostExpensiveMonth.value, '$293.20')
  assert.equal(cards.topLoad.label, '124gr match')
  assert.equal(cards.topLoad.value, '136 PF')
})

test('formats trend chart data with display-friendly keys', () => {
  const chart = buildTrendChartData({ matches, expenses, chronoEntries, maintenanceLogs })

  assert.deepEqual(Object.keys(chart[0]), ['period', 'Spend', 'Rounds', 'Percentile', 'PF', 'Maintenance'])
  assert.equal(chart[1].Spend, 293.2)
})
