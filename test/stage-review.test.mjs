import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getStageReviewDetails,
  getStageVideoStatus,
} from '../src/lib/stage-review.mjs'

const match = {
  id: 'match-1',
  date: '2026-05-29T00:00:00.000Z',
  club: 'Oak Hill',
  matchName: 'May USPSA',
  roundsUsed: 142,
  powerFactor: 132,
  pfType: null,
  notes: 'Classifier felt good, dropped points on stage 3.',
}

const stage = {
  id: 'stage-1',
  stageNum: 1,
  stageName: 'Classifier stage',
  youtubeUrl: 'https://youtu.be/abc123',
  notes: 'Two makeups on steel. Reload was late but movement was clean.',
}

test('builds stage review details for display around the YouTube hero card', () => {
  const details = getStageReviewDetails(stage, match, { index: 0, totalStages: 4 })

  assert.equal(details.eyebrow, 'Stage 1 of 4')
  assert.equal(details.title, 'Classifier stage')
  assert.equal(details.matchContext, 'May USPSA · Oak Hill')
  assert.equal(details.dateLabel, 'May 29, 2026')
  assert.equal(details.roundsLabel, '142 match rounds')
  assert.equal(details.powerFactorLabel, 'PF 132')
  assert.equal(details.notesTitle, 'Stage notes')
  assert.equal(details.notes, 'Two makeups on steel. Reload was late but movement was clean.')
  assert.equal(details.videoStatus.label, 'Video attached')
})

test('falls back gracefully when stage name, notes, or video are missing', () => {
  const details = getStageReviewDetails({ id: 'stage-2', stageNum: 2, stageName: null, youtubeUrl: null, notes: null }, match, {
    index: 1,
    totalStages: 4,
  })

  assert.equal(details.eyebrow, 'Stage 2 of 4')
  assert.equal(details.title, 'Stage 2')
  assert.equal(details.notesTitle, 'Match notes')
  assert.equal(details.notes, match.notes)
  assert.equal(details.videoStatus.label, 'No video yet')
})

test('classifies YouTube card video states', () => {
  assert.deepEqual(getStageVideoStatus('https://youtu.be/abc123'), {
    label: 'Video attached',
    tone: 'ready',
  })
  assert.deepEqual(getStageVideoStatus(null), {
    label: 'No video yet',
    tone: 'empty',
  })
})
