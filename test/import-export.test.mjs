import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildExportSummary,
  buildPractiscoreCsvImportPlan,
  parsePractiscoreCsvPreview,
  validateImportPreviewPayload,
} from '../src/lib/import-export.mjs'

const exportPayload = {
  app: 'practical-tracker',
  version: '0.12.0',
  exportedAt: '2026-05-30T00:00:00.000Z',
  workflow: 'export-v1',
  data: {
    guns: [{ id: 'gun-1' }],
    matches: [{ id: 'match-1' }, { id: 'match-2' }],
    expenses: [{ id: 'expense-1' }],
    chronoEntries: [],
    maintenanceLogs: [{ id: 'maintenance-1' }],
  },
}

const practiscoreCsv = [
  'Match Name,Date,Club,Division,Class,Place,Percent,Points,Time,Hit Factor,Stage Name,Stage Number,Stage Place,Total Competitors',
  'Snowcap Steel,2026-05-12,North Range,PCC,B,3,87.5,480,92.35,5.198,Smoke & Hope,1,5,44',
  'Snowcap Steel,2026-05-12,North Range,PCC,B,3,87.5,460,88.10,5.221,Outer Limits,2,4,44',
].join('\n')

test('summarizes Practical Tracker export payloads without mutating user data', () => {
  assert.deepEqual(buildExportSummary(exportPayload), {
    workflow: 'export-v1',
    exportedAt: '2026-05-30T00:00:00.000Z',
    version: '0.12.0',
    counts: {
      guns: 1,
      matches: 2,
      expenses: 1,
      chronoEntries: 0,
      maintenanceLogs: 1,
    },
  })
})

test('accepts valid export files for import preview', () => {
  const preview = validateImportPreviewPayload(exportPayload)

  assert.equal(preview.success, true)
  assert.equal(preview.summary.counts.matches, 2)
})

test('rejects non-Practical Tracker and unsupported import files', () => {
  assert.equal(validateImportPreviewPayload({ app: 'other', workflow: 'export-v1', data: {} }).success, false)
  assert.equal(validateImportPreviewPayload({ app: 'practical-tracker', workflow: 'legacy', data: {} }).success, false)
  assert.equal(validateImportPreviewPayload({ app: 'practical-tracker', workflow: 'export-v1' }).success, false)
})

test('previews PractiScore CSV rows without mutating user data', () => {
  const preview = parsePractiscoreCsvPreview(practiscoreCsv)

  assert.equal(preview.success, true)
  assert.equal(preview.summary.workflow, 'practiscore-csv-v1')
  assert.equal(preview.summary.counts.rows, 2)
  assert.equal(preview.summary.counts.matches, 1)
  assert.equal(preview.summary.counts.stages, 2)
  assert.equal(preview.summary.matches[0].name, 'Snowcap Steel')
  assert.equal(preview.summary.matches[0].stageCount, 2)
  assert.deepEqual(preview.summary.matches[0].detectedFields, [
    'division',
    'class',
    'place',
    'percent',
    'points',
    'time',
    'hitFactor',
  ])
})

test('accepts PractiScore CSV import preview payloads', () => {
  const preview = validateImportPreviewPayload({
    app: 'practical-tracker',
    workflow: 'practiscore-csv-v1',
    csv: 'Match Name,Date,Stage Name\nClassifier Night,2026-05-01,CM 99-11',
  })

  assert.equal(preview.success, true)
  assert.equal(preview.summary.counts.rows, 1)
  assert.equal(preview.summary.matches[0].name, 'Classifier Night')
})

test('rejects PractiScore CSV preview files without match rows', () => {
  const preview = parsePractiscoreCsvPreview('Match Name,Date,Stage Name\n')

  assert.equal(preview.success, false)
  assert.match(preview.error, /at least one data row/)
})

test('builds a confirm/apply PractiScore import plan with match and stage payloads', () => {
  const plan = buildPractiscoreCsvImportPlan(practiscoreCsv)

  assert.equal(plan.success, true)
  assert.equal(plan.plan.mode, 'confirm-apply')
  assert.equal(plan.plan.counts.createMatches, 1)
  assert.equal(plan.plan.counts.skipDuplicates, 0)
  assert.equal(plan.plan.actions[0].action, 'create-match')

  const payload = plan.plan.actions[0].payload
  assert.equal(payload.date, '2026-05-12')
  assert.equal(payload.club, 'North Range')
  assert.equal(payload.matchName, 'Snowcap Steel')
  assert.equal(payload.discipline, 'USPSA')
  assert.equal(payload.division, 'PCC')
  assert.equal(payload.placement, 3)
  assert.equal(payload.totalCompetitors, 44)
  assert.equal(payload.stages.length, 2)
  assert.deepEqual(payload.stages[0], {
    stageNum: 1,
    stageName: 'Smoke & Hope',
    score: 480,
    points: 480,
    time: 92.35,
    hitFactor: 5.198,
    misses: 0,
    penalties: 0,
    stagePlacement: 5,
    stageTotalCompetitors: 44,
    classifier: false,
    dnf: false,
    notes: 'Imported from PractiScore CSV.',
  })
})

test('skips duplicate PractiScore matches during confirm/apply planning', () => {
  const plan = buildPractiscoreCsvImportPlan(practiscoreCsv, {
    existingMatches: [{ date: new Date('2026-05-12T05:00:00.000Z'), club: 'North Range', matchName: 'Snowcap Steel' }],
  })

  assert.equal(plan.success, true)
  assert.equal(plan.plan.counts.createMatches, 0)
  assert.equal(plan.plan.counts.skipDuplicates, 1)
  assert.equal(plan.plan.actions[0].action, 'skip-duplicate')
})

test('blocks confirm/apply plans when PractiScore rows are missing a match date', () => {
  const plan = buildPractiscoreCsvImportPlan('Match Name,Club,Stage Name\nNo Date Classic,North Range,Stage 1')

  assert.equal(plan.success, false)
  assert.equal(plan.plan.counts.errors, 1)
  assert.match(plan.errors[0].reason, /Match date is required/)
})
