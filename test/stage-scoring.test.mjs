import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildStageScoreSummary,
  calculateHitFactor,
  normalizeStageScore,
} from '../src/lib/stage-scoring.mjs'

test('calculates hit factor from scored points and stage time', () => {
  assert.equal(calculateHitFactor(118, 22.45), 5.256)
  assert.equal(calculateHitFactor(0, 22.45), 0)
  assert.equal(calculateHitFactor(118, 0), null)
})

test('normalizes rich stage scoring fields for API create/update payloads', () => {
  const normalized = normalizeStageScore({
    stageNum: 3,
    stageName: 'Speed option',
    points: 112,
    time: 21.74,
    penalties: 10,
    placement: 4,
    totalCompetitors: 28,
    classifier: true,
    youtubeUrl: 'https://youtu.be/example',
    notes: 'Alpha-heavy but one no-shoot penalty.',
  })

  assert.equal(normalized.score, 112)
  assert.equal(normalized.points, 112)
  assert.equal(normalized.hitFactor, 5.152)
  assert.equal(normalized.stagePlacement, 4)
  assert.equal(normalized.stageTotalCompetitors, 28)
  assert.equal(normalized.classifier, true)
})

test('builds stage score summary labels for the detail card', () => {
  const summary = buildStageScoreSummary({
    points: 112,
    time: 21.74,
    hitFactor: 5.152,
    penalties: 10,
    stagePlacement: 4,
    stageTotalCompetitors: 28,
    classifier: true,
  })

  assert.deepEqual(summary.metrics, [
    { label: 'Points', value: '112' },
    { label: 'Time', value: '21.74s' },
    { label: 'Hit factor', value: '5.152' },
    { label: 'Penalties', value: '10' },
  ])
  assert.deepEqual(summary.badges, ['4 / 28 stage finish', 'Classifier'])
})

test('falls back cleanly when rich stage score data is missing', () => {
  const summary = buildStageScoreSummary({})

  assert.deepEqual(summary.metrics, [
    { label: 'Points', value: '—' },
    { label: 'Time', value: '—' },
    { label: 'Hit factor', value: '—' },
    { label: 'Penalties', value: '0' },
  ])
  assert.deepEqual(summary.badges, ['Score details pending'])
})
