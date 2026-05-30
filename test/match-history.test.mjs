import assert from 'node:assert/strict'
import test from 'node:test'

import {
  filterAndSortMatches,
  getMatchFilterSummary,
} from '../src/lib/match-history.mjs'

const matches = [
  {
    id: 'local-pcc',
    date: '2026-05-10T12:00:00.000Z',
    club: 'Oak Hill Practical Shooters',
    matchName: 'May USPSA',
    discipline: 'USPSA',
    division: 'PCC',
    tier: 'LOCAL',
    placement: 4,
    totalCompetitors: 37,
    percentile: 89,
    roundsUsed: 142,
    ammoCostPerRound: 0.24,
    powerFactor: 132,
    pfType: 'Minor',
    dq: false,
    notes: 'Classifier felt strong',
    stages: [{ stageName: 'Accelerator', notes: 'Clean run' }],
  },
  {
    id: 'major-co',
    date: '2026-04-01T12:00:00.000Z',
    club: 'River Bend',
    matchName: 'State Championship',
    discipline: 'USPSA',
    division: 'Carry Optics',
    tier: 'TIER2',
    placement: 18,
    totalCompetitors: 144,
    percentile: 88,
    roundsUsed: 286,
    ammoCostPerRound: 0.31,
    powerFactor: 129,
    pfType: 'Minor',
    dq: false,
    notes: 'Video on every stage',
    stages: [{ stageName: 'Standards', notes: 'Late reload' }],
  },
  {
    id: 'steel-open',
    date: '2026-05-20T12:00:00.000Z',
    club: 'Metro Steel',
    matchName: null,
    discipline: 'SCSA',
    division: 'Open',
    tier: 'LOCAL',
    placement: 1,
    totalCompetitors: 12,
    percentile: 92,
    roundsUsed: 90,
    ammoCostPerRound: 0.2,
    powerFactor: null,
    pfType: null,
    dq: false,
    notes: null,
    stages: [],
  },
]

test('filters matches by query across match, club, notes, and stage details', () => {
  const result = filterAndSortMatches(matches, {
    query: 'late reload',
    discipline: 'ALL',
    tier: 'ALL',
    sort: 'newest',
  })

  assert.deepEqual(result.map((match) => match.id), ['major-co'])
})

test('filters matches by discipline and tier together', () => {
  const result = filterAndSortMatches(matches, {
    query: '',
    discipline: 'USPSA',
    tier: 'LOCAL',
    sort: 'newest',
  })

  assert.deepEqual(result.map((match) => match.id), ['local-pcc'])
})

test('sorts by newest, oldest, percentile, and rounds', () => {
  assert.deepEqual(
    filterAndSortMatches(matches, { query: '', discipline: 'ALL', tier: 'ALL', sort: 'newest' }).map(
      (match) => match.id,
    ),
    ['steel-open', 'local-pcc', 'major-co'],
  )

  assert.deepEqual(
    filterAndSortMatches(matches, { query: '', discipline: 'ALL', tier: 'ALL', sort: 'oldest' }).map(
      (match) => match.id,
    ),
    ['major-co', 'local-pcc', 'steel-open'],
  )

  assert.deepEqual(
    filterAndSortMatches(matches, { query: '', discipline: 'ALL', tier: 'ALL', sort: 'percentile' }).map(
      (match) => match.id,
    ),
    ['steel-open', 'local-pcc', 'major-co'],
  )

  assert.deepEqual(
    filterAndSortMatches(matches, { query: '', discipline: 'ALL', tier: 'ALL', sort: 'rounds' }).map(
      (match) => match.id,
    ),
    ['major-co', 'local-pcc', 'steel-open'],
  )
})

test('summarizes active filters in shooter-friendly copy', () => {
  assert.equal(
    getMatchFilterSummary(2, 7, { query: 'pcc', discipline: 'USPSA', tier: 'LOCAL', sort: 'newest' }),
    '2 of 7 matches visible · search “pcc” · USPSA · LOCAL',
  )

  assert.equal(
    getMatchFilterSummary(7, 7, { query: '', discipline: 'ALL', tier: 'ALL', sort: 'newest' }),
    '7 matches logged',
  )
})
