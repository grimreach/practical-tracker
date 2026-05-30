import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildMaintenanceRoundSource,
  buildSeasonOverview,
  formatMaintenanceSignal,
  getRecentVideoStages,
} from '../src/lib/season-overview.mjs'

const matches = [
  {
    id: 'match-1',
    date: '2026-05-20T00:00:00.000Z',
    club: 'North Texas Practical Shooters',
    matchName: 'May USPSA',
    discipline: 'USPSA',
    percentile: 82,
    roundsUsed: 140,
    ammoCostPerRound: 0.24,
    powerFactor: 132,
    stages: [
      { id: 'stage-1', stageNum: 1, stageName: 'Fast Lane', youtubeUrl: 'https://youtu.be/abc', notes: 'Clean run' },
      { id: 'stage-2', stageNum: 2, stageName: 'No Video', youtubeUrl: null, notes: null },
    ],
  },
  {
    id: 'match-2',
    date: '2026-04-10T00:00:00.000Z',
    club: 'Steel Night',
    matchName: null,
    discipline: 'SCSA',
    percentile: 64,
    roundsUsed: 90,
    ammoCostPerRound: 0.22,
    powerFactor: 128,
    stages: [{ id: 'stage-3', stageNum: 3, stageName: 'Smoke & Hope', youtubeUrl: 'https://youtu.be/def', notes: null }],
  },
  {
    id: 'match-3',
    date: '2026-03-02T00:00:00.000Z',
    club: 'Local Club',
    matchName: 'Classifier',
    discipline: 'USPSA',
    percentile: null,
    roundsUsed: 80,
    ammoCostPerRound: 0.25,
    powerFactor: null,
    stages: [],
  },
]

const expenses = [
  { id: 'expense-1', date: '2026-05-01T00:00:00.000Z', amount: 125, category: 'MATCH_FEES', item: 'Match bundle' },
  { id: 'expense-2', date: '2026-04-01T00:00:00.000Z', amount: 300, category: 'AMMO', item: '9mm ammo' },
]

const maintenance = [
  {
    id: 'maintenance-1',
    date: '2026-05-22T00:00:00.000Z',
    action: 'Post-match inspection',
    roundsFired: 140,
    totalRoundsSinceClean: 725,
    lifetimeRounds: 3725,
  },
]

test('builds the signed-in season overview metrics from matches, expenses, chrono, and maintenance', () => {
  const overview = buildSeasonOverview({
    matches,
    expenses,
    chronoEntries: [{ id: 'chrono-1', date: '2026-05-18T00:00:00.000Z', powerFactor: 131 }],
    maintenanceLogs: maintenance,
  })

  assert.equal(overview.matchesShot, 3)
  assert.equal(overview.totalRounds, 310)
  assert.equal(overview.totalSpend, 498.4)
  assert.equal(overview.averagePercentile, 73)
  assert.equal(overview.currentPowerFactor, 131)
  assert.equal(overview.maintenanceSignal.tone, 'watchlist')
  assert.equal(overview.maintenanceSignal.label, 'Watchlist')
  assert.deepEqual(overview.recentMatches.map((match) => match.id), ['match-1', 'match-2', 'match-3'])
})

test('surfaces recent stages with video in newest match order', () => {
  const stages = getRecentVideoStages(matches, 2)

  assert.deepEqual(stages.map((stage) => stage.id), ['stage-1', 'stage-3'])
  assert.equal(stages[0].matchLabel, 'May USPSA')
  assert.equal(stages[1].matchLabel, 'Steel Night')
})

test('recommends next actions based on missing and stale shooter data', () => {
  const overview = buildSeasonOverview({
    matches: [{ ...matches[0], stages: [] }],
    expenses: [],
    chronoEntries: [],
    maintenanceLogs: [{ ...maintenance[0], totalRoundsSinceClean: 1200 }],
  })

  assert.deepEqual(overview.nextActions.map((action) => action.title), [
    'Service due before the next match',
    'Add a chrono string',
    'Attach stage video',
  ])
})

test('formats maintenance signals at healthy, watchlist, and due thresholds', () => {
  assert.equal(formatMaintenanceSignal(null).label, 'No data')
  assert.equal(formatMaintenanceSignal({ totalRoundsSinceClean: 250 }).tone, 'healthy')
  assert.equal(formatMaintenanceSignal({ totalRoundsSinceClean: 650 }).tone, 'watchlist')
  assert.equal(formatMaintenanceSignal({ totalRoundsSinceClean: 1000 }).tone, 'due')
})

test('uses match round counts after the latest maintenance log to drive service reminders', () => {
  const roundSource = buildMaintenanceRoundSource(
    [
      { id: 'old-match', date: '2026-05-01T00:00:00.000Z', roundsUsed: 400 },
      { id: 'new-match', date: '2026-05-30T00:00:00.000Z', roundsUsed: 325 },
    ],
    [{ id: 'service', date: '2026-05-15T00:00:00.000Z', totalRoundsSinceClean: 500 }],
  )

  assert.equal(roundSource.totalRoundsSinceClean, 825)
  assert.equal(roundSource.source, 'match-rounds')
  assert.equal(formatMaintenanceSignal(roundSource).tone, 'watchlist')
})

test('falls back to total match rounds when no maintenance log exists yet', () => {
  const overview = buildSeasonOverview({
    matches: [
      { id: 'match-a', date: '2026-05-10T00:00:00.000Z', roundsUsed: 600, ammoCostPerRound: 0.25, stages: [] },
      { id: 'match-b', date: '2026-05-20T00:00:00.000Z', roundsUsed: 450, ammoCostPerRound: 0.25, stages: [] },
    ],
    expenses: [],
    chronoEntries: [{ id: 'chrono', date: '2026-05-18T00:00:00.000Z', powerFactor: 130 }],
    maintenanceLogs: [],
  })

  assert.equal(overview.maintenanceSignal.tone, 'due')
  assert.equal(overview.maintenanceSignal.roundsSinceClean, 1050)
  assert.equal(overview.maintenanceSignal.source, 'match-rounds')
})
